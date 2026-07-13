"use server";

import { revalidatePath } from "next/cache";
import { calculateAnkiReview, getButtonHints as calcButtonHints, type ReviewAction, type CardState, type ButtonHints } from "@/lib/srs";
import { prisma } from "@/lib/db/prisma";
import { Prisma, Flashcard } from "@prisma/client";

export async function getDueCards(deckId: string, userId: string) {
  const now = new Date();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // 1. Check if active StudySession exists
  const activeSession = await prisma.studySession.findUnique({
    where: {
      userId_deckId: { userId, deckId }
    },
    include: {
      cards: {
        include: { card: true },
        orderBy: { orderIndex: "asc" }
      }
    }
  });

  if (activeSession) {
    // Check if any waiting pool cards have become due, and if so, update their dueAt to null
    const dueIntradayCards = activeSession.cards.filter(c => c.dueAt && c.dueAt <= now);
    if (dueIntradayCards.length > 0) {
      await prisma.studySessionCard.updateMany({
        where: {
          id: { in: dueIntradayCards.map(c => c.id) }
        },
        data: { dueAt: null }
      });
    }

    // Reload cards to reflect any database updates
    const refreshedCards = await prisma.studySessionCard.findMany({
      where: { sessionId: activeSession.id },
      include: { card: true },
      orderBy: { orderIndex: "asc" }
    });

    const queue = refreshedCards
      .filter(c => !c.dueAt)
      .map(c => ({
        ...c.card,
        status: c.card.status,
        stepIndex: c.card.stepIndex,
        interval: c.card.interval,
        repetition: c.card.repetition,
        easinessFactor: c.card.easinessFactor,
        nextReviewDate: c.card.nextReviewDate
      }));

    const waitingPool = refreshedCards
      .filter(c => c.dueAt && c.dueAt > now)
      .map(c => ({
        card: {
          ...c.card,
          status: c.card.status,
          stepIndex: c.card.stepIndex,
          interval: c.card.interval,
          repetition: c.card.repetition,
          easinessFactor: c.card.easinessFactor,
          nextReviewDate: c.card.nextReviewDate
        },
        dueAt: c.dueAt!.getTime()
      }));

    return { queue, waitingPool };
  }

  // 2. No active session, get Deck limits
  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    select: { maxNewCardsPerDay: true, maxReviewsPerDay: true },
  });

  if (!deck) {
    throw new Error("Deck not found");
  }

  // 3. Count studied today from CardReviewLog
  const logs = await prisma.cardReviewLog.findMany({
    where: {
      deckId,
      createdAt: {
        gte: startOfDay,
      },
    },
    select: {
      cardId: true,
      status: true,
    },
  });

  const uniqueNewCardIds = new Set(
    logs.filter(l => l.status === "NEW").map(l => l.cardId)
  );
  const uniqueReviewCardIds = new Set(
    logs.filter(l => l.status !== "NEW").map(l => l.cardId)
  );

  const newStudiedToday = uniqueNewCardIds.size;
  const reviewsStudiedToday = uniqueReviewCardIds.size;

  const remainingNew = Math.max(0, deck.maxNewCardsPerDay - newStudiedToday);
  const remainingReviews = Math.max(0, deck.maxReviewsPerDay - reviewsStudiedToday);

  // 4. Fetch due learning/relearning cards (exempt from daily reviews limit!)
  const learningCards = await prisma.flashcard.findMany({
    where: {
      deckId,
      status: { in: ["LEARNING", "RELEARNING"] },
      nextReviewDate: {
        lte: now,
      },
    },
    orderBy: { nextReviewDate: "asc" },
  });

  // 5. Fetch due review cards (limited by daily reviews limit)
  const reviewCards = await prisma.flashcard.findMany({
    where: {
      deckId,
      status: "REVIEW",
      nextReviewDate: {
        lte: now,
      },
    },
    orderBy: { nextReviewDate: "asc" },
    take: remainingReviews,
  });

  // 6. Fetch due new cards
  const newCards = await prisma.flashcard.findMany({
    where: {
      deckId,
      status: "NEW",
      nextReviewDate: {
        lte: now,
      },
    },
    orderBy: { createdAt: "asc" },
    take: remainingNew,
  });

  // 7. Merge and sort by nextReviewDate
  const mergedCards = [...learningCards, ...reviewCards, ...newCards];
  mergedCards.sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime());

  if (mergedCards.length > 0) {
    // Create new StudySession in DB
    const session = await prisma.studySession.create({
      data: {
        userId,
        deckId,
        currentIndex: 0
      }
    });

    await prisma.studySessionCard.createMany({
      data: mergedCards.map((c, i) => ({
        sessionId: session.id,
        cardId: c.id,
        dueAt: null,
        orderIndex: i
      }))
    });
  }

  return {
    queue: mergedCards,
    waitingPool: []
  };
}

