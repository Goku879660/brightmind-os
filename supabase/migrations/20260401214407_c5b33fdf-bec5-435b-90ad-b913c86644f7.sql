
-- Plans table
CREATE TABLE public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  start_time TEXT NOT NULL DEFAULT '08:00',
  end_time TEXT NOT NULL DEFAULT '18:00',
  priorities JSONB NOT NULL DEFAULT '[]'::jsonb,
  tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  commitments JSONB NOT NULL DEFAULT '[]'::jsonb,
  energy_level INTEGER NOT NULL DEFAULT 7,
  motivation_level INTEGER NOT NULL DEFAULT 7,
  deep_work_hours INTEGER NOT NULL DEFAULT 4,
  learning_hours INTEGER NOT NULL DEFAULT 1,
  schedule_blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  task_completion JSONB NOT NULL DEFAULT '{}'::jsonb,
  coach_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sessions table
CREATE TABLE public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  method TEXT NOT NULL DEFAULT '45/5',
  focus_minutes INTEGER NOT NULL DEFAULT 45,
  break_minutes INTEGER NOT NULL DEFAULT 5,
  mission TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  idea_captures JSONB NOT NULL DEFAULT '[]'::jsonb,
  switch_attempts JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  flow INTEGER NOT NULL DEFAULT 5,
  focus INTEGER NOT NULL DEFAULT 5,
  productivity INTEGER NOT NULL DEFAULT 5,
  energy INTEGER NOT NULL DEFAULT 5,
  motivation INTEGER NOT NULL DEFAULT 5,
  times_distracted INTEGER NOT NULL DEFAULT 0,
  context_switched BOOLEAN NOT NULL DEFAULT false,
  mission_completed BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ideas table
CREATE TABLE public.ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  raw_text TEXT NOT NULL,
  cleaned_text TEXT,
  ai_expansion TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archived BOOLEAN NOT NULL DEFAULT false
);

-- Weekly insights table
CREATE TABLE public.weekly_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL UNIQUE,
  insight_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_insights ENABLE ROW LEVEL SECURITY;

-- Since this is a local-only app with no auth, allow all operations
CREATE POLICY "Allow all access to plans" ON public.plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to sessions" ON public.sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to reviews" ON public.reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to ideas" ON public.ideas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to weekly_insights" ON public.weekly_insights FOR ALL USING (true) WITH CHECK (true);
