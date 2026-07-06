/**
 * Anki-style Spaced Repetition Algorithm
 * 
 * Card lifecycle: NEW → LEARNING → REVIEW ⇄ RELEARNING
 * 
 * LEARNING/RELEARNING: Intra-day scheduling (minutes)
 * REVIEW: Inter-day scheduling (days) using modified SM-2
 */

// ─── Types ───────────────────────────────────────────────────

export type CardStatus = "NEW" | "LEARNING" | "REVIEW" | "RELEARNING";
export type ReviewAction = "again" | "hard" | "good" | "easy";

export interface CardState {
  status: CardStatus;
  stepIndex: number;
  interval: number;       // days (only meaningful in REVIEW)
  repetition: number;
  easinessFactor: number;
  nextReviewDate: Date;
}

export interface ReviewResult extends CardState {
  isIntraDay: boolean;    // true = card comes back in minutes (LEARNING/RELEARNING)
}

export interface ButtonHints {
  again: string;
  hard: string;
  good: string;
  easy: string;
}

// ─── Configuration ───────────────────────────────────────────

const CONFIG = {
  // Learning phase (minutes)
  learningSteps: [1, 10],
  hardLearningMinutes: 4,
  graduatingInterval: 1,       // days
  easyInterval: 2,             // days

  // Relearning phase (minutes)
  relearningSteps: [10],
  hardRelearningMinutes: 15,

  // Review phase multipliers
  hardIntervalMultiplier: 1.2,
  easyBonus: 1.3,
  lapseNewInterval: 0.7,       // when lapsing, new interval = old * this

  // Ease factor
  startingEase: 2.5,
  minimumEase: 1.3,
  easeAgainDelta: -0.20,
  easeHardDelta: -0.15,
  easeEasyDelta: +0.15,
};

// ─── Core Algorithm ──────────────────────────────────────────

export function calculateAnkiReview(card: CardState, action: ReviewAction): ReviewResult {
  switch (card.status) {
    case "NEW":
      return reviewNew(card, action);
    case "LEARNING":
      return reviewLearning(card, action);
    case "REVIEW":
      return reviewReview(card, action);
    case "RELEARNING":
      return reviewRelearning(card, action);
    default:
      return reviewNew(card, action);
  }
}

// ─── NEW state ───────────────────────────────────────────────

function reviewNew(card: CardState, action: ReviewAction): ReviewResult {
  const ef = card.easinessFactor;

  switch (action) {
    case "again":
      return makeResult("LEARNING", 0, 0, 0, ef, addMinutes(CONFIG.learningSteps[0]));

    case "hard":
      return makeResult("LEARNING", 0, 0, 0, ef, addMinutes(CONFIG.hardLearningMinutes));

    case "good":
      return makeResult("LEARNING", 1, 0, 0, ef, addMinutes(CONFIG.learningSteps[1] ?? CONFIG.learningSteps[0]));

    case "easy":
      return makeResult("REVIEW", 0, CONFIG.easyInterval, 1, ef, addDays(CONFIG.easyInterval));
  }
}

// ─── LEARNING state ──────────────────────────────────────────

function reviewLearning(card: CardState, action: ReviewAction): ReviewResult {
  const ef = card.easinessFactor;
  const steps = CONFIG.learningSteps;

  switch (action) {
    case "again":
      // Reset to step 0
      return makeResult("LEARNING", 0, 0, 0, ef, addMinutes(steps[0]));

    case "hard":
      // Stay at current step, but wait longer
      return makeResult("LEARNING", card.stepIndex, 0, 0, ef, addMinutes(CONFIG.hardLearningMinutes));

    case "good": {
      const nextStep = card.stepIndex + 1;
      if (nextStep >= steps.length) {
        // Graduate! → REVIEW
        return makeResult("REVIEW", 0, CONFIG.graduatingInterval, 1, ef, addDays(CONFIG.graduatingInterval));
      }
      // Move to next step
      return makeResult("LEARNING", nextStep, 0, 0, ef, addMinutes(steps[nextStep]));
    }

    case "easy":
      // Skip all steps, graduate immediately
      return makeResult("REVIEW", 0, CONFIG.easyInterval, 1, ef, addDays(CONFIG.easyInterval));
  }
}

// ─── REVIEW state ────────────────────────────────────────────

