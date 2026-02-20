
-- Create agents catalog table
CREATE TABLE public.agents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  headline text NOT NULL,
  description text NOT NULL,
  what_it_does text NOT NULL,
  use_cases text[] NOT NULL DEFAULT '{}',
  example_output text,
  job_type text NOT NULL,
  category text NOT NULL,
  icon_name text NOT NULL DEFAULT 'Bot',
  price_cents integer NOT NULL DEFAULT 0,
  stripe_price_id text,
  status text NOT NULL DEFAULT 'coming_soon',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create agent_leases table
CREATE TABLE public.agent_leases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  stripe_session_id text,
  stripe_subscription_id text,
  status text NOT NULL DEFAULT 'active',
  leased_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create agent_runs table
CREATE TABLE public.agent_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id uuid NOT NULL REFERENCES public.agent_leases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  job_id uuid,
  triggered_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'queued',
  result_summary text,
  input_payload jsonb DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

-- agents RLS: active members can read active agents
CREATE POLICY "Active members can view active agents"
  ON public.agents FOR SELECT
  USING (
    status = 'active' AND (
      (SELECT profiles.member_status FROM profiles WHERE profiles.id = auth.uid()) = 'active'
      OR has_role(auth.uid(), 'chief_architect')
    )
    OR has_role(auth.uid(), 'chief_architect')
  );

CREATE POLICY "Chief architect can manage agents"
  ON public.agents FOR ALL
  USING (has_role(auth.uid(), 'chief_architect'));

-- agent_leases RLS
CREATE POLICY "Users can view own leases"
  ON public.agent_leases FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'chief_architect'));

CREATE POLICY "Users can insert own leases"
  ON public.agent_leases FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Chief architect can manage leases"
  ON public.agent_leases FOR ALL
  USING (has_role(auth.uid(), 'chief_architect'));

-- agent_runs RLS
CREATE POLICY "Users can view own runs"
  ON public.agent_runs FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'chief_architect'));

CREATE POLICY "Users can insert own runs"
  ON public.agent_runs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Chief architect can manage runs"
  ON public.agent_runs FOR ALL
  USING (has_role(auth.uid(), 'chief_architect'));

