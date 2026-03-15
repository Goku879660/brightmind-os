import { useMemo } from 'react';
import { storage } from '@/lib/storage';
import { StatCard } from '@/components/StatCard';

export default function DashboardPage() {
  const data = useMemo(() => {
    const todayReviews = storage.getTodayReviews();
    const todaySessions = storage.getTodaySessions();
    const weekReviews = storage.getWeekReviews();
    const ideas = storage.getIdeas();
    const plan = storage.getTodayPlan();

    const completedToday = todaySessions.filter(s => s.status === 'completed').length;
    const prioritiesCompleted = todayReviews.filter(r => r.missionCompleted).length;

    const avgFocus = todayReviews.length > 0
      ? (todayReviews.reduce((s, r) => s + r.focusScore, 0) / todayReviews.length).toFixed(1)
      : '—';
    const avgEnergy = todayReviews.length > 0
      ? (todayReviews.reduce((s, r) => s + r.energyScore, 0) / todayReviews.length).toFixed(1)
      : '—';

    const distractionsToday = todayReviews.reduce((s, r) => s + r.distractionCount, 0);
    const switchesToday = todayReviews.filter(r => r.contextSwitched).length;

    // Streak: count consecutive days with at least 1 review
    const allReviews = storage.getReviews();
    const reviewDates = [...new Set(allReviews.map(r => r.date))].sort().reverse();
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today.getTime() - i * 86400000).toISOString().split('T')[0];
      if (reviewDates.includes(d)) streak++;
      else if (i > 0) break;
    }

    // Weekly averages
    const weekAvgFocus = weekReviews.length > 0
      ? (weekReviews.reduce((s, r) => s + r.focusScore, 0) / weekReviews.length).toFixed(1)
      : '—';

    // Best method
    const weekSessions = storage.getSessions().filter(s => {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      return s.date >= weekAgo && s.status === 'completed';
    });
    const methodCounts: Record<string, number> = {};
    weekSessions.forEach(s => { methodCounts[s.method] = (methodCounts[s.method] || 0) + 1; });
    const bestMethod = Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    const recentIdeas = ideas.slice(-5).reverse();
    const recentNotes = todayReviews.filter(r => r.note).slice(-5).reverse();

    return {
      completedToday, prioritiesCompleted, avgFocus, avgEnergy,
      distractionsToday, switchesToday, streak, weekAvgFocus,
      bestMethod, recentIdeas, recentNotes,
    };
  }, []);

  return (
    <div className="h-screen overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your focus patterns at a glance.</p>
        </div>

        {/* Today */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Sessions Today" value={data.completedToday} variant="primary" />
          <StatCard label="Priorities Done" value={data.prioritiesCompleted} variant="success" />
          <StatCard label="Avg Focus" value={data.avgFocus} sublabel="today" />
          <StatCard label="Avg Energy" value={data.avgEnergy} sublabel="today" />
          <StatCard label="Distractions" value={data.distractionsToday} variant={data.distractionsToday > 5 ? 'warning' : 'default'} />
          <StatCard label="Context Switches" value={data.switchesToday} variant={data.switchesToday > 2 ? 'warning' : 'default'} />
        </div>

        {/* Streak & Weekly */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Current Streak" value={`${data.streak} day${data.streak !== 1 ? 's' : ''}`} variant="success" />
          <StatCard label="Weekly Avg Focus" value={data.weekAvgFocus} />
          <StatCard label="Best Method" value={data.bestMethod} sublabel="this week" />
        </div>

        {/* Recent ideas */}
        {data.recentIdeas.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-2">Recent Ideas</h2>
            <div className="space-y-1">
              {data.recentIdeas.map(idea => (
                <div key={idea.id} className="text-sm text-muted-foreground bg-card border border-border rounded-lg px-3 py-2">
                  {idea.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent notes */}
        {data.recentNotes.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-2">Session Notes</h2>
            <div className="space-y-1">
              {data.recentNotes.map(r => (
                <div key={r.id} className="text-sm text-muted-foreground bg-card border border-border rounded-lg px-3 py-2">
                  {r.note}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.completedToday === 0 && data.recentIdeas.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Complete your first focus session to see data here.
          </div>
        )}
      </div>
    </div>
  );
}