export async function reviewCard(cardId: string, action: ReviewAction) {
  const card = await prisma.flashcard.findUnique({
    where: { id: cardId },
    include: {
      studySessionCards: {
        include: { session: true }
      }
    }
  });

  if (!card) {
    throw new Error("Card not found");
  }

  const cardState: CardState = {
    status: card.status as CardState["status"],
    stepIndex: card.stepIndex,
    interval: card.interval,
    repetition: card.repetition,
    easinessFactor: card.easinessFactor,
    nextReviewDate: card.nextReviewDate,
  };

  const result = calculateAnkiReview(cardState, action);

  let updatedCard: Flashcard | null = null;

  await prisma.$transaction(async (tx) => {
    // 1. Log the review in database
    await tx.cardReviewLog.create({
      data: {
        cardId,
        deckId: card.deckId,
        status: card.status,
        action,
      },
    });

    // 2. Update the main Flashcard
    updatedCard = await tx.flashcard.update({
      where: { id: cardId },
      data: {
        status: result.status,
        stepIndex: result.stepIndex,
        interval: result.interval,
        repetition: result.repetition,
        easinessFactor: result.easinessFactor,
        nextReviewDate: result.nextReviewDate,
      },
    });

    // 3. Update StudySessionCard if session exists
    const sessionCard = card.studySessionCards[0];
    if (sessionCard) {
      if (result.isIntraDay) {
        // Find next order index to push to end
        const maxOrderIndexResult = await tx.studySessionCard.aggregate({
          where: { sessionId: sessionCard.sessionId },
          _max: { orderIndex: true }
        });
        const nextOrderIndex = (maxOrderIndexResult._max.orderIndex ?? 0) + 1;

        await tx.studySessionCard.update({
          where: { id: sessionCard.id },
          data: {
            dueAt: result.nextReviewDate,
            orderIndex: nextOrderIndex
          }
        });
      } else {
        // Graduates / moves out of intraday -> remove from study session queue
        await tx.studySessionCard.delete({
          where: { id: sessionCard.id }
        });
      }

      // Check if session has remaining cards
      const remainingCount = await tx.studySessionCard.count({
        where: { sessionId: sessionCard.sessionId }
      });

      if (remainingCount === 0) {
        await tx.studySession.delete({
          where: { id: sessionCard.sessionId }
        });
      }
    }
  });

  revalidatePath(`/decks`);
  revalidatePath(`/decks/${card.deckId}`);
  revalidatePath(`/decks/${card.deckId}/study`);

  if (!updatedCard) {
    throw new Error("Failed to update card");
  }

  return {
    ...(updatedCard as Flashcard),
    isIntraDay: result.isIntraDay,
    dueInMs: result.nextReviewDate.getTime() - Date.now(),
  };
}

export async function getCardButtonHints(cardId: string): Promise<ButtonHints> {
  const card = await prisma.flashcard.findUnique({
    where: { id: cardId },
  });

  if (!card) {
    return { again: "1m", hard: "4m", good: "10m", easy: "2d" };
  }

  return calcButtonHints({
    status: card.status as CardState["status"],
    stepIndex: card.stepIndex,
    interval: card.interval,
    repetition: card.repetition,
    easinessFactor: card.easinessFactor,
    nextReviewDate: card.nextReviewDate,
  });
}

