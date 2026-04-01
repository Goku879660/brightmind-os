import { useState, useEffect } from 'react';
import { StatCard } from '@/components/StatCard';
import {
  getTodaySessions, getTodayReviews, getWeekReviews, getWeekSessions,
  getStreak, getUnarchivedIdeas, archiveIdea, getWeeklyInsight, saveWeeklyInsight,
  IdeaRow,
} from '@/lib/supabase-storage';
import { hasOpenAIKey, callOpenAI } from '@/lib/openai';
import { ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InsightsPage() {
  const [sessionsToday, setSessionsToday] = useState(0);
  const [prioritiesDone, setPrioritiesDone] = useState(0);
  const [avgFocus, setAvgFocus] = useState<string>('—');
  const [avgEnergy, setAvgEnergy] = useState<string>('—');
  const [distractions, setDistractions] = useState(0);
  const [contextSwitches, setContextSwitches] = useState(0);
  const [streak, setStreakVal] = useState(0);
  const [weekAvgFocus, setWeekAvgFocus] = useState<string>('—');
  const [bestMethod, setBestMethod] = useState<string>('—');
  const [weeklyInsight, setWeeklyInsight] = useState<string>('');
  const [ideas, setIdeas] = useState<IdeaRow[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<IdeaRow | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [todaySess, todayRevs, weekRevs, weekSess, streakVal, ideaList] = await Promise.all([
      getTodaySessions(),
      getTodayReviews(),
      getWeekReviews(),
      getWeekSessions(),
      getStreak(),
      getUnarchivedIdeas(),
    ]);

    setSessionsToday(todaySess.length);
    setPrioritiesDone(todayRevs.filter(r => r.mission_completed).length);
    setAvgFocus(todayRevs.length > 0 ? (todayRevs.reduce((s, r) => s + r.focus, 0) / todayRevs.length).toFixed(1) : '—');
    setAvgEnergy(todayRevs.length > 0 ? (todayRevs.reduce((s, r) => s + r.energy, 0) / todayRevs.length).toFixed(1) : '—');
    setDistractions(todayRevs.reduce((s, r) => s + r.times_distracted, 0));
    setContextSwitches(todayRevs.filter(r => r.context_switched).length);
    setStreakVal(streakVal);
    setWeekAvgFocus(weekRevs.length > 0 ? (weekRevs.reduce((s, r) => s + r.focus, 0) / weekRevs.length).toFixed(1) : '—');
    setIdeas(ideaList);

    // Best method this week
    if (weekSess.length > 0 && weekRevs.length > 0) {
      const methodScores: Record<string, { total: number; count: number }> = {};
      for (const sess of weekSess) {
        const rev = weekRevs.find(r => r.session_id === sess.id);
        if (rev) {
          if (!methodScores[sess.method]) methodScores[sess.method] = { total: 0, count: 0 };
          methodScores[sess.method].total += rev.focus;
          methodScores[sess.method].count++;
        }
      }
      const best = Object.entries(methodScores).sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count))[0];
      setBestMethod(best ? best[0] : '—');
    }

    // Weekly insight
    const now = new Date();
    const day = now.getDay();
    const dayOfWeek = day === 0 ? 6 : day - 1; // Mon=0
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);
    const weekStart = monday.toISOString().split('T')[0];

    if (dayOfWeek >= 3 && weekSess.length >= 3 && hasOpenAIKey()) {
      const existing = await getWeeklyInsight(weekStart);
      if (existing) {
        setWeeklyInsight(existing.insight_text);
      } else {
        try {
          const sessionData = weekSess.map(s => `Method: ${s.method}, Duration: ${s.focus_minutes}min, Mission: ${s.mission}`).join('\n');
          const reviewData = weekRevs.map(r => `Focus: ${r.focus}, Energy: ${r.energy}, Flow: ${r.flow}, Productivity: ${r.productivity}, Distracted: ${r.times_distracted}x, Mission completed: ${r.mission_completed}`).join('\n');
          const result = await callOpenAI(
            'You are a focus performance analyst. Give one specific, direct sentence.',
            `In one sentence, tell this person when they focus best based on this data, and what time or condition they should protect going forward. Be specific and direct.\n\nSessions:\n${sessionData}\n\nReviews:\n${reviewData}`
          );
          setWeeklyInsight(result);
          await saveWeeklyInsight(weekStart, result);
        } catch (e) {
          console.error('Weekly insight failed:', e);
        }
      }
    }
  };

  const handleArchive = async (id: string) => {
    await archiveIdea(id);
    setIdeas(ideas.filter(i => i.id !== id));
    setSelectedIdea(null);
  };

  return (
    <div className="h-screen overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        {/* Section 1: Focus Stats */}
        <div>
          <h1 className="text-xl font-bold text-foreground">Today's Focus</h1>
          <p className="text-sm text-muted-foreground mt-1">Your focus patterns at a glance.</p>
        </div>

        <div className="grid grid-cols-3 gap-3" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <StatCard label="Sessions Today" value={sessionsToday} variant="primary" />
          <StatCard label="Priorities Done" value={prioritiesDone} variant="success" />
          <StatCard label="Avg Focus" value={avgFocus} sublabel="today" />
          <StatCard label="Avg Energy" value={avgEnergy} sublabel="today" />
          <StatCard label="Distractions" value={distractions} variant={distractions > 5 ? 'warning' : 'default'} />
          <StatCard label="Context Switches" value={contextSwitches} variant={contextSwitches > 2 ? 'warning' : 'default'} />
          <StatCard label="Current Streak" value={`${streak} day${streak !== 1 ? 's' : ''}`} variant="success" />
          <StatCard label="Weekly Avg Focus" value={weekAvgFocus} />
          <StatCard label="Best Method" value={bestMethod} sublabel="this week" />
        </div>

        {weeklyInsight && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Weekly Insight</span>{' '}
            {weeklyInsight}
          </div>
        )}

        {/* Section 2: Idea Inbox */}
        <div className="border-t border-border pt-6">
          <h2 className="text-xl font-bold text-foreground">Idea Inbox</h2>
          <p className="text-sm text-muted-foreground mt-1">Ideas captured during focus sessions.</p>
        </div>

        {ideas.length === 0 ? (
          <p className="text-sm text-muted-foreground">No ideas yet. Capture ideas during focus sessions.</p>
        ) : (
          <div className="space-y-2">
            {ideas.map(idea => (
              <button
                key={idea.id}
                onClick={() => setSelectedIdea(idea)}
                className="w-full text-left rounded-lg border border-border bg-card p-3 hover:bg-accent transition-colors duration-150 flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground truncate">{idea.raw_text}</p>
                  <p className="text-sm text-foreground truncate">{idea.cleaned_text || idea.raw_text}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Idea detail modal */}
      {selectedIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="max-w-md w-full mx-4 rounded-lg border border-border bg-card p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-foreground">{selectedIdea.cleaned_text || selectedIdea.raw_text}</h3>
              <button onClick={() => setSelectedIdea(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            {selectedIdea.ai_expansion ? (
              <p className="text-sm text-foreground">{selectedIdea.ai_expansion}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No AI expansion available.</p>
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => handleArchive(selectedIdea.id)}>Archive</Button>
              <Button variant="ghost" onClick={() => setSelectedIdea(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
