/**
 * OpenClaw Worker — polls jobs-claim, processes prompts, reports to jobs-report.
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

const headers = {
  "Content-Type": "application/json",
  "x-worker-key": WORKER_KEY,
};

// ── Processing logic ────────────────────────────────────────────────
// Replace this with your actual prompt standardization logic.
async function processJob(job) {
  const payload = job.payload_json || {};
  const submissionId = payload.submission_id;
  const rawPrompt = payload.raw_prompt || "";
  const title = payload.title || "";

  console.log(`  📝 Processing submission ${submissionId}: "${title}"`);

  const steps = [];

  // Step 1: Parse
  steps.push({
    step: "parse",
    input_snippet: rawPrompt.slice(0, 200),
    output_snippet: "Parsed successfully",
    success: true,
  });

  // Step 2: Standardize
  // TODO: Replace with your AI/LLM call to standardize the prompt
  const standardizedPrompt = rawPrompt; // placeholder — replace with actual logic
  steps.push({
    step: "standardize",
    input_snippet: rawPrompt.slice(0, 200),
    output_snippet: standardizedPrompt.slice(0, 200),
    success: true,
  });

  // Step 3: Tag & classify
  // TODO: Replace with your AI/LLM call to generate tags, summary, complexity
  const tags = ["unprocessed"];
  const summary = `Submission: ${title}`;
  const complexity = "medium";
  steps.push({
    step: "classify",
    input_snippet: standardizedPrompt.slice(0, 200),
    output_snippet: JSON.stringify({ tags, complexity }),
    success: true,
  });

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
