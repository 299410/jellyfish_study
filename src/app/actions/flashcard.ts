"use server";

import { revalidatePath } from "next/cache";
import { calculateAnkiReview, getButtonHints as calcButtonHints, type ReviewAction, type CardState, type ButtonHints } from "@/lib/srs";
import { prisma } from "@/lib/db/prisma";

export async function getDueCards(deckId: string) {
  const now = new Date();
  
  return await prisma.flashcard.findMany({
    where: {
      deckId,
      nextReviewDate: {
        lte: now,
      },
    },
    orderBy: [
      { nextReviewDate: "asc" },
    ],
  });
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
  const cards = await prisma.flashcard.findMany({
    where: { deckId },
    select: { status: true, nextReviewDate: true },
  });

  const now = new Date();

  const newCards = cards.filter(c => c.status === "NEW").length;
  const learningCards = cards.filter(c => 
    (c.status === "LEARNING" || c.status === "RELEARNING") && c.nextReviewDate <= now
  ).length;
  const reviewCards = cards.filter(c => 
    c.status === "REVIEW" && c.nextReviewDate <= now
  ).length;

  return { newCards, learningCards, reviewCards, total: cards.length };
}

export async function getDeckCards(deckId: string, page = 1, pageSize = 100) {
  const skip = (page - 1) * pageSize;
  
  const [cards, total] = await Promise.all([
    prisma.flashcard.findMany({
      where: { deckId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.flashcard.count({ where: { deckId } })
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
