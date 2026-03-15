import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { storage } from '@/lib/storage';
import { getSwitchRecommendation } from '@/lib/planner';
import { FocusSession, FocusMethod } from '@/types/focus';
import { Play, Pause, Square, Lightbulb, Shuffle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const METHODS: { label: string; value: FocusMethod; work: number; rest: number }[] = [
  { label: '45 / 5', value: '45/5', work: 45, rest: 5 },
  { label: '60 / 10', value: '60/10', work: 60, rest: 10 },
  { label: '90 / 15', value: '90/15', work: 90, rest: 15 },
  { label: 'Custom', value: 'custom', work: 0, rest: 0 },
];

const SWITCH_REASONS = [
  "I'm blocked",
  "I'm bored",
  "Another task feels urgent",
  "AI is loading / waiting",
  "I lost clarity",
];

export default function FocusSessionPage() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<FocusMethod>('45/5');
  const [customWork, setCustomWork] = useState(50);
  const [customBreak, setCustomBreak] = useState(10);
  const [mission, setMission] = useState('');
  const [session, setSession] = useState<FocusSession | null>(null);
  const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'break'>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [showCapture, setShowCapture] = useState(false);
  const [captureText, setCaptureText] = useState('');
  const [showSwitch, setShowSwitch] = useState(false);
  const [switchRecommendation, setSwitchRecommendation] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getWorkMinutes = useCallback(() => {
    if (method === 'custom') return customWork;
    return METHODS.find(m => m.value === method)!.work;
  }, [method, customWork]);

  const startSession = () => {
    if (!mission.trim()) return;
    const newSession: FocusSession = {
      id: `session_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      method,
      customWork: method === 'custom' ? customWork : undefined,
      customBreak: method === 'custom' ? customBreak : undefined,
      mission: mission.trim(),
      startedAt: new Date().toISOString(),
      ideaCaptures: [],
      switchAttempts: [],
      status: 'active',
    };
    setSession(newSession);
    storage.setCurrentSession(newSession);
    storage.saveSession(newSession);
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

  const endSession = () => {
    if (session) {
      const updated = { ...session, endedAt: new Date().toISOString(), status: 'completed' as const };
      storage.saveSession(updated);
      storage.setCurrentSession(null);
      navigate('/review', { state: { sessionId: updated.id } });
    }
  };

  const captureIdea = () => {
    if (captureText.trim() && session) {
      const updated = { ...session, ideaCaptures: [...session.ideaCaptures, captureText.trim()] };
      setSession(updated);
      storage.saveSession(updated);
      storage.saveIdea({ id: `idea_${Date.now()}`, sessionId: session.id, text: captureText.trim(), timestamp: new Date().toISOString() });
      setCaptureText('');
      setShowCapture(false);
    }
  };

  const handleSwitchReason = (reason: string) => {
    const rec = getSwitchRecommendation(reason);
    setSwitchRecommendation(rec);
    if (session) {
      const attempt = { reason, recommendation: rec, timestamp: new Date().toISOString() };
      const updated = { ...session, switchAttempts: [...session.switchAttempts, attempt] };
      setSession(updated);
      storage.saveSession(updated);
    }
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  const isRunning = status === 'running' || status === 'paused';

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-full max-w-lg mx-auto space-y-8">
        {!isRunning ? (
          <>
            {/* Setup */}
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
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Work (min)</label>
                  <Input type="number" min={5} max={180} value={customWork} onChange={e => setCustomWork(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Break (min)</label>
                  <Input type="number" min={1} max={60} value={customBreak} onChange={e => setCustomBreak(Number(e.target.value))} />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Mission</label>
              <Input
                placeholder="What exactly must be completed in this block?"
                value={mission}
                onChange={e => setMission(e.target.value)}
              />
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
              <p className="text-lg font-semibold text-foreground">{session?.mission}</p>
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
              <Button variant="destructive" onClick={endSession}>
                <Square className="h-4 w-4 mr-2" />End
              </Button>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setShowCapture(true)}>
                <Lightbulb className="h-4 w-4 mr-1" />Capture Idea
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setShowSwitch(true); setSwitchRecommendation(''); }}>
                <Shuffle className="h-4 w-4 mr-1" />I Feel Like Switching
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

            {/* Switch dialog */}
            {showSwitch && (
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-foreground">Why do you want to switch?</p>
                  <button onClick={() => setShowSwitch(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
                </div>
                {!switchRecommendation ? (
                  <div className="space-y-2">
                    {SWITCH_REASONS.map(reason => (
                      <button
                        key={reason}
                        onClick={() => handleSwitchReason(reason)}
                        className="block w-full text-left text-sm px-3 py-2 rounded-lg border border-border hover:bg-accent transition-colors duration-150"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                    <p className="text-sm text-foreground">{switchRecommendation}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
