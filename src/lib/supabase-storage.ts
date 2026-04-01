import { supabase } from '@/integrations/supabase/client';

export interface PlanRow {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  priorities: string[];
  tasks: string[];
  commitments: string[];
  energy_level: number;
  motivation_level: number;
  deep_work_hours: number;
  learning_hours: number;
  schedule_blocks: any[];
  task_completion: Record<string, boolean>;
  coach_summary: string | null;
  created_at: string;
}

export interface SessionRow {
  id: string;
  plan_id: string | null;
  date: string;
  method: string;
  focus_minutes: number;
  break_minutes: number;
  mission: string;
  started_at: string;
  ended_at: string | null;
  idea_captures: string[];
  switch_attempts: any[];
}

export interface ReviewRow {
  id: string;
  session_id: string;
  flow: number;
  focus: number;
  productivity: number;
  energy: number;
  motivation: number;
  times_distracted: number;
  context_switched: boolean;
  mission_completed: boolean;
  note: string | null;
  ai_summary: string | null;
  created_at: string;
}

export interface IdeaRow {
  id: string;
  session_id: string;
  raw_text: string;
  cleaned_text: string | null;
  ai_expansion: string | null;
  created_at: string;
  archived: boolean;
}

export interface WeeklyInsightRow {
  id: string;
  week_start: string;
  insight_text: string;
  created_at: string;
}

// Plans
export async function getPlanByDate(date: string): Promise<PlanRow | null> {
  const { data } = await supabase
    .from('plans')
    .select('*')
    .eq('date', date)
    .maybeSingle();
  return data as PlanRow | null;
}

export async function upsertPlan(plan: Omit<PlanRow, 'id' | 'created_at'> & { id?: string }) {
  const { data, error } = await supabase
    .from('plans')
    .upsert(plan as any, { onConflict: 'date' })
    .select()
    .single();
  if (error) throw error;
  return data as PlanRow;
}

export async function updateTaskCompletion(date: string, taskCompletion: Record<string, boolean>) {
  const { error } = await supabase
    .from('plans')
    .update({ task_completion: taskCompletion as any })
    .eq('date', date);
  if (error) throw error;
}

// Sessions
export async function createSession(session: Omit<SessionRow, 'id'>) {
  const { data, error } = await supabase
    .from('sessions')
    .insert(session as any)
    .select()
    .single();
  if (error) throw error;
  return data as SessionRow;
}

export async function endSession(id: string) {
  const { error } = await supabase
    .from('sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function getActiveSession(): Promise<SessionRow | null> {
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as SessionRow | null;
}

export async function getTodaySessions(): Promise<SessionRow[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .eq('date', today)
    .not('ended_at', 'is', null);
  return (data || []) as SessionRow[];
}

export async function getWeekSessions(): Promise<SessionRow[]> {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const weekStart = monday.toISOString().split('T')[0];
  
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .gte('date', weekStart)
    .not('ended_at', 'is', null);
  return (data || []) as SessionRow[];
}

export async function getLastCompletedUnreviewedSession(): Promise<SessionRow | null> {
  // Get all sessions with ended_at set
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .not('ended_at', 'is', null)
    .order('ended_at', { ascending: false })
    .limit(5);

  if (!sessions || sessions.length === 0) return null;

  // Check which have reviews
  for (const session of sessions) {
    const { data: review } = await supabase
      .from('reviews')
      .select('id')
      .eq('session_id', session.id)
      .maybeSingle();
    if (!review) return session as SessionRow;
  }
  return null;
}

// Reviews
export async function createReview(review: Omit<ReviewRow, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('reviews')
    .insert(review as any)
    .select()
    .single();
  if (error) throw error;
  return data as ReviewRow;
}

export async function updateReviewAiSummary(id: string, aiSummary: string) {
  await supabase.from('reviews').update({ ai_summary: aiSummary }).eq('id', id);
}

export async function getTodayReviews(): Promise<ReviewRow[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`);
  return (data || []) as ReviewRow[];
}

export async function getWeekReviews(): Promise<ReviewRow[]> {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const weekStart = monday.toISOString().split('T')[0];
  
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .gte('created_at', `${weekStart}T00:00:00`);
  return (data || []) as ReviewRow[];
}

// Ideas
export async function createIdea(idea: { session_id: string; raw_text: string }) {
  const { data, error } = await supabase
    .from('ideas')
    .insert({ ...idea, cleaned_text: idea.raw_text } as any)
    .select()
    .single();
  if (error) throw error;
  return data as IdeaRow;
}

export async function updateIdeaAI(id: string, cleaned_text: string, ai_expansion: string) {
  await supabase.from('ideas').update({ cleaned_text, ai_expansion } as any).eq('id', id);
}

export async function getUnarchivedIdeas(): Promise<IdeaRow[]> {
  const { data } = await supabase
    .from('ideas')
    .select('*')
    .eq('archived', false)
    .order('created_at', { ascending: false });
  return (data || []) as IdeaRow[];
}

export async function archiveIdea(id: string) {
  await supabase.from('ideas').update({ archived: true } as any).eq('id', id);
}

// Weekly insights
export async function getWeeklyInsight(weekStart: string): Promise<WeeklyInsightRow | null> {
  const { data } = await supabase
    .from('weekly_insights')
    .select('*')
    .eq('week_start', weekStart)
    .maybeSingle();
  return data as WeeklyInsightRow | null;
}

export async function saveWeeklyInsight(weekStart: string, insightText: string) {
  const { error } = await supabase
    .from('weekly_insights')
    .upsert({ week_start: weekStart, insight_text: insightText } as any, { onConflict: 'week_start' });
  if (error) throw error;
}

// Streak calculation
export async function getStreak(): Promise<number> {
  const { data } = await supabase
    .from('sessions')
    .select('date')
    .not('ended_at', 'is', null)
    .order('date', { ascending: false });
  
  if (!data || data.length === 0) return 0;
  
  const dates = [...new Set(data.map((s: any) => s.date))].sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  let streak = 0;
  
  for (let i = 0; i < 365; i++) {
    const d = new Date(new Date().getTime() - i * 86400000).toISOString().split('T')[0];
    if (dates.includes(d)) streak++;
    else if (i > 0) break;
  }
  return streak;
}
