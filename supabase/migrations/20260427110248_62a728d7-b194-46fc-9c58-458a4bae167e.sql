
-- ============ profiles ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  consent_marketing BOOLEAN NOT NULL DEFAULT false,
  consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup using metadata passed to signUp
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, whatsapp, consent_marketing, consent_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', ''),
    COALESCE((NEW.raw_user_meta_data->>'consent_marketing')::boolean, false),
    CASE WHEN COALESCE((NEW.raw_user_meta_data->>'consent_marketing')::boolean, false)
         THEN now() ELSE NULL END
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ exam_themes ============
CREATE TABLE public.exam_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_pt TEXT NOT NULL,
  title_de TEXT NOT NULL,
  description_pt TEXT NOT NULL,
  description_de TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medio' CHECK (difficulty IN ('facil','medio','dificil')),
  tips_pt TEXT[] NOT NULL DEFAULT '{}',
  tips_de TEXT[] NOT NULL DEFAULT '{}',
  redemittel TEXT[] NOT NULL DEFAULT '{}',
  discussion_questions_pt TEXT[] NOT NULL DEFAULT '{}',
  discussion_questions_de TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exam_themes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Themes readable by authenticated" ON public.exam_themes
  FOR SELECT TO authenticated USING (true);

-- ============ exam_images ============
CREATE TABLE public.exam_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  description_pt TEXT NOT NULL,
  description_de TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medio' CHECK (difficulty IN ('facil','medio','dificil')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exam_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Images readable by authenticated" ON public.exam_images
  FOR SELECT TO authenticated USING (true);

-- ============ exam_sessions ============
CREATE TABLE public.exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'completa' CHECK (mode IN ('completa','rapida','tema')),
  theme_id UUID REFERENCES public.exam_themes(id),
  image_id UUID REFERENCES public.exam_images(id),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','processing','completed','abandoned')),
  total_score NUMERIC,
  scores JSONB DEFAULT '{}'::jsonb,
  feedback JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own sessions" ON public.exam_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sessions" ON public.exam_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sessions" ON public.exam_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sessions" ON public.exam_sessions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_exam_sessions_user ON public.exam_sessions(user_id, started_at DESC);

-- ============ exam_recordings ============
CREATE TABLE public.exam_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  part SMALLINT NOT NULL CHECK (part IN (1,2,3)),
  storage_path TEXT NOT NULL,
  duration_sec INT,
  transcript TEXT,
  part_feedback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exam_recordings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own recordings" ON public.exam_recordings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own recordings" ON public.exam_recordings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own recordings" ON public.exam_recordings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============ storage bucket ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('recordings', 'recordings', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own recordings"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own recordings"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own recordings"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'recordings' AND (storage.foldername(name))[1] = auth.uid()::text);
