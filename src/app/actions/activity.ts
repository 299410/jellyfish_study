"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function logActivity(
  userId: string,
  activity: "FLASHCARD" | "FREE_CHAT" | "INTERVIEW",
  durationInSeconds: number
) {
  if (durationInSeconds < 2) return null; // Avoid logging micro-seconds clicks
  
  return await prisma.activityLog.create({
    data: {
      userId,
      activity,
      duration: durationInSeconds,
    },
  });
}

export async function getDashboardStats(userId: string) {
  const now = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setDate(oneYearAgo.getDate() - 365);
  oneYearAgo.setHours(0, 0, 0, 0);

  const logs = await prisma.activityLog.findMany({
    where: {
      userId,
      createdAt: {
        gte: oneYearAgo,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Aggregate duration by date string (YYYY-MM-DD)
  const heatmapData: Record<string, number> = {};
  let totalSeconds = 0;

  logs.forEach((log) => {
    totalSeconds += log.duration;
    // Format date in local time zone offset or UTC
    // We'll use YYYY-MM-DD
    const dateStr = log.createdAt.toLocaleDateString("en-CA"); // Formats as YYYY-MM-DD safely
    const minutes = log.duration / 60;
    heatmapData[dateStr] = (heatmapData[dateStr] || 0) + minutes;
  });

  // Round up active minutes for each day
  Object.keys(heatmapData).forEach((date) => {
    heatmapData[date] = Math.ceil(heatmapData[date]);
  });

  // Calculate study streak
  let currentStreak = 0;
  const checkDate = new Date(); // Start from today
  checkDate.setHours(0, 0, 0, 0);

  while (true) {
    const dateStr = checkDate.toLocaleDateString("en-CA");
    if (heatmapData[dateStr] && heatmapData[dateStr] > 0) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1); // Go back 1 day
    } else {
      // If we are checking today, and there's no activity, check yesterday to preserve streak
      const todayStr = new Date().toLocaleDateString("en-CA");
      if (dateStr === todayStr) {
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterdayStr = checkDate.toLocaleDateString("en-CA");
        if (heatmapData[yesterdayStr] && heatmapData[yesterdayStr] > 0) {
          // Yesterday was active, continue counting backwards from yesterday
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
      }
      break;
    }
  }

  // Calculate longest streak in the last year
  let longestStreak = 0;
  let tempStreak = 0;
  const daySweep = new Date(oneYearAgo);
  const todayStr = new Date().toLocaleDateString("en-CA");

  while (daySweep <= now) {
    const sweepStr = daySweep.toLocaleDateString("en-CA");
    if (heatmapData[sweepStr] && heatmapData[sweepStr] > 0) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
    daySweep.setDate(daySweep.getDate() + 1);
  }

  return {
    heatmap: Object.entries(heatmapData).map(([date, minutes]) => ({ date, count: minutes })),
    currentStreak,
    longestStreak,
    totalMinutes: Math.ceil(totalSeconds / 60),
  };
}
