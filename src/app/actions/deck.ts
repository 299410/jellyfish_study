"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function getDecks(userId: string) {
  const decks = await prisma.deck.findMany({
    where: { userId },
    include: {
      _count: {
        select: { cards: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  
  // Fetch due cards count for each deck
  const now = new Date();
  const decksWithDueCount = await Promise.all(
    decks.map(async (deck) => {
      const dueCount = await prisma.flashcard.count({
        where: {
          deckId: deck.id,
          nextReviewDate: {
            lte: now,
          },
        },
      });
      return {
        ...deck,
        dueCount,
      };
    })
  );

  return decksWithDueCount;
}

export async function getDeck(id: string) {
  return await prisma.deck.findUnique({
    where: { id },
  });
}

export async function createDeck(userId: string, name: string, description: string) {
  const deck = await prisma.deck.create({
    data: {
      userId,
      name,
      description,
    },
  });
  
  revalidatePath("/decks");
  return deck;
}

export async function bulkAddCards(deckId: string, cards: { front: string; back: string }[]) {
  const result = await prisma.flashcard.createMany({
    data: cards.map((c) => ({
      deckId,
      front: c.front,
      back: c.back,
    })),
  });
  
  revalidatePath(`/decks`);
  revalidatePath(`/decks/${deckId}`);
  revalidatePath(`/decks/${deckId}/study`);
  return result;
}

export async function updateDeck(id: string, name: string, description: string) {
  const deck = await prisma.deck.update({
    where: { id },
    data: { name, description },
  });
  revalidatePath('/decks');
  revalidatePath('/decks/' + id);
  return deck;
}

export async function deleteDeck(id: string) {
  await prisma.deck.delete({ where: { id } });
  revalidatePath('/decks');
}
