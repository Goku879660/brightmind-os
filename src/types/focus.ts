export type BlockCategory = 'planning' | 'deepwork' | 'execution' | 'learning' | 'break';

export interface TimeBlock {
  id: string;
  title: string;
  category: BlockCategory;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  priorityIndex?: number;
}

export interface DailyPlan {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  priorities: string[];
  additionalTasks: string[];
  fixedCommitments: string[];
  energyLevel: number;
  motivationLevel: number;
  desiredDeepWorkHours: number;
  desiredLearningHours: number;
  blocks: TimeBlock[];
  coachSummary: string;
  createdAt: string;
}

export type FocusMethod = '45/5' | '60/10' | '90/15' | 'custom';

export interface FocusSession {
  id: string;
  date: string;
  blockId?: string;
  method: FocusMethod;
  customWork?: number;
  customBreak?: number;
  mission: string;
  startedAt: string;
  endedAt?: string;
  ideaCaptures: string[];
  switchAttempts: SwitchAttempt[];
  status: 'active' | 'paused' | 'completed' | 'cancelled';
}

export interface SwitchAttempt {
  reason: string;
  recommendation: string;
  timestamp: string;
}

export interface SessionReview {
  id: string;
  sessionId: string;
  date: string;
  flowScore: number;
  focusScore: number;
  productivityScore: number;
  energyScore: number;
  motivationScore: number;
  distractionCount: number;
  contextSwitched: boolean;
  missionCompleted: boolean;
  note: string;
  summary: string;
  createdAt: string;
}

export interface IdeaCapture {
  id: string;
  sessionId: string;
  text: string;
  timestamp: string;
}

export interface AppState {
  currentSession: FocusSession | null;
  todayPlan: DailyPlan | null;
}
