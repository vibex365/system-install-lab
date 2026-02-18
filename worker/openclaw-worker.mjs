/**
 * OpenClaw Worker — polls jobs-claim, processes prompts via AI, reports to jobs-report.
 *
 * Usage:
 *   OPENCLAW_WORKER_KEY=your_key SUPABASE_URL=https://ioepxvknkxapeqcuxwdt.supabase.co node worker/openclaw-worker.mjs
 *
 * Environment variables:
 *   OPENCLAW_WORKER_KEY  — shared secret matching the Lovable Cloud secret
 *   SUPABASE_URL         — your project's Supabase URL
 *   POLL_INTERVAL_MS     — polling interval in ms (default: 10000)
 */

const WORKER_KEY = process.env.OPENCLAW_WORKER_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS || "10000", 10);

if (!WORKER_KEY || !SUPABASE_URL) {
  console.error("❌  Missing OPENCLAW_WORKER_KEY or SUPABASE_URL env vars");
  process.exit(1);
}

const CLAIM_URL = `${SUPABASE_URL}/functions/v1/jobs-claim`;
const REPORT_URL = `${SUPABASE_URL}/functions/v1/jobs-report`;
const GENERATE_URL = `${SUPABASE_URL}/functions/v1/generate-prompt`;

const headers = {
  "Content-Type": "application/json",
  "x-worker-key": WORKER_KEY,
};

// ── AI helper ───────────────────────────────────────────────────────
async function callAI(system, message) {
  const res = await fetch(GENERATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, message }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI call failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return data.text || "";
}

// ── Processing logic ────────────────────────────────────────────────
async function processJob(job) {
  const payload = job.payload_json || {};
  const submissionId = payload.submission_id;
  const rawPrompt = payload.raw_prompt || "";
  const title = payload.title || "";
  const problem = payload.problem || "";
  const scope = payload.scope || "";
  const integrations = payload.integrations || [];

  console.log(`  📝 Processing submission ${submissionId}: "${title}"`);

  const steps = [];

  // ── Step 1: Standardize the prompt ────────────────────────────────
  let standardizedPrompt = rawPrompt;
  try {
    const standardizeSystem = `You are a prompt engineer specializing in Lovable.dev build prompts.
Your job is to take a raw user-submitted prompt and rewrite it into a clean, well-structured,
production-ready prompt that follows best practices.

Rules:
- Keep the user's intent and requirements intact
- Organize into clear sections: Objective, Stack, Routes, Schema, UI/UX, Integrations, Acceptance Criteria
- Remove redundancy, fix grammar, clarify vague instructions
- Add missing but obvious requirements (e.g. responsive design, error handling)
- Use imperative voice ("Create...", "Implement...", "Add...")
- Output ONLY the rewritten prompt, no commentary`;

    const standardizeInput = `Title: ${title}
Problem: ${problem}
Scope: ${scope}
Integrations: ${integrations.join(", ") || "None specified"}

Raw Prompt:
${rawPrompt}`;

    standardizedPrompt = await callAI(standardizeSystem, standardizeInput);
    steps.push({
      step: "standardize",
      input_snippet: rawPrompt.slice(0, 200),
      output_snippet: standardizedPrompt.slice(0, 200),
      success: true,
    });
    console.log(`    ✅ Standardized`);
  } catch (err) {
    console.error(`    ⚠️  Standardize failed: ${err.message}`);
    steps.push({
      step: "standardize",
      input_snippet: rawPrompt.slice(0, 200),
      output_snippet: `Error: ${err.message}`,
      success: false,
    });
  }

  // ── Step 2: Generate summary, tags, complexity ────────────────────
  let summary = `Submission: ${title}`;
  let tags = ["unprocessed"];
  let complexity = "medium";

  try {
    const classifySystem = `You are a prompt classifier. Given a build prompt, output a JSON object with:
- "summary": A 1-2 sentence summary of what the prompt builds (max 150 chars)
- "tags": An array of 2-5 lowercase tags describing the tech/domain (e.g. ["auth","stripe","dashboard","crud"])
- "complexity": One of "simple", "medium", "complex", "advanced"

Output ONLY valid JSON, no markdown fences, no commentary.`;

    const classifyResult = await callAI(classifySystem, standardizedPrompt);

    // Parse JSON from AI response
    const jsonMatch = classifyResult.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      summary = parsed.summary || summary;
      tags = Array.isArray(parsed.tags) ? parsed.tags : tags;
      complexity = parsed.complexity || complexity;
    }

    steps.push({
      step: "classify",
      input_snippet: standardizedPrompt.slice(0, 200),
      output_snippet: JSON.stringify({ summary, tags, complexity }),
      success: true,
    });
    console.log(`    ✅ Classified: [${tags.join(", ")}] — ${complexity}`);
  } catch (err) {
    console.error(`    ⚠️  Classify failed: ${err.message}`);
    steps.push({
      step: "classify",
      input_snippet: standardizedPrompt.slice(0, 200),
      output_snippet: `Error: ${err.message}`,
      success: false,
    });
  }

  return {
    job_id: job.id,
    standardized_prompt_text: standardizedPrompt,
    summary,
    tags,
    complexity,
    steps,
  };
}

// ── Main loop ───────────────────────────────────────────────────────
async function claimJob() {
  const res = await fetch(CLAIM_URL, { method: "POST", headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claim failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function reportResult(result) {
  const res = await fetch(REPORT_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(result),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Report failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function poll() {
  try {
    const { job } = await claimJob();
    if (!job) return; // queue empty

    console.log(`⚙️  Claimed job ${job.id} (type: ${job.type})`);
    const result = await processJob(job);
    await reportResult(result);
    console.log(`✅  Reported job ${job.id} as completed`);

    // Immediately poll again if there was work
    setImmediate(poll);
    return;
  } catch (err) {
    console.error("❌  Worker error:", err.message);
  }
}

// Start
console.log(`🚀 OpenClaw worker started (polling every ${POLL_INTERVAL}ms)`);
setInterval(poll, POLL_INTERVAL);
poll(); // first run immediately