export async function getDeckStats(deckId: string) {
  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    select: { maxNewCardsPerDay: true, maxReviewsPerDay: true },
  });

  if (!deck) {
    throw new Error("Deck not found");
  }

  const now = new Date();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Count studied today
  const logs = await prisma.cardReviewLog.findMany({
    where: {
      deckId,
      createdAt: { gte: startOfDay },
    },
    select: { cardId: true, status: true },
  });

  const uniqueNewCardIds = new Set(logs.filter(l => l.status === "NEW").map(l => l.cardId));
  const uniqueReviewCardIds = new Set(logs.filter(l => l.status !== "NEW").map(l => l.cardId));

  const newStudiedToday = uniqueNewCardIds.size;
  const reviewsStudiedToday = uniqueReviewCardIds.size;

  // Count total cards currently in deck
  const cards = await prisma.flashcard.findMany({
    where: { deckId },
    select: { status: true, nextReviewDate: true },
  });

  const totalNewInDeck = cards.filter(c => c.status === "NEW").length;
  const learningCount = cards.filter(c => 
    (c.status === "LEARNING" || c.status === "RELEARNING") && c.nextReviewDate <= now
  ).length;
  const totalDueReviewsInDeck = cards.filter(c => 
    c.status === "REVIEW" && c.nextReviewDate <= now
  ).length;

  const remainingNew = Math.max(0, Math.min(totalNewInDeck, deck.maxNewCardsPerDay - newStudiedToday));
  const remainingReviews = Math.max(0, Math.min(totalDueReviewsInDeck, deck.maxReviewsPerDay - reviewsStudiedToday));

  const totalNew = totalNewInDeck;
  const totalLearning = cards.filter(c => c.status === "LEARNING" || c.status === "RELEARNING").length;
  const totalDue = cards.filter(c => c.nextReviewDate <= now).length;

  return {
    newStudiedToday,
    maxNewCardsPerDay: deck.maxNewCardsPerDay,
    remainingNew,
    learningCount,
    reviewsStudiedToday,
    maxReviewsPerDay: deck.maxReviewsPerDay,
    remainingReviews,
    totalCards: cards.length,
    totalNew,
    totalLearning,
    totalDue
  };
}

export async function getDeckCards(
  deckId: string, 
  page = 1, 
  pageSize = 100, 
  search = "", 
  status = "ALL"
) {
  const skip = (page - 1) * pageSize;
  const now = new Date();
  
  const where: Prisma.FlashcardWhereInput = { deckId };
  
  if (search) {
    where.OR = [
      { front: { contains: search, mode: "insensitive" } },
      { back: { contains: search, mode: "insensitive" } }
    ];
  }
  
  if (status === "NEW") {
    where.status = "NEW";
  } else if (status === "LEARNING") {
    where.status = { in: ["LEARNING", "RELEARNING"] };
  } else if (status === "DUE") {
    where.nextReviewDate = { lte: now };
  }

  const [cards, total] = await Promise.all([
    prisma.flashcard.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.flashcard.count({ where })
  ]);

  return { cards, total, totalPages: Math.ceil(total / pageSize) };
}

export async function createCard(deckId: string, front: string, back: string) {
  const card = await prisma.flashcard.create({
    data: { deckId, front, back },
  });
  revalidatePath(`/decks/${deckId}`);
  return card;
}

export async function updateCard(cardId: string, front: string, back: string) {
  const card = await prisma.flashcard.update({
    where: { id: cardId },
    data: { front, back },
  });
  revalidatePath(`/decks/${card.deckId}`);
  return card;
}

export async function deleteCard(cardId: string) {
  const card = await prisma.flashcard.delete({
    where: { id: cardId },
  });
  revalidatePath(`/decks/${card.deckId}`);
  return card;
}
