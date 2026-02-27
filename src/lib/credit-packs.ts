export interface CreditPack {
  key: string;
  resource: "leads" | "sms" | "voice_calls" | "workflows";
  label: string;
  credits: number;
  price: number; // dollars
  price_id: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  // Leads
  { key: "leads_50", resource: "leads", label: "50 Leads", credits: 50, price: 19, price_id: "price_1T5PI1AsrgxssNTV7q06aNyu" },
  { key: "leads_200", resource: "leads", label: "200 Leads", credits: 200, price: 49, price_id: "price_1T5PI1AsrgxssNTVpxS8qqXu" },
  // SMS
  { key: "sms_100", resource: "sms", label: "100 SMS", credits: 100, price: 19, price_id: "price_1T5PI2AsrgxssNTVTQBNUHmf" },
  { key: "sms_500", resource: "sms", label: "500 SMS", credits: 500, price: 49, price_id: "price_1T5PI3AsrgxssNTVe7LYTM4H" },
  // Voice
  { key: "voice_10", resource: "voice_calls", label: "10 Voice Calls", credits: 10, price: 19, price_id: "price_1T5PI4AsrgxssNTVLZJ89XUH" },
  { key: "voice_50", resource: "voice_calls", label: "50 Voice Calls", credits: 50, price: 49, price_id: "price_1T5PI5AsrgxssNTVYPr7imFU" },
  // Workflows
  { key: "workflows_5", resource: "workflows", label: "5 Workflows", credits: 5, price: 9, price_id: "price_1T5PI6AsrgxssNTVhlhjBHaj" },
  { key: "workflows_20", resource: "workflows", label: "20 Workflows", credits: 20, price: 29, price_id: "price_1T5PI7AsrgxssNTV9XWd0doN" },
];

export const RESOURCE_LABELS: Record<string, string> = {
  leads: "Leads",
  sms: "SMS",
  voice_calls: "Voice Calls",
  workflows: "Workflows",
};
