export interface HabitStatus {
  title: string;
  done: boolean;
}

export interface BuiltMessage {
  title: string;
  body: string;
}

/**
 * Pure function: given a section name and today's habit statuses, build the
 * end-of-day reminder message listing ONLY the incomplete habits.
 *
 * Returns null when there is nothing to notify about (no habits, or all done)
 * — the caller stays silent in that case.
 */
export function buildMissedMessage(
  sectionName: string,
  habits: HabitStatus[],
): BuiltMessage | null {
  const missed = habits.filter((h) => !h.done).map((h) => h.title);
  if (missed.length === 0) {
    return null; // all done (or nothing scheduled) -> silent
  }

  // Special-case a single habit for a natural sentence, matching the user's
  // examples ("You didn't read a book today.").
  if (missed.length === 1) {
    return {
      title: sectionName,
      body: `You didn't complete "${missed[0]}" today.`,
    };
  }

  return {
    title: sectionName,
    body: `In today's ${sectionName} you missed: ${missed.join(', ')}.`,
  };
}
