import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Who is this for?",
    a: "Founders, operators, and builders who are done relying on motivation and ready to install repeatable execution systems.",
  },
  {
    q: "What do I get in the first week?",
    a: "A full diagnostic of your current execution gaps, your first system blueprint, and access to the operator community.",
  },
  {
    q: "Is this coaching or software?",
    a: "Neither. It's a systems-installation process. You get frameworks, templates, cadence structures, and direct feedback — not advice.",
  },
  {
    q: "How does applying work?",
    a: "Submit the short application. We review within 48 hours. If it's a fit, you get onboarded into your first sprint cycle.",
  },
  {
    q: "What if I'm early stage?",
    a: "Early stage is ideal. Systems installed before scale compound. The earlier you build the operating layer, the faster you move.",
  },
  {
    q: "Can I cancel?",
    a: "Yes. No contracts, no lock-in. But the systems you install stay with you.",
  },
];

export function FAQAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full max-w-2xl">
      {faqs.map((faq, i) => (
        <AccordionItem key={i} value={`faq-${i}`} className="border-border">
          <AccordionTrigger className="text-left text-foreground hover:text-primary hover:no-underline tracking-tight">
            {faq.q}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed">
            {faq.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
