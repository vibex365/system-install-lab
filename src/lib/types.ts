export interface Application {
  id: string;
  name: string;
  email: string;
  role: "founder" | "operator" | "creator" | "other";
  stage: "idea" | "pre-revenue" | "revenue" | "scaling";
  product: string;
  bottleneck: string;
  whyNow?: string;
  createdAt: string;
}

export interface WaitlistEntry {
  id: string;
  email: string;
  note?: string;
  createdAt: string;
}

export interface Member {
  id: string;
  email: string;
  status: "active" | "inactive";
  createdAt: string;
}
