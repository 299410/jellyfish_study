"use server";

import { prisma } from "@/lib/db/prisma";

export async function createUser(name: string) {
  const user = await prisma.user.create({
    data: { name },
  });
  return user;
}

export async function getUser(id: string) {
  return await prisma.user.findUnique({
    where: { id },
  });
}
