
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

-- Create member_status enum
CREATE TYPE public.member_status AS ENUM ('pending', 'active', 'inactive');

-- Create application_status enum
CREATE TYPE public.application_status AS ENUM ('submitted', 'reviewing', 'accepted', 'rejected');

-- 1) Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  member_status public.member_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2) User roles table (separate per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'member',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3) Applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  stage TEXT NOT NULL,
  product TEXT NOT NULL,
  bottleneck TEXT NOT NULL,
  why_now TEXT,
  status public.application_status NOT NULL DEFAULT 'submitted',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- 4) Waitlist table
CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _app RECORD;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );

  -- Assign default 'member' role
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member');

  -- Check if there's an accepted application matching this email
  SELECT * INTO _app FROM public.applications
  WHERE email = NEW.email AND status = 'accepted'
  LIMIT 1;

  IF FOUND THEN
    -- Activate the user
    UPDATE public.profiles SET member_status = 'active' WHERE id = NEW.id;
    -- Link the application
    UPDATE public.applications SET user_id = NEW.id WHERE id = _app.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============ RLS POLICIES ============

-- Profiles: users can read their own
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Profiles: users can update their own full_name
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Profiles: admin can read all
CREATE POLICY "Admin can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: admin can update all
CREATE POLICY "Admin can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- User roles: users can read their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Applications: anyone can insert (public apply)
CREATE POLICY "Anyone can insert applications"
  ON public.applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Applications: authenticated users can see their own
CREATE POLICY "Users can view own applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Applications: admin can read all
CREATE POLICY "Admin can view all applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Applications: admin can update all
CREATE POLICY "Admin can update applications"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Waitlist: anyone can insert
CREATE POLICY "Anyone can insert waitlist"
  ON public.waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Waitlist: admin can read all
CREATE POLICY "Admin can view all waitlist"
  ON public.waitlist FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