function reviewReview(card: CardState, action: ReviewAction): ReviewResult {
  let ef = card.easinessFactor;
  const oldInterval = Math.max(card.interval, 1);

  switch (action) {
    case "again": {
      // Lapse! → RELEARNING
      ef = Math.max(CONFIG.minimumEase, ef + CONFIG.easeAgainDelta);
      const newInterval = Math.max(1, Math.round(oldInterval * CONFIG.lapseNewInterval));
      return makeResult("RELEARNING", 0, newInterval, 0, ef, addMinutes(CONFIG.relearningSteps[0]));
    }

    case "hard": {
      ef = Math.max(CONFIG.minimumEase, ef + CONFIG.easeHardDelta);
      const newInterval = Math.max(oldInterval + 1, Math.round(oldInterval * CONFIG.hardIntervalMultiplier));
      return makeResult("REVIEW", 0, newInterval, card.repetition + 1, ef, addDays(newInterval));
    }

    case "good": {
      const newInterval = Math.max(oldInterval + 1, Math.round(oldInterval * ef));
      return makeResult("REVIEW", 0, newInterval, card.repetition + 1, ef, addDays(newInterval));
    }

    case "easy": {
      ef = Math.min(5.0, ef + CONFIG.easeEasyDelta);
      const newInterval = Math.max(oldInterval + 1, Math.round(oldInterval * ef * CONFIG.easyBonus));
      return makeResult("REVIEW", 0, newInterval, card.repetition + 1, ef, addDays(newInterval));
    }
  }
}

// ─── RELEARNING state ────────────────────────────────────────

function reviewRelearning(card: CardState, action: ReviewAction): ReviewResult {
  const ef = card.easinessFactor;
  const steps = CONFIG.relearningSteps;

  switch (action) {
    case "again":
      // Reset to step 0
      return makeResult("RELEARNING", 0, card.interval, 0, ef, addMinutes(steps[0]));

    case "hard":
      // Stay at current step, wait longer
      return makeResult("RELEARNING", card.stepIndex, card.interval, 0, ef, addMinutes(CONFIG.hardRelearningMinutes));

    case "good": {
      const nextStep = card.stepIndex + 1;
      if (nextStep >= steps.length) {
        // Back to REVIEW with the (already reduced) interval
        return makeResult("REVIEW", 0, card.interval, card.repetition + 1, ef, addDays(card.interval));
      }
      return makeResult("RELEARNING", nextStep, card.interval, 0, ef, addMinutes(steps[nextStep]));
    }

    case "easy":
      // Back to REVIEW immediately
      return makeResult("REVIEW", 0, card.interval, card.repetition + 1, ef, addDays(card.interval));
  }
}

// ─── Button Hints ────────────────────────────────────────────

export function getButtonHints(card: CardState): ButtonHints {
  switch (card.status) {
    case "NEW":
      return {
        again: formatMinutes(CONFIG.learningSteps[0]),
        hard: formatMinutes(CONFIG.hardLearningMinutes),
        good: formatMinutes(CONFIG.learningSteps[1] ?? CONFIG.learningSteps[0]),
        easy: formatDays(CONFIG.easyInterval),
      };

    case "LEARNING": {
      const steps = CONFIG.learningSteps;
      const nextStep = card.stepIndex + 1;
      const isGraduating = nextStep >= steps.length;
      return {
        again: formatMinutes(steps[0]),
        hard: formatMinutes(CONFIG.hardLearningMinutes),
        good: isGraduating ? formatDays(CONFIG.graduatingInterval) : formatMinutes(steps[nextStep]),
        easy: formatDays(CONFIG.easyInterval),
      };
    }

    case "REVIEW": {
      const oldInterval = Math.max(card.interval, 1);
      const ef = card.easinessFactor;
      return {
        again: formatMinutes(CONFIG.relearningSteps[0]),
        hard: formatDays(Math.max(oldInterval + 1, Math.round(oldInterval * CONFIG.hardIntervalMultiplier))),
        good: formatDays(Math.max(oldInterval + 1, Math.round(oldInterval * ef))),
        easy: formatDays(Math.max(oldInterval + 1, Math.round(oldInterval * ef * CONFIG.easyBonus))),
      };
    }

    case "RELEARNING": {
      return {
        again: formatMinutes(CONFIG.relearningSteps[0]),
        hard: formatMinutes(CONFIG.hardRelearningMinutes),
        good: formatDays(card.interval),
        easy: formatDays(card.interval),
      };
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function makeResult(
  status: CardStatus,
  stepIndex: number,
  interval: number,
  repetition: number,
  easinessFactor: number,
  nextReviewDate: Date
): ReviewResult {
  return {
    status,
    stepIndex,
    interval,
    repetition,
    easinessFactor,
    nextReviewDate,
    isIntraDay: status === "LEARNING" || status === "RELEARNING",
  };
}

function addMinutes(minutes: number): Date {
  const date = new Date();
  date.setTime(date.getTime() + minutes * 60 * 1000);
  return date;
}

function addDays(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(0, 0, 0, 0); // Set to beginning of day for consistent due dates
  return date;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  return `${hours}h`;
}

function formatDays(days: number): string {
  if (days === 1) return "1d";
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}
