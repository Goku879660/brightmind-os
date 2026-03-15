import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScoreSlider } from '@/components/ScoreSlider';
import { TimeBlockCard } from '@/components/TimeBlockCard';
import { generateSchedule } from '@/lib/planner';
import { storage } from '@/lib/storage';
import { DailyPlan, TimeBlock } from '@/types/focus';
import { Sparkles, Plus, X } from 'lucide-react';

export default function MorningPlanning() {
  const existingPlan = storage.getTodayPlan();
  const [startTime, setStartTime] = useState(existingPlan?.startTime || '08:00');
  const [endTime, setEndTime] = useState(existingPlan?.endTime || '18:00');
  const [priorities, setPriorities] = useState<string[]>(existingPlan?.priorities || ['', '', '']);
  const [additionalTasks, setAdditionalTasks] = useState<string[]>(existingPlan?.additionalTasks || []);
  const [fixedCommitments, setFixedCommitments] = useState<string[]>(existingPlan?.fixedCommitments || []);
  const [energy, setEnergy] = useState(existingPlan?.energyLevel || 7);
  const [motivation, setMotivation] = useState(existingPlan?.motivationLevel || 7);
  const [deepWorkHours, setDeepWorkHours] = useState(existingPlan?.desiredDeepWorkHours || 4);
  const [learningHours, setLearningHours] = useState(existingPlan?.desiredLearningHours || 1);
  const [blocks, setBlocks] = useState<TimeBlock[]>(existingPlan?.blocks || []);
  const [summary, setSummary] = useState(existingPlan?.coachSummary || '');
  const [newTask, setNewTask] = useState('');
  const [newCommitment, setNewCommitment] = useState('');

  const handleGenerate = () => {
    const filledPriorities = priorities.filter(p => p.trim());
    if (filledPriorities.length === 0) return;

    const result = generateSchedule({
      startTime, endTime,
      priorities: filledPriorities,
      additionalTasks: additionalTasks.filter(t => t.trim()),
      fixedCommitments: fixedCommitments.filter(c => c.trim()),
      energyLevel: energy,
      desiredDeepWorkHours: deepWorkHours,
      desiredLearningHours: learningHours,
    });

    setBlocks(result.blocks);
    setSummary(result.summary);

    const plan: DailyPlan = {
      id: `plan_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      startTime, endTime,
      priorities: filledPriorities,
      additionalTasks,
      fixedCommitments,
      energyLevel: energy,
      motivationLevel: motivation,
      desiredDeepWorkHours: deepWorkHours,
      desiredLearningHours: learningHours,
      blocks: result.blocks,
      coachSummary: result.summary,
      createdAt: new Date().toISOString(),
    };
    storage.savePlan(plan);
  };

  const updatePriority = (idx: number, val: string) => {
    const next = [...priorities];
    next[idx] = val;
    setPriorities(next);
  };

  const addTask = () => {
    if (newTask.trim()) {
      setAdditionalTasks([...additionalTasks, newTask.trim()]);
      setNewTask('');
    }
  };

  const addCommitment = () => {
    if (newCommitment.trim()) {
      setFixedCommitments([...fixedCommitments, newCommitment.trim()]);
      setNewCommitment('');
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left: Coach form */}
      <div className="w-[45%] border-r border-border overflow-y-auto p-6">
        <div className="max-w-md mx-auto space-y-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">Morning Planning</h1>
            <p className="text-sm text-muted-foreground mt-1">Let's structure your day for deep work.</p>
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Start Time</label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">End Time</label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>

          {/* Priorities */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Top 3 Priorities</label>
            {priorities.map((p, i) => (
              <Input
                key={i}
                placeholder={`Priority ${i + 1}`}
                value={p}
                onChange={e => updatePriority(i, e.target.value)}
              />
            ))}
          </div>

          {/* Additional tasks */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Additional Tasks</label>
            {additionalTasks.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm text-foreground flex-1">{t}</span>
                <button onClick={() => setAdditionalTasks(additionalTasks.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input placeholder="Add a task..." value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} />
              <Button variant="outline" size="icon" onClick={addTask}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>

          {/* Fixed commitments */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Fixed Commitments (optional)</label>
            {fixedCommitments.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm text-foreground flex-1">{c}</span>
                <button onClick={() => setFixedCommitments(fixedCommitments.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input placeholder="e.g. Team standup at 10am" value={newCommitment} onChange={e => setNewCommitment(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCommitment()} />
              <Button variant="outline" size="icon" onClick={addCommitment}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>

          {/* Scores */}
          <div className="space-y-3">
            <ScoreSlider label="Energy Level" value={energy} onChange={setEnergy} />
            <ScoreSlider label="Motivation Level" value={motivation} onChange={setMotivation} />
          </div>

          {/* Hours */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Deep Work Hours</label>
              <Input type="number" min={0} max={12} value={deepWorkHours} onChange={e => setDeepWorkHours(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Learning Hours</label>
              <Input type="number" min={0} max={12} value={learningHours} onChange={e => setLearningHours(Number(e.target.value))} />
            </div>
          </div>

          <Button className="w-full" onClick={handleGenerate}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate My Day
          </Button>

          {summary && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
              <p className="text-xs font-medium text-primary mb-1">Coach Summary</p>
              <p className="text-sm text-foreground">{summary}</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Day view */}
      <div className="flex-1 overflow-y-auto p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Today's Schedule</h2>
        {blocks.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            Generate your day to see the schedule here.
          </div>
        ) : (
          <div className="space-y-2">
            {blocks.map(block => (
              <TimeBlockCard
                key={block.id}
                title={block.title}
                category={block.category}
                startTime={block.startTime}
                endTime={block.endTime}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
