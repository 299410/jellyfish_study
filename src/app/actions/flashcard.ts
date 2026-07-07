"use server";

import { revalidatePath } from "next/cache";
import { calculateAnkiReview, getButtonHints as calcButtonHints, type ReviewAction, type CardState, type ButtonHints } from "@/lib/srs";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

export async function getDueCards(deckId: string) {
  const now = new Date();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // 1. Get Deck limits
  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    select: { maxNewCardsPerDay: true, maxReviewsPerDay: true },
  });

  if (!deck) {
    throw new Error("Deck not found");
  }

  // 2. Count studied today from CardReviewLog
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

  // 3. Fetch due new cards
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

  // 4. Fetch due learning/review/relearning cards
  const reviewCards = await prisma.flashcard.findMany({
    where: {
      deckId,
      status: {
        not: "NEW",
      },
      nextReviewDate: {
        lte: now,
      },
    },
    orderBy: { nextReviewDate: "asc" },
    take: remainingReviews,
  });

  // 5. Merge and return sorted by nextReviewDate
  const mergedCards = [...newCards, ...reviewCards];
  mergedCards.sort((a, b) => a.nextReviewDate.getTime() - b.nextReviewDate.getTime());

  return mergedCards;
}

export async function reviewCard(cardId: string, action: ReviewAction) {
  const card = await prisma.flashcard.findUnique({
    where: { id: cardId },
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

  // Log the review in database
  await prisma.cardReviewLog.create({
    data: {
      cardId,
      deckId: card.deckId,
      status: card.status,
      action,
    },
  });

  const updatedCard = await prisma.flashcard.update({
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

  revalidatePath(`/decks`);
  revalidatePath(`/decks/${card.deckId}`);
  revalidatePath(`/decks/${card.deckId}/study`);

  return {
    ...updatedCard,
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
