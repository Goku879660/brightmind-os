import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScoreSlider } from '@/components/ScoreSlider';
import { createReview, updateReviewAiSummary, getLastCompletedUnreviewedSession } from '@/lib/supabase-storage';
import { hasOpenAIKey, callOpenAI } from '@/lib/openai';
import { generateReviewSummary } from '@/lib/planner';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function SessionReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const stateSessionId = (location.state as any)?.sessionId || '';

  const [sessionId, setSessionId] = useState(stateSessionId);
  const [loading, setLoading] = useState(!stateSessionId);

  const [flow, setFlow] = useState(5);
  const [focus, setFocus] = useState(5);
  const [productivity, setProductivity] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [motivation, setMotivation] = useState(5);
  const [distractions, setDistractions] = useState(0);
  const [contextSwitched, setContextSwitched] = useState(false);
  const [missionCompleted, setMissionCompleted] = useState(true);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [summary, setSummary] = useState('');
  const [aiDebrief, setAiDebrief] = useState('');
  const [debriefLoading, setDebriefLoading] = useState(false);

  // Ghost review fix: check for unreviewed session
  useEffect(() => {
    if (!stateSessionId) {
      const checkSession = async () => {
        const session = await getLastCompletedUnreviewedSession();
        if (session) {
          setSessionId(session.id);
          setLoading(false);
        } else {
          navigate('/focus');
        }
      };
      checkSession();
    }
  }, [stateSessionId, navigate]);

  const handleSubmit = async () => {
    const reviewData = {
      session_id: sessionId,
      flow, focus, productivity, energy, motivation,
      times_distracted: distractions,
      context_switched: contextSwitched,
      mission_completed: missionCompleted,
      note: note || null,
      ai_summary: null as string | null,
    };

    const localSummary = generateReviewSummary({
      flowScore: flow, focusScore: focus, productivityScore: productivity,
      energyScore: energy, motivationScore: motivation,
      distractionCount: distractions, contextSwitched, missionCompleted,
    });
    setSummary(localSummary);

    const review = await createReview(reviewData);
    setSubmitted(true);

    // AI debrief
    if (hasOpenAIKey()) {
      setDebriefLoading(true);
      try {
        const prompt = `Give one brutally honest sentence of coaching feedback on this focus session. Scores — Flow: ${flow}/10, Focus: ${focus}/10, Productivity: ${productivity}/10, Energy: ${energy}/10, Motivation: ${motivation}/10. Times distracted: ${distractions}. Context switched: ${contextSwitched ? 'yes' : 'no'}. Mission completed: ${missionCompleted ? 'yes' : 'no'}. Note: '${note}'. Be direct, specific, and strict like a high-performance coach.`;
        const aiResult = await callOpenAI(
          'You are a high-performance focus coach. Give one sentence of direct feedback.',
          prompt
        );
        setAiDebrief(aiResult);
        await updateReviewAiSummary(review.id, aiResult);
      } catch (e) {
        console.error('AI debrief failed:', e);
      } finally {
        setDebriefLoading(false);
      }
    }
  };

  if (loading) return null;

  if (submitted) {
    return (
      <div className="h-screen overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="max-w-md mx-auto text-center space-y-6 pb-20 px-4">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
            </div>
            <h1 className="text-xl font-bold text-foreground">Session Reviewed</h1>
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
              <p className="text-sm text-foreground">{summary}</p>
            </div>
            
            {/* AI Debrief */}
            {debriefLoading && (
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Generating session debrief...
              </p>
            )}
            {aiDebrief && (
              <div className="border-t border-border pt-4">
                <p className="text-sm text-muted-foreground italic">{aiDebrief}</p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/focus')}>New Session</Button>
              <Button variant="outline" onClick={() => navigate('/insights')}>Insights</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto">
      <div className="max-w-md w-full mx-auto py-8 px-4 space-y-6 pb-20">
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
