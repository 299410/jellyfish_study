"use server";

import { prisma } from "@/lib/db/prisma";
import { createSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function loginAction(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const pin = formData.get("pin") as string;

  if (!name || !pin || pin.length !== 4) {
    return { error: "Please enter a valid Nickname and 4-digit PIN." };
  }

  const normalizedName = name.trim().toLowerCase();

  try {
    let user = await prisma.user.findUnique({
      where: { name: normalizedName },
    });

    if (user) {
      if (user.pin !== pin) {
        return { error: "Incorrect PIN." };
      }
    } else {
      user = await prisma.user.create({
        data: {
          name: normalizedName,
          pin: pin,
          lastActiveAt: new Date(),
        },
      });
    }

    const now = new Date();
    let updatedStreak = user.currentStreak;
    
    if (user.lastActiveAt) {
      const diffInHours = (now.getTime() - user.lastActiveAt.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours > 24 && diffInHours < 48) {
        updatedStreak += 1;
      } else if (diffInHours >= 48) {
        updatedStreak = 0;
      }
    } else {
      updatedStreak = 1;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        currentStreak: updatedStreak,
        longestStreak: Math.max(user.longestStreak, updatedStreak),
        lastActiveAt: now,
      },
    });

    await createSession(user.id, user.name);

  } catch (error) {
    console.error("Login error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }

  redirect("/");
}
