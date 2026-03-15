import { DailyPlan, FocusSession, SessionReview, IdeaCapture } from '@/types/focus';

const KEYS = {
  plans: 'focusos_plans',
  sessions: 'focusos_sessions',
  reviews: 'focusos_reviews',
  ideas: 'focusos_ideas',
  currentSession: 'focusos_current_session',
};

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function set(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  // Plans
  getPlans: (): DailyPlan[] => get(KEYS.plans, []),
  savePlan: (plan: DailyPlan) => {
    const plans = storage.getPlans().filter(p => p.date !== plan.date);
    set(KEYS.plans, [...plans, plan]);
  },
  getTodayPlan: (): DailyPlan | null => {
    const today = new Date().toISOString().split('T')[0];
    return storage.getPlans().find(p => p.date === today) ?? null;
  },

  // Sessions
  getSessions: (): FocusSession[] => get(KEYS.sessions, []),
  saveSession: (session: FocusSession) => {
    const sessions = storage.getSessions();
    const idx = sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) sessions[idx] = session; else sessions.push(session);
    set(KEYS.sessions, sessions);
  },
  getTodaySessions: (): FocusSession[] => {
    const today = new Date().toISOString().split('T')[0];
    return storage.getSessions().filter(s => s.date === today);
  },

  // Current session
  getCurrentSession: (): FocusSession | null => get(KEYS.currentSession, null),
  setCurrentSession: (s: FocusSession | null) => set(KEYS.currentSession, s),

  // Reviews
  getReviews: (): SessionReview[] => get(KEYS.reviews, []),
  saveReview: (review: SessionReview) => {
    const reviews = storage.getReviews();
    reviews.push(review);
    set(KEYS.reviews, reviews);
  },
  getTodayReviews: (): SessionReview[] => {
    const today = new Date().toISOString().split('T')[0];
    return storage.getReviews().filter(r => r.date === today);
  },
  getWeekReviews: (): SessionReview[] => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
    return storage.getReviews().filter(r => r.date >= weekAgo);
  },

  // Ideas
  getIdeas: (): IdeaCapture[] => get(KEYS.ideas, []),
  saveIdea: (idea: IdeaCapture) => {
    const ideas = storage.getIdeas();
    ideas.push(idea);
    set(KEYS.ideas, ideas);
  },
};
