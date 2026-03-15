import { TimeBlock, BlockCategory } from '@/types/focus';

interface PlanInput {
  startTime: string;
  endTime: string;
  priorities: string[];
  additionalTasks: string[];
  fixedCommitments: string[];
  energyLevel: number;
  desiredDeepWorkHours: number;
  desiredLearningHours: number;
}

let blockIdCounter = 0;
function makeId() { return `block_${Date.now()}_${blockIdCounter++}`; }

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function generateSchedule(input: PlanInput): { blocks: TimeBlock[]; summary: string } {
  const blocks: TimeBlock[] = [];
  const start = timeToMinutes(input.startTime);
  const end = timeToMinutes(input.endTime);
  let cursor = start;

  // Planning block
  blocks.push({ id: makeId(), title: 'Morning Planning', category: 'planning', startTime: minutesToTime(cursor), endTime: minutesToTime(cursor + 30) });
  cursor += 30;

  // Deep work - priorities (morning, when energy highest)
  const deepWorkMinutes = Math.min(input.desiredDeepWorkHours * 60, (end - cursor) * 0.5);
  const priorityBlocks = input.priorities.slice(0, 3);

  for (let i = 0; i < priorityBlocks.length && cursor + 45 <= end; i++) {
    const duration = input.energyLevel >= 7 ? 90 : input.energyLevel >= 4 ? 60 : 45;
    const blockEnd = Math.min(cursor + duration, end);
    if (blockEnd <= cursor) break;
    blocks.push({ id: makeId(), title: priorityBlocks[i], category: 'deepwork', startTime: minutesToTime(cursor), endTime: minutesToTime(blockEnd), priorityIndex: i });
    cursor = blockEnd;

    // Break after deep work
    if (cursor + 15 <= end && i < priorityBlocks.length - 1) {
      blocks.push({ id: makeId(), title: 'Break', category: 'break', startTime: minutesToTime(cursor), endTime: minutesToTime(cursor + 15) });
      cursor += 15;
    }
  }

  // Lunch break if past noon
  if (cursor >= 720 && cursor < 780) {
    blocks.push({ id: makeId(), title: 'Lunch Break', category: 'break', startTime: minutesToTime(cursor), endTime: minutesToTime(cursor + 60) });
    cursor += 60;
  } else if (cursor < 720 && end > 780) {
    // Insert lunch at noon
    if (cursor < 720) {
      // Fill gap with execution
      const tasks = [...input.additionalTasks];
      while (cursor + 30 <= 720 && tasks.length > 0) {
        const t = tasks.shift()!;
        const blockEnd = Math.min(cursor + 45, 720);
        blocks.push({ id: makeId(), title: t, category: 'execution', startTime: minutesToTime(cursor), endTime: minutesToTime(blockEnd) });
        cursor = blockEnd;
      }
      if (cursor < 720) {
        blocks.push({ id: makeId(), title: 'Execution / Admin', category: 'execution', startTime: minutesToTime(cursor), endTime: minutesToTime(720) });
        cursor = 720;
      }
    }
    blocks.push({ id: makeId(), title: 'Lunch Break', category: 'break', startTime: minutesToTime(720), endTime: minutesToTime(780) });
    cursor = 780;
  }

  // Afternoon - execution tasks
  const remainingTasks = input.additionalTasks.filter(t => !blocks.some(b => b.title === t));
  for (const task of remainingTasks) {
    if (cursor + 30 > end) break;
    const blockEnd = Math.min(cursor + 45, end);
    blocks.push({ id: makeId(), title: task, category: 'execution', startTime: minutesToTime(cursor), endTime: minutesToTime(blockEnd) });
    cursor = blockEnd;

    if (cursor + 10 <= end) {
      blocks.push({ id: makeId(), title: 'Short Break', category: 'break', startTime: minutesToTime(cursor), endTime: minutesToTime(cursor + 10) });
      cursor += 10;
    }
  }

  // Evening - learning
  const learningMinutes = Math.min(input.desiredLearningHours * 60, end - cursor);
  if (learningMinutes >= 30) {
    blocks.push({ id: makeId(), title: 'Learning / Study', category: 'learning', startTime: minutesToTime(cursor), endTime: minutesToTime(cursor + learningMinutes) });
    cursor += learningMinutes;
  }

  // Fill remaining with flexible time
  if (end - cursor >= 15) {
    blocks.push({ id: makeId(), title: 'Buffer / Wrap-up', category: 'execution', startTime: minutesToTime(cursor), endTime: minutesToTime(end) });
  }

  // Generate summary
  const deepBlocks = blocks.filter(b => b.category === 'deepwork');
  const learnBlocks = blocks.filter(b => b.category === 'learning');
  const summary = input.energyLevel >= 7
    ? `Based on your high energy (${input.energyLevel}/10), I scheduled your ${deepBlocks.length} hardest priorities in the morning for maximum deep work. ${learnBlocks.length > 0 ? 'Learning is set for the evening when your mind can explore.' : ''}`
    : input.energyLevel >= 4
    ? `With moderate energy (${input.energyLevel}/10), I kept deep work blocks at 60 minutes to maintain quality. Execution tasks are placed after lunch.`
    : `Your energy is low today (${input.energyLevel}/10), so I shortened deep work blocks to 45 minutes with frequent breaks. Be kind to yourself.`;

  return { blocks, summary };
}

export function getSwitchRecommendation(reason: string): string {
  const map: Record<string, string> = {
    "I'm blocked": "If you're truly blocked, capture the blocker and switch. But first: can you rewrite the next action into something smaller?",
    "I'm bored": "Boredom often means you're close to a breakthrough. Try 10 more minutes. If still stuck, capture your state and take a 5-min walk.",
    "Another task feels urgent": "Urgency is usually an illusion. Capture the idea and return to your mission. You can tackle it in the next block.",
    "AI is loading / waiting": "Use the wait time to review your work or plan the next micro-step. Don't open a new tab.",
    "I lost clarity": "Write down exactly where you are and what's unclear. Often, writing restores clarity. If not, rewrite your mission statement.",
  };
  return map[reason] || "Take a breath. Refocus on your mission. You chose this block for a reason.";
}

export function generateReviewSummary(review: {
  flowScore: number; focusScore: number; productivityScore: number;
  energyScore: number; motivationScore: number; distractionCount: number;
  contextSwitched: boolean; missionCompleted: boolean;
}): string {
  const avg = (review.flowScore + review.focusScore + review.productivityScore) / 3;
  const parts: string[] = [];

  if (avg >= 8) parts.push("Excellent session — you were in the zone.");
  else if (avg >= 6) parts.push("Solid session with room for improvement.");
  else parts.push("Tough session. That's okay — awareness is the first step.");

  if (review.missionCompleted) parts.push("Mission accomplished ✓");
  else parts.push("Mission incomplete — consider breaking it smaller next time.");

  if (review.distractionCount > 3) parts.push(`${review.distractionCount} distractions noted — try removing triggers.`);
  if (review.contextSwitched) parts.push("You context-switched. Notice what pulled you away.");
  if (review.energyScore <= 3) parts.push("Low energy detected — schedule a break or lighter work next.");

  return parts.join(' ');
}
