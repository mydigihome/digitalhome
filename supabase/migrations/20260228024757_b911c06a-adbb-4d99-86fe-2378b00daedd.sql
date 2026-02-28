
-- Quick To-Dos table
CREATE TABLE public.quick_todos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  completed BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.quick_todos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own quick todos" ON public.quick_todos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 90-Day Goals table
CREATE TABLE public.ninety_day_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_text TEXT NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT (CURRENT_DATE + 90),
  status TEXT NOT NULL DEFAULT 'active',
  achieved TEXT DEFAULT NULL,
  reflection_notes TEXT DEFAULT NULL,
  display_style TEXT NOT NULL DEFAULT 'standard',
  motivational_style TEXT NOT NULL DEFAULT 'standard',
  weekly_checkins BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.ninety_day_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own 90day goals" ON public.ninety_day_goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Goal Check-Ins table
CREATE TABLE public.goal_check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.ninety_day_goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  check_in_date DATE NOT NULL DEFAULT CURRENT_DATE,
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.goal_check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own checkins" ON public.goal_check_ins FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
