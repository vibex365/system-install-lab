export interface NicheMagazineSection {
  type: "hero" | "before_after" | "agent_stack" | "pipeline" | "stats" | "cta";
  title?: string;
  subtitle?: string;
  content?: string;
  before?: { title: string; points: string[] };
  after?: { title: string; points: string[] };
  agents?: { name: string; action: string; icon: string }[];
  stages?: string[];
  stats?: { label: string; value: string; sub: string }[];
}

export interface NicheMagazine {
  niche: string;
  slug: string;
  display_name: string;
  tagline: string;
  hero_stat: string;
  hero_stat_label: string;
  color: string;
  hero_image: string;
  agents_image: string;
  sections: NicheMagazineSection[];
}

export const NICHE_MAGAZINES: NicheMagazine[] = [
  {
    niche: "lawyer",
    slug: "lawyers",
    display_name: "Law Firms",
    tagline: "Stop Losing Cases Before They Start",
    hero_stat: "67%",
    hero_stat_label: "of potential clients never hear back from their first inquiry",
    color: "#3b82f6",
    hero_image: "/niche/lawyers-hero.jpg",
    agents_image: "/niche/lawyers-agents.jpg",
    sections: [
      {
        type: "hero",
        title: "Your Intake Process Is Bleeding Revenue",
        subtitle: "Every missed call, slow email reply, and forgotten follow-up is a retained client that went to opposing counsel.",
      },
      {
        type: "before_after",
        title: "The Transformation",
        before: {
          title: "Without the System",
          points: [
            "Leads sit in voicemail for 24-48 hours",
            "No qualification — paralegals chase unqualified inquiries",
            "Manual scheduling with back-and-forth emails",
            "No follow-up after initial consultation",
            "Zero visibility into which marketing channels convert",
          ],
        },
        after: {
          title: "With PFSW Deployed",
          points: [
            "AI qualifies leads in under 60 seconds via quiz funnel",
            "High-intent prospects auto-booked onto your calendar",
            "SMS callback triggers AI consultation briefing",
            "Automated follow-up sequences nurture undecided prospects",
            "Full pipeline visibility: inquiry → consultation → retained",
          ],
        },
      },
      {
        type: "agent_stack",
        title: "Your AI Legal Intake Team",
        subtitle: "Five autonomous agents working 24/7 so your associates focus on billable hours.",
        agents: [
          { name: "Scout Agent", action: "Finds people actively searching for legal help — forum posts, social threads, local queries like 'does anyone know a good lawyer?'", icon: "Search" },
          { name: "Qualifier Agent", action: "Scores incoming leads by case type, urgency, and budget fit", icon: "Filter" },
          { name: "Outreach Agent", action: "Sends personalized follow-ups via email and SMS", icon: "Send" },
          { name: "Booker Agent", action: "Auto-schedules consultations on available slots", icon: "Calendar" },
          { name: "Voice Agent", action: "AI-powered callback briefs prospects on their case assessment", icon: "Phone" },
        ],
      },
      {
        type: "pipeline",
        title: "Your Automated Pipeline",
        stages: ["Inquiry", "Consultation Booked", "Case Review", "Retained", "Active Client"],
      },
      {
        type: "stats",
        stats: [
          { label: "Response Time", value: "<60s", sub: "vs 24-48hr industry avg" },
          { label: "Qualification Rate", value: "3.2x", sub: "more qualified consults" },
          { label: "Show Rate", value: "89%", sub: "AI-booked consultations" },
        ],
      },
      { type: "cta", title: "See It In Action", subtitle: "Take the 2-minute assessment and watch the system qualify you in real-time." },
    ],
  },
  {
    niche: "fitness",
    slug: "fitness",
    display_name: "Fitness & Personal Training",
    tagline: "Fill Your Calendar Without Chasing Leads",
    hero_stat: "73%",
    hero_stat_label: "of gym prospects never convert because follow-up dies after the first contact",
    color: "#22c55e",
    hero_image: "/niche/fitness-hero.jpg",
    agents_image: "/niche/fitness-agents.jpg",
    sections: [
      {
        type: "hero",
        title: "Your DMs Are Full. Your Calendar Is Empty.",
        subtitle: "Instagram followers and free trial signups mean nothing if you cannot convert them into paying members.",
      },
      {
        type: "before_after",
        title: "The Transformation",
        before: {
          title: "Without the System",
          points: [
            "DM conversations go cold after 2-3 messages",
            "Trial session no-shows eat your schedule",
            "Manual reminders sent when you remember",
            "No system for re-engaging expired trial members",
            "Revenue plateaus despite growing social following",
          ],
        },
        after: {
          title: "With PFSW Deployed",
          points: [
            "Quiz funnel pre-qualifies prospects by goal, commitment, and budget",
            "AI books trial sessions directly onto your calendar",
            "Automated SMS reminders reduce no-shows by 60%",
            "Voice agent calls prospects to confirm and upsell packages",
            "Full pipeline: Lead → Trial Booked → Completed → Member",
          ],
        },
      },
      {
        type: "agent_stack",
        title: "Your AI Training Staff",
        subtitle: "Autonomous agents that handle lead gen while you train clients.",
        agents: [
          { name: "Scout Agent", action: "Finds people posting about wanting a trainer, gym recommendations, or weight loss help on Reddit, Facebook groups, and local forums", icon: "Search" },
          { name: "Qualifier Agent", action: "Assesses fitness goals, experience, and readiness to commit", icon: "Filter" },
          { name: "Outreach Agent", action: "Sends goal-specific follow-ups that drive trial bookings", icon: "Send" },
          { name: "Booker Agent", action: "Schedules trial sessions and sends prep instructions", icon: "Calendar" },
          { name: "Voice Agent", action: "Personalized callback confirms commitment and builds rapport", icon: "Phone" },
        ],
      },
      {
        type: "pipeline",
        title: "Your Automated Pipeline",
        stages: ["Lead", "Trial Booked", "Trial Completed", "Member", "Active Member"],
      },
      {
        type: "stats",
        stats: [
          { label: "Trial Booking Rate", value: "4.1x", sub: "vs manual DM outreach" },
          { label: "No-Show Rate", value: "-58%", sub: "with automated reminders" },
          { label: "Trial → Member", value: "42%", sub: "conversion rate" },
        ],
      },
      { type: "cta", title: "See It In Action", subtitle: "Take the fitness business assessment and watch the AI qualify you live." },
    ],
  },
  {
    niche: "real_estate",
    slug: "real-estate",
    display_name: "Real Estate",
    tagline: "Convert Leads Before Your Competition Even Responds",
    hero_stat: "78%",
    hero_stat_label: "of real estate leads go to the first agent who responds",
    color: "#f59e0b",
    hero_image: "/niche/realestate-hero.jpg",
    agents_image: "/niche/realestate-agents.jpg",
    sections: [
      {
        type: "hero",
        title: "Speed Kills — And You Are Losing the Race",
        subtitle: "In real estate, the agent who responds first wins. Your current process takes hours. Ours takes seconds.",
      },
      {
        type: "before_after",
        title: "The Transformation",
        before: {
          title: "Without the System",
          points: [
            "Zillow leads sit uncontacted for 4-6 hours",
            "Open house sign-in sheets collect dust",
            "No automated nurture for 'just browsing' leads",
            "Manual CMA requests take days to fulfill",
            "Lost track of which leads are hot vs cold",
          ],
        },
        after: {
          title: "With PFSW Deployed",
          points: [
            "Quiz funnel qualifies buyers/sellers by timeline and budget in 90 seconds",
            "AI schedules home valuations and showings automatically",
            "Market reports auto-sent to nurture long-timeline prospects",
            "Voice agent calls qualified leads to confirm interest",
            "Full pipeline: Lead → Showing → Offer → Contract → Closed",
          ],
        },
      },
      {
        type: "agent_stack",
        title: "Your AI Real Estate Team",
        subtitle: "Five agents that never take a listing day off.",
        agents: [
          { name: "Scout Agent", action: "Finds people actively posting about buying or selling homes — 'looking for a realtor in [city]' on Reddit, Nextdoor, and Facebook groups", icon: "Search" },
          { name: "Qualifier Agent", action: "Scores leads by timeline, price range, and motivation level", icon: "Filter" },
          { name: "Outreach Agent", action: "Sends personalized market updates and CMA invitations", icon: "Send" },
          { name: "Booker Agent", action: "Auto-schedules showings and home valuations", icon: "Calendar" },
          { name: "Voice Agent", action: "AI callback confirms showing details and pre-qualifies", icon: "Phone" },
        ],
      },
      {
        type: "pipeline",
        title: "Your Automated Pipeline",
        stages: ["Lead", "Showing Booked", "Offer Made", "Under Contract", "Closed"],
      },
      {
        type: "stats",
        stats: [
          { label: "Response Time", value: "<90s", sub: "vs 4-6hr industry avg" },
          { label: "Showing Rate", value: "2.8x", sub: "more showings booked" },
          { label: "Close Rate", value: "+34%", sub: "improvement over manual" },
        ],
      },
      { type: "cta", title: "See It In Action", subtitle: "Take the real estate readiness quiz and see the system work." },
    ],
  },
  {
    niche: "dentist",
    slug: "dentists",
    display_name: "Dental Practices",
    tagline: "Fill Every Chair. Automatically.",
    hero_stat: "43%",
    hero_stat_label: "of dental appointment slots go unfilled due to poor follow-up and no-shows",
    color: "#06b6d4",
    hero_image: "/niche/dentists-hero.jpg",
    agents_image: "/niche/dentists-agents.jpg",
    sections: [
      {
        type: "hero",
        title: "Empty Chairs Are Not a Marketing Problem. They Are a Systems Problem.",
        subtitle: "Your hygienists are ready. Your chairs are open. But your front desk cannot keep up with follow-ups, recalls, and new patient intake.",
      },
      {
        type: "before_after",
        title: "The Transformation",
        before: {
          title: "Without the System",
          points: [
            "Front desk juggles phones, walk-ins, and insurance verification",
            "Recall reminders sent inconsistently (or not at all)",
            "New patient forms create 15-minute intake bottleneck",
            "No-shows cost $150-300 per empty chair hour",
            "Marketing spend has zero attribution to actual appointments",
          ],
        },
        after: {
          title: "With PFSW Deployed",
          points: [
            "Quiz funnel screens patients by concern, insurance, and urgency",
            "AI books checkups and cleanings onto your schedule",
            "Automated SMS reminders cut no-shows by 55%",
            "Voice agent confirms appointments and collects pre-visit info",
            "Full pipeline: Inquiry → Booked → Exam → Treatment Plan → Active",
          ],
        },
      },
      {
        type: "agent_stack",
        title: "Your AI Front Desk",
        subtitle: "Autonomous agents that handle patient acquisition so your team focuses on care.",
        agents: [
          { name: "Scout Agent", action: "Finds people asking for dentist recommendations on local forums, Google reviews, and community groups — 'need a good dentist near me'", icon: "Search" },
          { name: "Qualifier Agent", action: "Screens by dental concern, insurance type, and urgency", icon: "Filter" },
          { name: "Outreach Agent", action: "Sends appointment reminders and recall notifications", icon: "Send" },
          { name: "Booker Agent", action: "Auto-schedules checkups into available hygienist slots", icon: "Calendar" },
          { name: "Voice Agent", action: "Confirms appointments and collects insurance details by phone", icon: "Phone" },
        ],
      },
      {
        type: "pipeline",
        title: "Your Automated Pipeline",
        stages: ["Inquiry", "Appointment Booked", "Exam Completed", "Treatment Plan", "Active Patient"],
      },
      {
        type: "stats",
        stats: [
          { label: "Chair Utilization", value: "+41%", sub: "increase in filled slots" },
          { label: "No-Show Rate", value: "-55%", sub: "with SMS + voice confirm" },
          { label: "New Patients", value: "3.6x", sub: "monthly acquisition" },
        ],
      },
      { type: "cta", title: "See It In Action", subtitle: "Take the dental practice assessment and watch the AI triage your practice." },
    ],
  },
];
