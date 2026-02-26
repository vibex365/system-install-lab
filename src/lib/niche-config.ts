export type NicheKey = "mlm" | "affiliate" | "coaching" | "home_business";

export interface NicheConfig {
  id: NicheKey;
  display_name: string;
  pipeline_stages: string[];
  cta_label: string;
  stat_labels: Record<string, string>;
}

export const NICHE_CONFIGS: Record<NicheKey, NicheConfig> = {
  mlm: {
    id: "mlm",
    display_name: "MLM / Network Marketing",
    pipeline_stages: ["prospect", "contacted", "interested", "enrolled", "active_rep"],
    cta_label: "Book Your Strategy Call",
    stat_labels: { leads: "Prospects", booked: "Calls Booked", converted: "Reps Enrolled" },
  },
  affiliate: {
    id: "affiliate",
    display_name: "Affiliate Marketing",
    pipeline_stages: ["lead", "clicked", "signed_up", "first_sale", "recurring"],
    cta_label: "Start Earning Today",
    stat_labels: { leads: "Leads", booked: "Demos", converted: "Sign-ups" },
  },
  coaching: {
    id: "coaching",
    display_name: "Online Coaching",
    pipeline_stages: ["inquiry", "discovery_call", "proposal", "enrolled", "active_client"],
    cta_label: "Book Your Free Discovery Call",
    stat_labels: { leads: "Inquiries", booked: "Discovery Calls", converted: "Clients" },
  },
  home_business: {
    id: "home_business",
    display_name: "Work From Home",
    pipeline_stages: ["interested", "qualified", "onboarding", "launched", "earning"],
    cta_label: "Find Your Perfect Opportunity",
    stat_labels: { leads: "Interested", booked: "Calls", converted: "Started" },
  },
};

export const PFSW_TIERS = {
  starter: {
    name: "Starter",
    price_monthly: 4700,
    limits: { workflows: 3, leads: 100, funnels: 3, sms: 50, voice_calls: 0, campaigns: 1 },
  },
  growth: {
    name: "Growth",
    price_monthly: 9700,
    limits: { workflows: 10, leads: 500, funnels: -1, sms: 200, voice_calls: 20, campaigns: 5 },
  },
  scale: {
    name: "Scale",
    price_monthly: 19700,
    limits: { workflows: -1, leads: 2000, funnels: -1, sms: 1000, voice_calls: 100, campaigns: -1 },
  },
} as const;
