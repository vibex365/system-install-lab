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
        title: "We Find Your Next Clients Before They Find Your Competition",
        subtitle: "People are posting on Reddit, Facebook, and local forums right now asking 'does anyone know a good lawyer?' — we find them, qualify them, and book them on your calendar automatically.",
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
            "AI scans Reddit, Facebook groups, and local forums for people asking for legal help in your area",
            "Qualified prospects auto-booked onto your calendar",
            "SMS and email outreach engages them before competing firms respond",
            "Automated follow-up sequences nurture undecided prospects",
            "Full pipeline visibility: forum post found → contacted → consultation → retained",
          ],
        },
      },
      {
        type: "agent_stack",
        title: "Your AI Client Acquisition Team",
        subtitle: "Five autonomous agents finding and closing clients for your firm 24/7.",
        agents: [
          { name: "Scout Agent", action: "Automatically scans Reddit, Avvo, Facebook groups, and Nextdoor on a daily schedule — finds people asking 'need a lawyer for...' and creates a lead in your CRM with a ready-to-post reply template. You get notified instantly.", icon: "Search" },
          { name: "Qualifier Agent", action: "Scores each prospect by case type, urgency, and whether they match your practice area", icon: "Filter" },
          { name: "Outreach Agent", action: "Sends personalized email and SMS follow-ups to leads who share contact info", icon: "Send" },
          { name: "Booker Agent", action: "Auto-schedules consultations directly onto your calendar", icon: "Calendar" },
          { name: "Voice Agent", action: "AI-powered callback confirms appointment and briefs the prospect on next steps", icon: "Phone" },
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
        title: "We Find People Ready to Train — You Just Show Up and Coach",
        subtitle: "Right now, people in your area are posting on Reddit, Facebook, and local groups asking for trainer recommendations. We find them, reach out, and fill your calendar.",
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
            "AI scans Reddit fitness subs, Facebook groups, and local community boards for people looking for trainers in your area",
            "Qualified leads auto-booked for trial sessions on your calendar",
            "Automated SMS reminders reduce no-shows by 60%",
            "Voice agent calls to confirm and build rapport before the first session",
            "Full pipeline: Forum post found → Contacted → Trial Booked → Member",
          ],
        },
      },
      {
        type: "agent_stack",
        title: "Your AI Client Finder",
        subtitle: "Autonomous agents that find paying clients while you focus on training.",
        agents: [
          { name: "Scout Agent", action: "Runs daily scans of r/fitness, Facebook groups, and Nextdoor — finds people asking for trainer recommendations, saves them as leads, and notifies you with a copy-paste reply template to post manually.", icon: "Search" },
          { name: "Qualifier Agent", action: "Assesses each prospect's fitness goals, budget, and readiness to commit", icon: "Filter" },
          { name: "Outreach Agent", action: "Sends personalized email and SMS follow-ups to leads who share contact info", icon: "Send" },
          { name: "Booker Agent", action: "Schedules trial sessions directly onto your calendar with prep instructions", icon: "Calendar" },
          { name: "Voice Agent", action: "Personalized callback confirms the session and builds rapport before day one", icon: "Phone" },
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
        title: "We Find Buyers and Sellers Before They Hit Zillow",
        subtitle: "People post on Reddit, Nextdoor, and Facebook groups every day asking 'anyone know a good realtor in [city]?' — we find them first, reach out, and book the showing.",
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
            "AI scans Reddit, Nextdoor, Facebook groups, and local forums for people actively asking about buying or selling in your farm area",
            "Qualified prospects auto-booked for showings or home valuations",
            "Personalized outreach reaches them before competing agents",
            "Voice agent calls to confirm interest and pre-qualify",
            "Full pipeline: Forum post found → Contacted → Showing → Offer → Closed",
          ],
        },
      },
      {
        type: "agent_stack",
        title: "Your AI Client Acquisition Team",
        subtitle: "Five agents finding buyers and sellers in your area 24/7.",
        agents: [
          { name: "Scout Agent", action: "Automatically scans Reddit, Nextdoor, and Facebook daily — finds people asking about buying or selling homes in your area, creates CRM leads, and sends you a notification with a suggested reply to post.", icon: "Search" },
          { name: "Qualifier Agent", action: "Scores each prospect by timeline, price range, and motivation level", icon: "Filter" },
          { name: "Outreach Agent", action: "Sends personalized email and SMS follow-ups to leads who share contact info", icon: "Send" },
          { name: "Booker Agent", action: "Auto-schedules showings and home valuations onto your calendar", icon: "Calendar" },
          { name: "Voice Agent", action: "AI callback confirms details and pre-qualifies the prospect before you meet", icon: "Phone" },
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
        title: "We Fill Your Chairs With New Patients — Automatically",
        subtitle: "People in your area are posting on Facebook, Nextdoor, and Google right now asking 'who's a good dentist near me?' — we find them, reach out, and book the appointment.",
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
            "AI scans Nextdoor, Facebook groups, Google reviews, and local forums for people asking for dentist recommendations in your area",
            "Qualified new patients auto-booked onto your schedule",
            "Personalized outreach reaches them before competing practices",
            "Voice agent confirms appointments and collects insurance details",
            "Full pipeline: Forum post found → Contacted → Booked → Exam → Active Patient",
          ],
        },
      },
      {
        type: "agent_stack",
        title: "Your AI Patient Acquisition Team",
        subtitle: "Autonomous agents finding new patients in your area so your team focuses on care.",
        agents: [
          { name: "Scout Agent", action: "Scans Nextdoor, Facebook groups, and local forums daily — finds people asking for dentist recommendations, creates leads in your CRM, and notifies you with a ready-to-post reply template.", icon: "Search" },
          { name: "Qualifier Agent", action: "Screens each prospect by dental concern, insurance type, and urgency", icon: "Filter" },
          { name: "Outreach Agent", action: "Sends personalized email and SMS follow-ups to leads who share contact info", icon: "Send" },
          { name: "Booker Agent", action: "Auto-schedules checkups and cleanings into available hygienist slots", icon: "Calendar" },
          { name: "Voice Agent", action: "Confirms appointments and collects insurance details by phone before the visit", icon: "Phone" },
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
