import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScoreSlider } from '@/components/ScoreSlider';
import { TimeBlockCard } from '@/components/TimeBlockCard';
import { TaskChecklist } from '@/components/TaskChecklist';
import { DateStrip } from '@/components/DateStrip';
import { generateSchedule } from '@/lib/planner';
import { getPlanByDate, upsertPlan, updateTaskCompletion } from '@/lib/supabase-storage';
import { hasOpenAIKey, callOpenAI } from '@/lib/openai';
import { BlockCategory } from '@/types/focus';
import { Sparkles, Plus, X, Loader2 } from 'lucide-react';

interface ScheduleBlock {
  id: string;
  title: string;
  category: BlockCategory;
  startTime: string;
  endTime: string;
  priorityIndex?: number;
}

export default function MorningPlanning() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [priorities, setPriorities] = useState<string[]>(['', '', '']);
  const [additionalTasks, setAdditionalTasks] = useState<string[]>([]);
  const [fixedCommitments, setFixedCommitments] = useState<string[]>([]);
  const [energy, setEnergy] = useState(7);
  const [motivation, setMotivation] = useState(7);
  const [deepWorkHours, setDeepWorkHours] = useState(4);
  const [learningHours, setLearningHours] = useState(1);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [summary, setSummary] = useState('');
  const [taskCompletion, setTaskCompletion] = useState<Record<string, boolean>>({});
  const [newTask, setNewTask] = useState('');
  const [newCommitment, setNewCommitment] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  const loadPlan = useCallback(async (date: string) => {
    const plan = await getPlanByDate(date);
    if (plan) {
      setStartTime(plan.start_time);
      setEndTime(plan.end_time);
      const pris = plan.priorities as string[];
      setPriorities(pris.length >= 3 ? pris : [...pris, ...Array(3 - pris.length).fill('')]);
      setAdditionalTasks(plan.tasks as string[]);
      setFixedCommitments(plan.commitments as string[]);
      setEnergy(plan.energy_level);
      setMotivation(plan.motivation_level);
      setDeepWorkHours(plan.deep_work_hours);
      setLearningHours(plan.learning_hours);
      setBlocks((plan.schedule_blocks as any[]).map(b => ({
        id: b.id || `block_${Math.random()}`,
        title: b.title,
        category: (b.category || b.type?.toLowerCase().replace(' ', '') || 'execution') as BlockCategory,
        startTime: b.startTime || b.start_time,
        endTime: b.endTime || b.end_time,
        priorityIndex: b.priorityIndex,
      })));
      setSummary(plan.coach_summary || '');
      setTaskCompletion((plan.task_completion as Record<string, boolean>) || {});
    } else {
      setStartTime('08:00');
      setEndTime('18:00');
      setPriorities(['', '', '']);
      setAdditionalTasks([]);
      setFixedCommitments([]);
      setEnergy(7);
      setMotivation(7);
      setDeepWorkHours(4);
      setLearningHours(1);
      setBlocks([]);
      setSummary('');
      setTaskCompletion({});
    }
  }, []);

  useEffect(() => {
    loadPlan(selectedDate);
  }, [selectedDate, loadPlan]);

  const allTasks = [...priorities.filter(p => p.trim()), ...additionalTasks.filter(t => t.trim())];

  const savePlanToDb = async (scheduleBlocks: any[], coachSummary: string) => {
    await upsertPlan({
      date: selectedDate,
      start_time: startTime,
      end_time: endTime,
      priorities: priorities.filter(p => p.trim()),
      tasks: additionalTasks.filter(t => t.trim()),
      commitments: fixedCommitments.filter(c => c.trim()),
      energy_level: energy,
      motivation_level: motivation,
      deep_work_hours: deepWorkHours,
      learning_hours: learningHours,
      schedule_blocks: scheduleBlocks as any,
      task_completion: taskCompletion as any,
      coach_summary: coachSummary,
    });
  };

  const handleGenerate = async () => {
    const filledPriorities = priorities.filter(p => p.trim());
    if (filledPriorities.length === 0) return;

    setAiError('');
    setGenerating(true);

    try {
      if (hasOpenAIKey()) {
        // AI generation
        const userPrompt = `Schedule my day. Start: ${startTime}. End: ${endTime}. Energy level: ${energy}/10. Motivation: ${motivation}/10. Deep work hours: ${deepWorkHours}. Learning hours: ${learningHours}. Priorities: ${filledPriorities.map((p, i) => `${i + 1}. ${p}`).join('. ')}. Additional tasks: ${additionalTasks.filter(t => t.trim()).map((t, i) => `${i + 1}. ${t}`).join('. ')}. Fixed commitments: ${fixedCommitments.filter(c => c.trim()).map((c, i) => `${i + 1}. ${c}`).join('. ')}. Rules: If energy >= 7, schedule the hardest priority first after a short morning planning block. If energy <= 4, start with lighter tasks and build up to the hardest. Always include short breaks between deep work blocks (15 minutes after every 90 minutes, 10 minutes after 60, 5 minutes after 45). Respect fixed commitments exactly as given. Return a JSON array of blocks, each with: title (string), start_time (string HH:MM), end_time (string HH:MM), type (one of: Planning, Deep Work, Break, Execution, Learning).`;
        
        const result = await callOpenAI(
          'You are a deep work scheduling assistant. Return only valid JSON, no explanation, no markdown.',
          userPrompt
        );
        
        // Parse AI response
        const jsonStr = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonStr);
        
        const typeToCategory: Record<string, BlockCategory> = {
          'Planning': 'planning',
          'Deep Work': 'deepwork',
          'Break': 'break',
          'Execution': 'execution',
          'Learning': 'learning',
        };
        
        const aiBlocks: ScheduleBlock[] = parsed.map((b: any, i: number) => ({
          id: `block_${Date.now()}_${i}`,
          title: b.title,
          category: typeToCategory[b.type] || 'execution',
          startTime: b.start_time,
          endTime: b.end_time,
        }));
        
        const coachSummary = `Scheduled based on energy ${energy}/10 — ${energy >= 7 ? 'hardest' : 'lightest'} task first.`;
        
        setBlocks(aiBlocks);
        setSummary(coachSummary);
        await savePlanToDb(aiBlocks, coachSummary);
      } else {
        // Fallback to rule-based
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
        await savePlanToDb(result.blocks, result.summary);
        setAiError('Add your OpenAI API key in Settings to enable AI scheduling.');
      }
    } catch (err: any) {
      console.error('Generate error:', err);
      // Fallback to rule-based on AI error
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
      await savePlanToDb(result.blocks, result.summary);
      setAiError(err.message || 'AI generation failed. Used rule-based scheduling.');
    } finally {
      setGenerating(false);
    }
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

  const handleTaskToggle = async (task: string, checked: boolean) => {
    const updated = { ...taskCompletion, [task]: checked };
    setTaskCompletion(updated);
    await updateTaskCompletion(selectedDate, updated);
  };

  return (
    <div className="flex h-screen">
      {/* Left: Coach form */}
      <div className="w-[45%] border-r border-border overflow-y-auto p-6">
        <div className="max-w-md mx-auto space-y-6 pb-20">
          <DateStrip selectedDate={selectedDate} onSelect={setSelectedDate} />
          
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

          <Button className="w-full" onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" />Generate My Day</>
            )}
          </Button>

          {aiError && (
            <p className="text-xs text-muted-foreground">{aiError}</p>
          )}

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
        <div className="space-y-6 pb-20">
          <h2 className="text-lg font-semibold text-foreground">Today's Schedule</h2>
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

          {blocks.length > 0 && allTasks.length > 0 && (
            <TaskChecklist
              tasks={allTasks}
              completion={taskCompletion}
              onToggle={handleTaskToggle}
            />
          )}
        </div>
      </div>
    </div>
  );
}