-- Updated_at trigger
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed all 10 agents
INSERT INTO public.agents (name, slug, headline, description, what_it_does, use_cases, example_output, job_type, category, icon_name, price_cents, status) VALUES
(
  'Social Media Agent',
  'social-media',
  'Writes & queues web design posts for Twitter, LinkedIn, and Instagram',
  'Automatically writes professional web design and build posts on your behalf, pulling from your recent Lovable projects to create authentic, engaging content.',
  'This agent connects to your recent Lovable sessions, extracts key project details, and generates platform-optimized posts for Twitter/X, LinkedIn, and Instagram. Each post is written in your voice, highlights the build outcome, and includes relevant hashtags. Posts are queued for your review before publishing.',
  ARRAY[
    'You finish a Lovable build — the agent writes 3 platform-specific posts ready to copy-paste',
    'Running low on content ideas — agent generates a week of web design posts from your past builds',
    'Launching a new client site — agent drafts an announcement post with project highlights'
  ],
  'Thread: Just shipped a full SaaS dashboard for a dental practice using @lovable_dev 🦷 Here''s what I built in 4 hours: ✅ Patient booking portal ✅ Revenue dashboard ✅ SMS appointment reminders Full stack. No backend team. Just prompts. Here''s the exact prompt stack I used 👇 [thread continues]',
  'social_media_post',
  'Content',
  'Share2',
  2900,
  'active'
),
(
  'Lead Prospector Agent',
  'lead-prospector',
  'Scrapes Google Maps for local businesses and delivers clean lead lists',
  'Targets any city and business category, then scrapes Google Maps and local directories to pull name, phone, email, website, and business category for every result.',
  'You give the agent a city and a business type (e.g. "dentists in Atlanta"). It scrapes Google Maps and local directories, extracts contact details for each business — name, phone number, email address, website URL, and category — then delivers a clean CSV-ready lead list you can use immediately.',
  ARRAY[
    'Finding dentists or law firms in a target city to pitch website rebuilds',
    'Building a cold outreach list for a new service launch in a specific market',
    'Researching local businesses in a niche before a sales call'
  ],
  'Business Name: Atlanta Smiles Dental | Phone: (404) 555-0182 | Email: contact@atlantasmiles.com | Website: atlantasmiles.com | Category: Dental Practice | Location: Buckhead, Atlanta GA | Notes: Site last updated 2021, mobile score 34/100',
  'lead_prospect',
  'Research',
  'Search',
  4900,
  'active'
),
(
  'Website Proposal Agent',
  'website-proposal',
  'Analyzes a business site and generates a personalized rebuild proposal',
  'Takes any scraped business profile, runs their current website through Firecrawl, analyzes design gaps and technical debt, then generates a personalized rebuild proposal ready to send to the client.',
  'Feed it a business name and URL. The agent scrapes their current site with Firecrawl, scores it on design, mobile performance, and conversion elements, then generates a complete rebuild proposal — including what you would change, why it matters to their revenue, and a suggested timeline. Formatted to send directly to the client.',
  ARRAY[
    'Following up on a lead list — generate a proposal for each business automatically',
    'Closing a prospect who wants to see what a new site would look like before committing',
    'Auditing a portfolio of clients to identify upsell opportunities'
  ],
  'WEBSITE REBUILD PROPOSAL — Atlanta Smiles Dental\n\nCurrent State: Your site scores 34/100 on mobile. 67% of dental searches happen on mobile devices. This is costing you new patient bookings every day.\n\nWhat We Build: A fast, conversion-optimized site with online booking, patient testimonials, and Google Maps integration. Built in Lovable. Live in 5 days.\n\nInvestment: $1,200 one-time. ROI: 2 new patients covers the cost.',
  'website_proposal',
  'Outreach',
  'FileText',
  5900,
  'active'
),
(
  'SMS Follow-Up Agent',
  'sms-followup',
  'Auto-texts leads when their application status changes via Twilio',
  'Monitors your application pipeline and automatically sends personalized SMS messages to leads when their status changes — accepted, waitlisted, or rejected — keeping every lead warm without manual effort.',
  'The agent watches your application table in real time. The moment a status changes, it fires a personalized SMS via Twilio using the applicant''s name and specific status message. Accepted applicants get a warm welcome and next step. Waitlisted applicants get a holding message. Rejected applicants get a respectful close with optional redirect.',
  ARRAY[
    'Accepted 3 new members at once — all receive personalized welcome texts automatically',
    'Moving 10 applicants to waitlist — each gets a holding message without you typing a single one',
    'Running a cohort close — rejected applicants get an automated graceful exit message'
  ],
  'SMS to John Martinez: "Hey John — great news. Your PFSW application was just accepted. Your induction starts Monday. Reply READY to confirm your spot. — The PFSW Team"',
  'sms_followup',
  'Outreach',
  'MessageSquare',
  2900,
  'active'
),
(
  'Prompt Packager Agent',
  'prompt-packager',
  'Instantly packages any raw prompt — skips the review queue',
  'Takes any raw prompt you submit and instantly runs it through the full standardization and classification pipeline — title, summary, tags, complexity score, and packaged format — shipping to the library in under 60 seconds.',
  'Submit any raw Lovable prompt. This agent immediately runs the full OpenClaw packaging pipeline: it standardizes the format, writes a clean summary, assigns complexity (simple/medium/complex/advanced), tags it for discoverability, and formats the final packaged prompt. No review queue. Ships directly to the library.',
  ARRAY[
    'You write a prompt during a build session — package it instantly without waiting for the weekly batch',
    'You have 20 prompts backlogged — process all of them in a single run',
    'You want a prompt in the library before your cohort session tomorrow'
  ],
  'TITLE: Multi-Step Lead Capture Form with CRM Integration\nCOMPLEXITY: Advanced\nSUMMARY: Build a 5-step lead capture form with validation, progress tracking, and automatic HubSpot CRM sync on submission.\nTAGS: forms, crm, lead-capture, hubspot, multi-step\nPACKAGED PROMPT: Build a multi-step lead capture form in React with...',
  'prompt_package',
  'Content',
  'Package',
  1900,
  'active'
),
(
  'Site Audit Agent',
  'site-audit',
  'Scans your Lovable app and generates a full UI/UX audit prompt',
  'Give it your live app URL. The agent crawls every page with Firecrawl, analyzes UI patterns, identifies friction points, and generates a complete UI/UX audit prompt ready to paste directly back into Lovable.',
  'Paste your live Lovable app URL. The agent uses Firecrawl to crawl all accessible pages, capturing layout patterns, color usage, navigation structure, mobile behavior, and conversion elements. It then runs an AI analysis and outputs a formatted audit prompt you paste into Lovable to get specific, actionable improvements.',
  ARRAY[
    'You shipped a new app and want a fresh set of eyes before showing clients',
    'Your dashboard feels off but you can not pinpoint why — get a structured audit',
    'Preparing for a demo — audit the app and fix the top 3 issues beforehand'
  ],
  'LOVABLE AUDIT PROMPT — App: app.mysite.com\n\nISSUES FOUND:\n1. Navigation: Active state missing on mobile menu items (affects 68% of users)\n2. Dashboard: KPI cards lack visual hierarchy — all same weight\n3. Forms: No inline validation — users only see errors on submit\n\nFIX INSTRUCTIONS:\nUpdate the navigation component to add...',
  'site_audit',
  'Research',
  'ScanLine',
  3900,
  'active'
),
(
  'Weekly Recap Agent',
  'weekly-recap',
  'Every Sunday, generates a build summary from your session history',
  'Every Sunday morning, the agent pulls your full week of sessions and generations, identifies your most significant builds, and writes a polished recap you can post, share with your cohort, or archive as a build log.',
  'On Sunday at 9am, the agent automatically pulls your prompt sessions, generation count, and project outputs from the past 7 days. It identifies your top 3 builds, writes a narrative summary of your week, and queues it as a draft post. You review, edit if needed, and publish — or let it auto-post.',
  ARRAY[
    'Staying accountable — get a weekly summary of what you actually built vs. what you planned',
    'Content creation — turn your build week into a LinkedIn post automatically',
    'Cohort updates — share your weekly recap with your group to demonstrate momentum'
  ],
  'WEEK OF FEB 10–16 BUILD RECAP\n\nBuilds completed: 4\nPrompts generated: 23\nTop build: SaaS billing dashboard with Stripe integration\n\nThis week I shipped a full billing management system for a SaaS product — invoices, subscription management, and a revenue chart. Also prototyped a lead capture form and a real estate listing page. Week rating: 8/10.',
  'weekly_recap',
  'Content',
  'CalendarDays',
  1900,
  'active'
),
(
  'Email Drip Agent',
  'email-drip',
  'Sends a 3-part email sequence to new leads using your name and brand',
  'When a new lead enters your pipeline, this agent automatically sends a personalized 3-part email sequence — intro, follow-up, and close — using your name, brand, and the lead''s business context.',
  'Configure your brand once. When a new lead comes in, the agent generates and sends three emails over 5 days: Day 1 is a personalized intro referencing their specific business, Day 3 is a follow-up with a specific improvement example for their industry, and Day 5 is a soft close with a clear next step. All emails feel hand-written.',
  ARRAY[
    'New leads from your Lead Prospector — every one gets a 3-email sequence automatically',
    'Cold outreach campaign — send 50 personalized sequences without writing 150 emails',
    'Following up on proposals — automate the follow-up so no deal falls through the cracks'
  ],
  'Subject: Quick thought about Atlanta Smiles Dental\n\nHi Dr. Chen,\n\nI was browsing local dental practices in Buckhead and noticed your site — great reviews, clearly a trusted practice.\n\nI build modern websites for dental practices specifically. I''ve seen practices like yours increase new patient inquiries by 40% just from updating their booking flow.\n\nMind if I show you what a redesigned site would look like? Takes 10 minutes on a call.',
  'email_drip',
  'Outreach',
  'Mail',
  4900,
  'coming_soon'
),
(
  'Competitor Intel Agent',
  'competitor-intel',
  'Scrapes any competitor URL and generates a full positioning report',
  'Give it a competitor''s URL. The agent scrapes their entire site, extracts their tech stack, pricing strategy, positioning language, and copy style, then generates a structured positioning report you can act on immediately.',
  'Paste any competitor URL. The agent crawls the site with Firecrawl, identifies their tech stack, extracts pricing tiers if visible, analyzes their positioning language and target audience, and reviews their call-to-action strategy. The output is a formatted intelligence report with specific gaps you can exploit in your own positioning.',
  ARRAY[
    'A new competitor entered your market — understand their positioning before your next pitch',
    'Refreshing your own site copy — benchmark against 3 competitors first',
    'Client asks why they should choose you — have a specific comparison ready'
  ],
  'COMPETITOR INTEL REPORT — webflow.com\n\nSTACK: Webflow CMS, Stripe, Intercom, Segment\nPRICING: $14–$39/mo (individual), $23–$212/mo (team)\nPOSITIONING: Targets "designers who can''t code" — heavy visual editor emphasis\nWEAKNESS: Zero mention of AI or speed. Their case studies average 3 weeks to launch.\nYOUR ANGLE: "Launch in days, not weeks. Built with AI."',
  'competitor_intel',
  'Research',
  'Eye',
  3900,
  'active'
),
(
  'Onboarding Agent',
  'onboarding',
  'Welcomes new members with an SMS, prompt suggestion, and onboard log',
  'The moment a new member is accepted and activated, this agent fires a welcome SMS, generates a personalized first-build prompt suggestion based on their application answers, and logs the full onboarding event.',
  'Triggered when a member status changes to active. The agent reads their application to understand their product, role, and goals. It sends a warm welcome SMS via Twilio, generates a custom first-build prompt tailored to their specific situation, and creates an onboarding log entry. The member starts Day 1 with a clear, personalized action.',
  ARRAY[
    'New cohort starts Monday — every member gets a personalized welcome SMS Sunday night',
    'Member just paid — they receive a first-build prompt matched to their specific product idea',
    'High-volume intake week — onboard 20 members simultaneously without any manual work'
  ],
  'SMS: "Welcome to PFSW, Marcus. Your cohort kicks off Monday at 7PM ET. Your first build prompt is ready in the Engine — it''s built around your SaaS billing idea. Start there. — The PFSW Team"\n\nFIRST BUILD PROMPT QUEUED: "Build a Stripe-integrated billing dashboard for a B2B SaaS tool with invoice history, subscription management, and MRR tracking..."',
  'onboarding',
  'Outreach',
  'UserCheck',
  2900,
  'active'
);
