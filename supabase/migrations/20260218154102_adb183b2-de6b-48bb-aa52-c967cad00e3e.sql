
-- ============================================
-- Boards table
-- ============================================
CREATE TABLE public.boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  is_locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- Active members or admin can read boards
CREATE POLICY "Active members can view boards" ON public.boards
  FOR SELECT TO authenticated
  USING (
    (SELECT member_status FROM public.profiles WHERE id = auth.uid()) = 'active'
    OR public.has_role(auth.uid(), 'admin')
  );

-- Admin can insert/update boards
CREATE POLICY "Admin can insert boards" ON public.boards
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update boards" ON public.boards
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed the main board
INSERT INTO public.boards (slug, name, description) VALUES ('main', 'Surf Board', 'High-signal execution discussion.');

-- ============================================
-- Posts table
-- ============================================
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_posts_board_id ON public.posts(board_id);
CREATE INDEX idx_posts_author_id ON public.posts(author_id);
CREATE INDEX idx_posts_status ON public.posts(status);

-- Active members/admin can read active/locked posts; admin can also read removed
CREATE POLICY "Members can view active posts" ON public.posts
  FOR SELECT TO authenticated
  USING (
    (
      (status IN ('active', 'locked'))
      AND (
        (SELECT member_status FROM public.profiles WHERE id = auth.uid()) = 'active'
        OR public.has_role(auth.uid(), 'admin')
      )
    )
    OR (
      status = 'removed' AND public.has_role(auth.uid(), 'admin')
    )
  );

-- Active members can insert if board not locked
CREATE POLICY "Members can create posts" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (
      (SELECT member_status FROM public.profiles WHERE id = auth.uid()) = 'active'
      OR public.has_role(auth.uid(), 'admin')
    )
    AND (SELECT is_locked FROM public.boards WHERE id = board_id) = false
  );

-- Author can update own active post if board not locked; admin can update any
CREATE POLICY "Author or admin can update posts" ON public.posts
  FOR UPDATE TO authenticated
  USING (
    (author_id = auth.uid() AND status = 'active' AND (SELECT is_locked FROM public.boards WHERE id = board_id) = false)
    OR public.has_role(auth.uid(), 'admin')
  );

-- Admin can delete posts
CREATE POLICY "Admin can delete posts" ON public.posts
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- Comments table
-- ============================================
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_comments_post_id ON public.comments(post_id);

-- Active members/admin can read active comments; admin can read removed
CREATE POLICY "Members can view active comments" ON public.comments
  FOR SELECT TO authenticated
  USING (
    (
      status = 'active'
      AND (
        (SELECT member_status FROM public.profiles WHERE id = auth.uid()) = 'active'
        OR public.has_role(auth.uid(), 'admin')
      )
    )
    OR (status = 'removed' AND public.has_role(auth.uid(), 'admin'))
  );

-- Active members can insert comments if post not locked/removed
CREATE POLICY "Members can create comments" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (
      (SELECT member_status FROM public.profiles WHERE id = auth.uid()) = 'active'
      OR public.has_role(auth.uid(), 'admin')
    )
    AND (SELECT status FROM public.posts WHERE id = post_id) = 'active'
  );

-- Admin can update comments (for moderation)
CREATE POLICY "Admin can update comments" ON public.comments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- Votes table
-- ============================================
CREATE TABLE public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  value integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_votes_post_id ON public.votes(post_id);

-- Active members/admin can view votes
CREATE POLICY "Members can view votes" ON public.votes
  FOR SELECT TO authenticated
  USING (
    (SELECT member_status FROM public.profiles WHERE id = auth.uid()) = 'active'
    OR public.has_role(auth.uid(), 'admin')
  );

-- Active members can insert own votes
CREATE POLICY "Members can insert votes" ON public.votes
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      (SELECT member_status FROM public.profiles WHERE id = auth.uid()) = 'active'
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- Members can delete own votes
CREATE POLICY "Members can delete own votes" ON public.votes
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    AND (
      (SELECT member_status FROM public.profiles WHERE id = auth.uid()) = 'active'
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- ============================================
-- Moderation Actions table
-- ============================================
CREATE TABLE public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

-- Admin only
CREATE POLICY "Admin can view moderation actions" ON public.moderation_actions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can insert moderation actions" ON public.moderation_actions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- Update trigger for posts.updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
