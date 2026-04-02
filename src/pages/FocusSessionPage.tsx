import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPlanByDate, createSession, endSession as endSessionDb, createIdea, updateIdeaAI, getActiveSession } from '@/lib/supabase-storage';
import { hasOpenAIKey, callOpenAI } from '@/lib/openai';
import { Play, Pause, Square, Lightbulb, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type FocusMethod = '45/5' | '60/10' | '90/15' | 'custom';

const METHODS: { label: string; value: FocusMethod; work: number; rest: number }[] = [
  { label: '45 / 5', value: '45/5', work: 45, rest: 5 },
  { label: '60 / 10', value: '60/10', work: 60, rest: 10 },
  { label: '90 / 15', value: '90/15', work: 90, rest: 15 },
  { label: 'Custom', value: 'custom', work: 0, rest: 0 },
];

export default function FocusSessionPage() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<FocusMethod>('45/5');
  const [customWork, setCustomWork] = useState(50);
  const [customBreak, setCustomBreak] = useState(10);
  const [mission, setMission] = useState('');
  const [missionSource, setMissionSource] = useState<'dropdown' | 'manual'>('dropdown');
  const [todayTasks, setTodayTasks] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [showCapture, setShowCapture] = useState(false);
  const [captureText, setCaptureText] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load today's tasks for dropdown
  useEffect(() => {
    const loadTasks = async () => {
      const today = new Date().toISOString().split('T')[0];
      const plan = await getPlanByDate(today);
      if (plan) {
        const tasks = [
          ...(plan.priorities as string[]).filter(p => p.trim()),
          ...(plan.tasks as string[]).filter(t => t.trim()),
        ];
        setTodayTasks(tasks);
        if (tasks.length === 0) {
          setMissionSource('manual');
        }
      } else {
        setMissionSource('manual');
      }
    };
    loadTasks();
  }, []);

  // Check for active session on mount
  useEffect(() => {
    const checkActive = async () => {
      const active = await getActiveSession();
      if (active) {
        setSessionId(active.id);
        setMission(active.mission);
        setMethod(active.method as FocusMethod);
        const elapsed = Math.floor((Date.now() - new Date(active.started_at).getTime()) / 1000);
        const totalSeconds = active.focus_minutes * 60;
        const remaining = Math.max(0, totalSeconds - elapsed);
        setTimeLeft(remaining);
        setStatus('running');
      }
    };
    checkActive();
  }, []);

  const getWorkMinutes = useCallback(() => {
    if (method === 'custom') return customWork;
    return METHODS.find(m => m.value === method)!.work;
  }, [method, customWork]);

  const getBreakMinutes = useCallback(() => {
    if (method === 'custom') return customBreak;
    return METHODS.find(m => m.value === method)!.rest;
  }, [method, customBreak]);

  const startSession = async () => {
    if (!mission.trim()) return;
    const today = new Date().toISOString().split('T')[0];
    const plan = await getPlanByDate(today);
    
    const session = await createSession({
      plan_id: plan?.id || null,
      date: today,
      method,
      focus_minutes: getWorkMinutes(),
      break_minutes: getBreakMinutes(),
      mission: mission.trim(),
      started_at: new Date().toISOString(),
      ended_at: null,
      idea_captures: [],
      switch_attempts: [],
    });
    
    setSessionId(session.id);
    setTimeLeft(getWorkMinutes() * 60);
    setStatus('running');
  };

  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setStatus('idle');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [status]);

  const handleEndSession = async () => {
    if (sessionId) {
      const endedId = sessionId;
      await endSessionDb(endedId);
      // Reset local state so the UI exits lockdown immediately
      setSessionId(null);
      setStatus('idle');
      setTimeLeft(0);
      navigate('/review', { state: { sessionId: endedId } });
    }
  };

  const captureIdea = async () => {
    if (captureText.trim() && sessionId) {
      const idea = await createIdea({
        session_id: sessionId,
        raw_text: captureText.trim(),
      });
      setCaptureText('');
      setShowCapture(false);

      // Background AI enhancement
      if (hasOpenAIKey()) {
        try {
          const result = await callOpenAI(
            'Return only valid JSON, no explanation.',
            `The user wrote this quick note during a deep focus session: '${captureText.trim()}'. Clean up any typos and rewrite as one clear sentence (cleaned_text). Then write 2-3 sentences expanding on what this idea likely means and how it could be developed (ai_expansion). Return JSON: { "cleaned_text": "...", "ai_expansion": "..." }`
          );
          const parsed = JSON.parse(result.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
          await updateIdeaAI(idea.id, parsed.cleaned_text, parsed.ai_expansion);
        } catch (e) {
          console.error('AI idea enhancement failed:', e);
        }
      }
    }
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isRunning = status === 'running' || status === 'paused';

  const handleMissionSelect = (value: string) => {
    if (value === '__other__') {
      setMissionSource('manual');
      setMission('');
    } else {
      setMission(value);
      setMissionSource('dropdown');
    }
  };

  return (
    <div className={cn(
      'flex items-center justify-center h-screen',
      isRunning && 'fixed inset-0 z-[100] bg-background'
    )}>
      <div className="w-full max-w-lg mx-auto space-y-8 px-4">
        {!isRunning ? (
          <>
            <div className="text-center">
              <h1 className="text-xl font-bold text-foreground">Focus Session</h1>
              <p className="text-sm text-muted-foreground mt-1">Choose your method and define your mission.</p>
            </div>

            {/* Method selector */}
            <div className="grid grid-cols-4 gap-2">
              {METHODS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  className={cn(
                    'py-2 px-3 rounded-lg border text-sm font-medium transition-colors duration-150',
                    method === m.value
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'border-border text-muted-foreground hover:bg-accent'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {method === 'custom' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Focus min</label>
                  <Input type="number" min={5} max={180} value={customWork} onChange={e => setCustomWork(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Break min</label>
                  <Input type="number" min={1} max={60} value={customBreak} onChange={e => setCustomBreak(Number(e.target.value))} />
                </div>
              </div>
            )}

            {/* Mission */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Mission</label>
              {todayTasks.length > 0 && missionSource === 'dropdown' ? (
                <select
                  value={mission}
                  onChange={e => handleMissionSelect(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select a task...</option>
                  {todayTasks.map((task, i) => (
                    <option key={i} value={task}>{task}</option>
                  ))}
                  <option value="__other__">Other — type manually</option>
                </select>
              ) : null}
              {(missionSource === 'manual' || todayTasks.length === 0) && (
                <>
                  <Input
                    placeholder="What exactly must be completed in this block?"
                    value={mission}
                    onChange={e => setMission(e.target.value)}
                  />
                  {todayTasks.length > 0 && (
                    <button
                      onClick={() => { setMissionSource('dropdown'); setMission(''); }}
                      className="text-xs text-primary hover:underline"
                    >
                      ← Select from today's plan
                    </button>
                  )}
                </>
              )}
            </div>

            <Button className="w-full" onClick={startSession} disabled={!mission.trim()}>
              <Play className="h-4 w-4 mr-2" />
              Start Session
            </Button>
          </>
        ) : (
          <>
            {/* Active session - Zen mode */}
            <div className="text-center space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Mission</p>
              <p className="text-lg font-semibold text-foreground">{mission}</p>
            </div>

            <div className="text-center">
              <p className={cn(
                'font-mono text-7xl font-bold tracking-tight',
                status === 'paused' ? 'text-muted-foreground animate-pulse-slow' : 'text-foreground'
              )}>
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </p>
              <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wide">
                {status === 'paused' ? 'Paused' : 'Focusing'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              {status === 'running' ? (
                <Button variant="outline" onClick={() => setStatus('paused')}>
                  <Pause className="h-4 w-4 mr-2" />Pause
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setStatus('running')}>
                  <Play className="h-4 w-4 mr-2" />Resume
                </Button>
              )}
              <Button variant="destructive" onClick={handleEndSession}>
                <Square className="h-4 w-4 mr-2" />End
              </Button>
            </div>

            <div className="flex items-center justify-center">
              <Button variant="ghost" size="sm" onClick={() => setShowCapture(true)}>
                <Lightbulb className="h-4 w-4 mr-1" />Capture Idea
              </Button>
            </div>

            {/* Capture idea modal */}
            {showCapture && (
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-foreground">Quick Capture</p>
                  <button onClick={() => setShowCapture(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
                </div>
                <Input placeholder="Capture your idea..." value={captureText} onChange={e => setCaptureText(e.target.value)} onKeyDown={e => e.key === 'Enter' && captureIdea()} autoFocus />
                <Button size="sm" onClick={captureIdea} disabled={!captureText.trim()}>Save</Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
