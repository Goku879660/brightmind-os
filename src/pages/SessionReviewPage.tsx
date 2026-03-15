import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScoreSlider } from '@/components/ScoreSlider';
import { storage } from '@/lib/storage';
import { generateReviewSummary } from '@/lib/planner';
import { SessionReview } from '@/types/focus';
import { CheckCircle } from 'lucide-react';

export default function SessionReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionId = (location.state as any)?.sessionId || '';

  const [flow, setFlow] = useState(7);
  const [focus, setFocus] = useState(7);
  const [productivity, setProductivity] = useState(7);
  const [energy, setEnergy] = useState(7);
  const [motivation, setMotivation] = useState(7);
  const [distractions, setDistractions] = useState(0);
  const [contextSwitched, setContextSwitched] = useState(false);
  const [missionCompleted, setMissionCompleted] = useState(true);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [summary, setSummary] = useState('');

  const handleSubmit = () => {
    const reviewData = {
      flowScore: flow, focusScore: focus, productivityScore: productivity,
      energyScore: energy, motivationScore: motivation,
      distractionCount: distractions, contextSwitched, missionCompleted,
    };
    const reviewSummary = generateReviewSummary(reviewData);
    setSummary(reviewSummary);

    const review: SessionReview = {
      id: `review_${Date.now()}`,
      sessionId,
      date: new Date().toISOString().split('T')[0],
      ...reviewData,
      note,
      summary: reviewSummary,
      createdAt: new Date().toISOString(),
    };
    storage.saveReview(review);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-foreground">Session Reviewed</h1>
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <p className="text-sm text-foreground">{summary}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/focus')}>New Session</Button>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen overflow-y-auto">
      <div className="max-w-md w-full mx-auto py-8 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Session Review</h1>
          <p className="text-sm text-muted-foreground mt-1">Quick reflection to track your patterns.</p>
        </div>

        <div className="space-y-4">
          <ScoreSlider label="Flow" value={flow} onChange={setFlow} />
          <ScoreSlider label="Focus" value={focus} onChange={setFocus} />
          <ScoreSlider label="Productivity" value={productivity} onChange={setProductivity} />
          <ScoreSlider label="Energy" value={energy} onChange={setEnergy} />
          <ScoreSlider label="Motivation" value={motivation} onChange={setMotivation} />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Times Distracted</label>
          <Input type="number" min={0} value={distractions} onChange={e => setDistractions(Number(e.target.value))} />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={contextSwitched} onChange={e => setContextSwitched(e.target.checked)} className="accent-primary" />
            <span className="text-foreground">Context switched</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={missionCompleted} onChange={e => setMissionCompleted(e.target.checked)} className="accent-primary" />
            <span className="text-foreground">Mission completed</span>
          </label>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">What helped or hurt this session?</label>
          <Input placeholder="Short note..." value={note} onChange={e => setNote(e.target.value)} />
        </div>

        <Button className="w-full" onClick={handleSubmit}>Submit Review</Button>
      </div>
    </div>
  );
}
