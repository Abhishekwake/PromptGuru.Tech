import axios from "axios";

const ROOM_STATES = {
  WAITING: "WAITING",
  ACTIVE: "ACTIVE",
  FINISHED: "FINISHED",
};

/** 45s per MCQ — readable duel pace */
const ROUND_DURATION_MS = 45 * 1000;
/** Prompt-engineering curriculum: 12 steps from basics to anti-patterns */
const TOTAL_ROUNDS = 12;
const MIN_PLAYERS_TO_START = 2;
const MAX_PLAYERS_PER_ROOM = 10;
/** Brief beat to show reveal + “you won” before next lesson */
const ROUND_END_PAUSE_MS = 2600;

/**
 * One syllabus row per quiz round — plain English so items stay readable for ESL learners too.
 */
const ROUND_BLUEPRINTS = [
  {
    lesson: "narrow_scope_files",
    mustTeach:
      "Bad: ask AI to fix the whole app. Good: name one file or folder + one clear small task.",
    questionStyle:
      "You plus an AI coding assistant (or short dev chat). Four prompts. Best names one concrete file path plus one small bug or task. Bad ones say refactor everything, whole repo, or stay vague.",
    avoidStem:
      "Do not start with 'Which of the following best demonstrates…'. Sound like Slack or Discord, short lines.",
  },
  {
    lesson: "role_plus_context",
    mustTeach:
      "Writing 'you are senior engineer' alone is weak. Good prompts add WHO it is for, limits, deadline, what 'done' means, and glue to real pasted text.",
    questionStyle:
      "Same product idea × four prompts. Only one mixes role plus real limits + reader + deadline in simple words.",
    avoidStem:
      'No textbook tone. No "which demonstrates clearer goal".',
  },
  {
    lesson: "explicit_goal_format",
    mustTeach:
      'Say WHAT shape you want: bullet list vs short essay vs tiny table + tone ("casual Slack") plus when to stop.',
    questionStyle:
      "Blurry homework ask + four rewrites; pick rewrite that spells format + stopping rule.",
    avoidStem:
      "",
  },
  {
    lesson: "context_scope",
    mustTeach:
      "Huge tasks in one message waste time. Slice: first find problem, smallest fix next, stop before random files.",
    questionStyle:
      "Support ticket: one overloaded request vs phased steps. Stem = ticket body in plain speech.",
    avoidStem: "",
  },
  {
    lesson: "output_schema",
    mustTeach:
      'Structured data: spell field NAMES and rules; add one mini example—not only "give me JSON".',
    questionStyle:
      "Tiny API task—four prompts ask for JSON. Best one lists keys + enums + toy example.",
    avoidStem: "",
  },
  {
    lesson: "smart_constraints",
    mustTeach:
      'Open tasks need guardrails—word caps, banned hype words, voice—else answers drift everywhere.',
    questionStyle:
      "Name ideas for a signup page. Compare four fences; prize the one with crisp limits.",
    avoidStem: "",
  },
  {
    lesson: "vague_instructions",
    mustTeach:
      'Commands like change this/fix it—with no error line, path, done-when—burn time in back-and-forth.',
    questionStyle:
      "Chat between dev and Copilot-ish bot. Highlight the weakest line with simple WHY hint.",
    avoidStem: "",
  },
  {
    lesson: "iterative_refinement",
    mustTeach:
      'Repeat do better is noisy. Quote bad lines + say WHY + propose small patch—not just try harder louder.',
    questionStyle:
      "Messy JSX came back—pick follow-up that gives rubric-lite checks + cites lines + snippet fix.",
    avoidStem: "",
  },
  {
    lesson: "few_shot",
    mustTeach:
      "Teaching by pattern = show INPUT then OUTPUT pairs back-to-back the model copies.",
    questionStyle:
      "Four blocks label example—only one pairs micro input→output twice or more realistically.",
    avoidStem: "",
  },
  {
    lesson: "grounding_evidence",
    mustTeach:
      "Risky factual checks: paste the exact lines or bullets and say answer ONLY from pasted text.",
    questionStyle:
      "Policy-ish yes/no minus pasted clause vs pasted clause + cite-only rule.",
    avoidStem: "",
  },
  {
    lesson: "scope_control",
    mustTeach:
      "Long wishlists should become step A then stop, confirm, step B—not one mega prompt forever.",
    questionStyle:
      "Monster prompt lists auth+pixels+payments all at once. Pick phased chain that pauses.",
    avoidStem: "",
  },
  {
    lesson: "ship_safely",
    mustTeach:
      "Dangerous snippets (SQL/live config) deserve dry-run, review mate, rollback plan—not copy-paste RUN.",
    questionStyle:
      "Assistant prints migration touching money table four human stances safest vs reckless.",
    avoidStem: "",
  },
];

export const QUIZ_LESSON_SEQUENCE = ROUND_BLUEPRINTS.map((b) => b.lesson);

const QUIZ_FALLBACK_BANK = [
  {
    lesson: "narrow_scope_files",
    prompt:
      'Someone wrote in Slack: "Please dig through every folder and refactor all auth tonight." What is the smartest reply?',
    choices: [
      "@src/auth/session.ts — after login twice fast the session clears. Guess why? Suggest tiny fix and one test.",
      "Refactor auth across the entire repo tonight.",
      "Just fix login.",
      "Change whatever you think is broken.",
    ],
    correctChoiceIndex: 0,
    explainCorrect:
      "Pointing to one path + one bug beats saying fix everything—you keep the job small and safer.",
  },
  {
    lesson: "role_plus_context",
    prompt:
      "You want a small new feature: export the current table to CSV from a React page. Which prompt to the AI coding tool is most useful first?",
    choices: [
      "Act genius. Surprise me.",
      "Stack: React + TypeScript. File src/reports/usage-table.tsx. Goal: add Export CSV button using current table state only no new npm packages. Please return a small diff idea plus one test note for empty rows.",
      "You know apps—build hype.",
      "Act fancy and brainstorm forever.",
    ],
    correctChoiceIndex: 1,
    explainCorrect:
      "Giving stack file path bounded goal deps rule helps the coding model ship a tight diff—not empty swagger.",
  },
  {
    lesson: "explicit_goal_format",
    prompt:
      "You need release notes from yesterday's git commits for the team. Pick the instruction that fits an AI coding assistant best.",
    choices: [
      "Summarize it.",
      "Commits on branch feature/billing since yesterday. Max seven bullets each with title risk one user line PR link if visible calm tone stop after seven.",
      "Analyze forever until perfect.",
      "Make it insightful please.",
    ],
    correctChoiceIndex: 1,
    explainCorrect:
      "Clear cap, what to include (PR links risk), and stop rule beats mushy summarize—great for turning git work into notes.",
  },
  {
    lesson: "context_scope",
    prompt:
      "Old React codebase is scary big. Which message is smartest for Cursor first?",
    choices: [
      "Rewrite every JSX file tonight.",
      "Open src/checkout/CheckoutForm.tsx only explain why checkout feels slow propose two small refactor paths—stop before unrelated files.",
      "Modernize repo.",
      "Touch all components.",
    ],
    correctChoiceIndex: 1,
    explainCorrect:
      "Shrink scope to one file + planned steps—you can review patches without drowning.",
  },
  {
    lesson: "output_schema",
    prompt:
      "You need alerts as JSON keys title summary severity with low/med/high only. Pick the clearest prompt.",
    choices: [
      "JSON please.",
      "JSON only keys title summary severity enums low/med/high Sample {\"title\":\"x\",\"summary\":\"y\",\"severity\":\"med\"}",
      "Nice neat JSON vibes.",
      "Give structured output.",
    ],
    correctChoiceIndex: 1,
    explainCorrect:
      "Repeating keys + allowed values + miniature sample stops broken JSON.",
  },
  {
    lesson: "smart_constraints",
    prompt:
      "Brainstorm signup page headings. Which setup gives the nicest guardrails?",
    choices: [
      "Be endlessly creative wow me.",
      "Max seven words each line confident tone forbid hype words like revolutionary give six grouped by cautious reader vs cheerful reader.",
      "Marketing legend mode unlocked.",
      "Just catchy lines thanks.",
    ],
    correctChoiceIndex: 1,
    explainCorrect:
      "Even creative chores need counts tone caps and forbidden hype words.",
  },
  {
    lesson: "vague_instructions",
    prompt:
      "Which line is weakest if you truly want repeatable help?",
    choices: [
      "Patch backend/routes/login.ts—test failing line 54 explain race propose fix respecting API docs.",
      "Change this.",
      "Paste stack trace XYZ suggest patch plus test scaffold.",
      "UI bug in Signup.tsx when email empty outline fix.",
    ],
    correctChoiceIndex: 1,
    explainCorrect:
      "Fix this skips file symptom and done metric—everything else names at least something concrete.",
  },
  {
    lesson: "iterative_refinement",
    prompt:
      "Returned JSX is huge and clumsy What should you ask next?",
    choices: [
      "Try harder be concise!",
      "Mark PASS/FAIL for readability bundlesize accessibility quote lines that fail each propose smallest patch extracting checkout hook sketch.",
      "Rewrite everything spontaneously.",
      "Paste same prompt louder.",
    ],
    correctChoiceIndex: 1,
    explainCorrect:
      "Iterate with checks quotes and micro patch—not empty shout louder.",
  },
  {
    lesson: "few_shot",
    prompt:
      "You want tighter bug titles. Which block honestly teaches copying a pattern?",
    choices: [
      "Long rant why bugs ruin lives.",
      "INPUT messy title OUTPUT clean title EXAMPLES INPUT broken login OUTPUT Login cookie drops when clock skew repeats twice",
      '"Example heading" spam with zero pairs.',
      "Link backlog no samples.",
    ],
    correctChoiceIndex: 1,
    explainCorrect:
      "Adjacent mini input output pairs anchor the vibe you want echoed.",
  },
  {
    lesson: "grounding_evidence",
    prompt:
      "Question is can we save scans under newest policy—which prompt is fairest?",
    choices: [
      "Answer from gut knowledge.",
      "Paste policy sections bullets A B then answer using only pasted lines say unknown if absent.",
      "Guess legal vibes.",
      "Internet search magically.",
    ],
    correctChoiceIndex: 1,
    explainCorrect:
      "Glue answers to pasted lines so the model cites not invents risky facts.",
  },
  {
    lesson: "scope_control",
    prompt:
      "One giant prompt screams fix auth dashboards CSS pricing today best fix?",
    choices: [
      "Do all at once ASAP.",
      "Chain Step1 logs snippet diagnose auth STOP Step2 tweaks only after you confirm hypothesis.",
      "WRITE PLEASE TEN TIMES IN CAPS.",
      "Stuff everything until tokens die.",
    ],
    correctChoiceIndex: 1,
    explainCorrect:
      "Staging with pause beats soup that nobody can safely ship.",
  },
  {
    lesson: "ship_safely",
    prompt:
      "Model prints SQL rewriting live orders table what reply is safest?",
    choices: [
      "Paste into prod tonight trust vibes.",
      "Dry run on scrubbed copy lint diff peer review rollback script ready before outage window.",
      "Skip checks speed counts.",
      "Trust confident tone emoji.",
    ],
    correctChoiceIndex: 1,
    explainCorrect:
      "Treat generated SQL like a junior PR preview peer review rollback first.",
  },
];

function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function clampScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function sanitizeChoices(raw) {
  if (!Array.isArray(raw)) return null;
  const cleaned = raw.map((c) => String(c || "").trim()).filter(Boolean);
  if (cleaned.length !== 4) return null;
  return cleaned;
}

/**
 * Randomize A–D order. Models often return correctIndex 0 even when told otherwise.
 */
export function shuffleQuizChallengeChoices(challenge) {
  if (!challenge || !Array.isArray(challenge.choices) || challenge.choices.length !== 4) {
    return challenge;
  }
  let correct = Number(challenge.correctChoiceIndex);
  if (!Number.isInteger(correct) || correct < 0 || correct > 3) correct = 0;

  const tagged = challenge.choices.map((text, idx) => ({
    text: String(text ?? ""),
    isCorrect: idx === correct,
  }));
  for (let i = tagged.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = tagged[i];
    tagged[i] = tagged[j];
    tagged[j] = tmp;
  }
  const newCorrect = tagged.findIndex((t) => t.isCorrect);
  return {
    ...challenge,
    choices: tagged.map((t) => t.text),
    correctChoiceIndex: newCorrect,
  };
}

/** Reject cliché openings the model falls back on */
function isBannedStem(question) {
  const q = String(question || "").trim();
  const low = q.toLowerCase();
  if (!q || low.length < 36) return true;

  const bannedSnippets = [
    "which of the following best demonstrates",
    "which of the following best shows",
    "which of the following best illustrates",
    "select the option that best demonstrates",
    "select the best answer that demonstrates",
    "pick the prompt that clearly states",
    "which prompt is clearly better written",
    "which of these is clearly",
  ];
  if (bannedSnippets.some((b) => low.includes(b))) return true;

  const words = low.split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words);
  const repeated = words.some((w) => w.length > 4 && words.filter((x) => x === w).length > 10);
  if (repeated) return true;
  const diversity = uniqueWords.size / Math.max(words.length, 1);
  if (words.length > 55 && diversity < 0.32) return true;

  return false;
}

/** Simple overlap rejection vs prior prompts in-session */
function overlapsPriorStem(question, priorStems) {
  const qNorm = question.toLowerCase().replace(/\s+/g, " ").slice(0, 120);
  for (const p of priorStems) {
    const pNorm = String(p).toLowerCase().replace(/\s+/g, " ").slice(0, 120);
    const minLen = Math.min(qNorm.length, pNorm.length);
    if (minLen < 56) continue;
    let same = 0;
    const len = minLen;
    for (let i = 0; i < len; i += 1) {
      if (qNorm[i] === pNorm[i]) same += 1;
    }
    if (same / len > 0.88) return true;
  }
  return false;
}

export function normalizeQuizChallengeShape(round, obj) {
  const blueprint = ROUND_BLUEPRINTS[Math.min(round - 1, ROUND_BLUEPRINTS.length - 1)];
  const lessonDefault = blueprint?.lesson || "basics";
  const lessonRaw = typeof obj.lesson === "string" ? obj.lesson.trim() : "";
  const lesson = lessonRaw || lessonDefault;

  const prompt = typeof obj.prompt === "string" || typeof obj.question === "string"
    ? String(obj.prompt || obj.question).trim().slice(0, 920)
    : "";

  const choices = sanitizeChoices(obj.choices);
  let correctChoiceIndex = Number(obj.correctIndex ?? obj.correctChoiceIndex ?? 0);
  if (!Number.isInteger(correctChoiceIndex) || correctChoiceIndex < 0 || correctChoiceIndex > 3) correctChoiceIndex = 0;

  let explainCorrect =
    typeof obj.explainCorrect === "string" ? obj.explainCorrect.trim().slice(0, 650) : "";
  if (!explainCorrect && typeof obj.explanation === "string") {
    explainCorrect = obj.explanation.trim().slice(0, 650);
  }

  if (!prompt || !choices || !explainCorrect) return null;
  if (isBannedStem(prompt)) return null;

  return {
    round,
    category: lesson,
    lesson,
    prompt,
    choices,
    correctChoiceIndex,
    explainCorrect,
    startedAt: new Date(),
    endedAt: null,
    submissions: [],
  };
}

export function buildFallbackQuizChallenge(round) {
  const base = QUIZ_FALLBACK_BANK[(round - 1) % QUIZ_FALLBACK_BANK.length];
  const blueprint = ROUND_BLUEPRINTS[Math.min(round - 1, ROUND_BLUEPRINTS.length - 1)];
  const merged = {
    ...base,
    lesson: base.lesson || blueprint.lesson,
  };
  const normalized = normalizeQuizChallengeShape(round, {
    lesson: merged.lesson,
    question: merged.prompt,
    choices: merged.choices,
    correctIndex: merged.correctChoiceIndex,
    explainCorrect: merged.explainCorrect,
  });
  if (normalized) return normalized;

  /* Last resort bypass stem filter for legacy bank lines */
  return {
    round,
    category: merged.lesson,
    lesson: merged.lesson,
    prompt: merged.prompt,
    choices: [...merged.choices],
    correctChoiceIndex: merged.correctChoiceIndex,
    explainCorrect: merged.explainCorrect,
    startedAt: new Date(),
    endedAt: null,
    submissions: [],
  };
}

function priorQuestionStems(previousChallenges = []) {
  return previousChallenges
    .slice(-12)
    .map((c) => c.prompt)
    .filter(Boolean);
}

async function fetchOpenAiQuizPayload(round, blueprint, progressPct, priorStems, retryExtra = "", opts = {}) {
  const { solo = false } = opts;
  const avoidLine = priorStems.length
    ? `Prior stems this game (YOU MUST DIFFER radically in topic + voice + punctuation + POV—not just synonym swap):\n${priorStems.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n`
    : "";

  const blueprintBlock = `
ROUND ${round} BLUEPRINT — follow closely:
lesson tag (verbatim JSON "lesson"): "${blueprint.lesson}"
Must-teach concepts: ${blueprint.mustTeach}
Mandatory question STYLE: ${blueprint.questionStyle}
Additional anti-pattern for stems: ${blueprint.avoidStem || "(none)"}
`;

  const simpleEnglishBlock = `
LANGUAGE (mandatory):
• Write in very simple English: short sentences and common words. Readable for teens and ESL learners.
• Avoid rare or fancy words (examples to avoid: mitigation, seductive, pedagogical, rubric, vignette, blast radius, leverage, holistic).
• Stem: at most 2 short sentences. Each option: max ~180 characters; one or two short sentences.
• "explainCorrect" in JSON: 1–2 friendly sentences, same simple English—teach why the best option works.
${solo ? `• SOLO PRACTICE MODE: warm, encouraging wording only—no mocking wrong answers.\n` : ""}`;

  const codingScenarioBlock = `
CODING SCENARIO (mandatory):
• Situation = real software work only: new feature, bugfix, small refactor, prompt to ChatGPT/Cursor/Copilot, pasted error, concrete file paths, tests, API JSON shape, safe DB edits, etc.
• Use second person ("you"). Do NOT invent coworker names (no Jamie, Alex, Sarah, Chris, Taylor, Morgan, Casey).
• Four choices must read like real prompts you'd send an AI coding tool—not gossip-style chat fiction.

`;

  const userContent = `
You author ONE original multiple-choice quiz item for PROMPT ENGINEERING tutors.

Audience: developers using ChatGPT, Cursor, Copilot, etc.
Progress: lesson ${round} of 12.
${codingScenarioBlock}${blueprintBlock}
${simpleEnglishBlock}
${avoidLine}
Hard bans:
• Question stem CANNOT contain: "Which of the following best demonstrates/selects/shows/illustrates" or begin with bare "Which of the following".
• Each option MUST be ≤ 220 chars, clearly different styles (scoped coding prompt vs vague greedy prompt vs junk).
• One strongest coding prompt for THIS situation; three tempting bad prompts tied to THE SAME codebase story.

CORRECT POSITION:
• "correctIndex" must equal the slot 0–3 that holds the best choice—not always zero. Servers shuffle visually; authoring varied slots fights model laziness.

${retryExtra}

Return VALID JSON only (numbers are numbers—correctIndex integer 0..3 pointing at the strongest choice slot; example shown uses 2 as illustration only—pick truly best index):
{"lesson":"${blueprint.lesson}","question":"…","choices":["…","…","…","…"],"correctIndex":2,"explainCorrect":"…"}
`;

  const response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You write short MCQs about prompts developers send to AI coding helpers (ChatGPT, Cursor, Copilot).
Rules:
• Every stem plus four choices must be REAL coding tasks: bugs, tiny features, refactors, pasted errors + file paths, JSON outputs, safer SQL/scripts, tests—not office gossip vignettes or random character drama.
• Use second-person YOU only. Absolutely no fake teammate names such as Jamie, Alex, Sarah, Chris, Morgan, Casey, Taylor.
• Very simple English in stem, choices, explainCorrect. JSON object only.`,
        },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      temperature: retryExtra ? 0.93 : 0.82,
      max_tokens: 650,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  let raw = response?.data?.choices?.[0]?.message?.content?.trim() || "";
  raw = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(raw);
}

export function priorChallengesFromPromptStems(stems) {
  if (!Array.isArray(stems)) return [];
  return stems
    .filter((s) => typeof s === "string" && s.trim())
    .slice(-12)
    .map((prompt) => ({ prompt: prompt.trim() }));
}

export async function buildQuizChallengeForRound(round, previousChallenges = [], opts = {}) {
  const { solo = false } = opts || {};
  const fallback = () => buildFallbackQuizChallenge(round);
  const blueprint = ROUND_BLUEPRINTS[Math.min(round - 1, ROUND_BLUEPRINTS.length - 1)];

  if (!process.env.OPENAI_API_KEY) {
    return shuffleQuizChallengeChoices(fallback());
  }

  const progressPct = Math.round(((round - 1) / Math.max(TOTAL_ROUNDS - 1, 1)) * 100);
  const avoid = priorQuestionStems(previousChallenges);

  try {
    let parsed = await fetchOpenAiQuizPayload(round, blueprint, progressPct, avoid, "", { solo });
    let normalized = normalizeQuizChallengeShape(round, parsed);

    if (!normalized || overlapsPriorStem(normalized.prompt, avoid)) {
      parsed = await fetchOpenAiQuizPayload(
        round,
        blueprint,
        progressPct,
        avoid,
        "FIRST DRAFT REJECTED: too generic or similar. Invent ANOTHER coding scenario—new bug, feature, file path, or API task—simple English, no fake teammate names.",
        { solo }
      );
      normalized = normalizeQuizChallengeShape(round, parsed);
    }

    return shuffleQuizChallengeChoices(normalized || fallback());
  } catch (error) {
    console.error("OpenAI quiz generation failed:", error.message);
    return shuffleQuizChallengeChoices(fallback());
  }
}

export function scoreQuizSubmission({ choiceIndex, correctChoiceIndex, explainCorrect: _explain }) {
  const chosen = Number(choiceIndex);
  const correct = Number(correctChoiceIndex);
  const inRange = Number.isFinite(chosen) && chosen >= 0 && chosen <= 3;

  if (!inRange) {
    const letter =
      Number.isFinite(correct) && correct >= 0 && correct <= 3 ? String.fromCharCode(65 + correct) : "?";
    return {
      baseScore: 0,
      clarity: 0,
      creativity: 0,
      effectiveness: 0,
      feedback: `No answer in time — the best choice was (${letter}).`,
    };
  }

  const isCorrect = chosen === correct;

  const baseScore = isCorrect ? 92 : 44;
  const clarity = clampScore(isCorrect ? 93 : 46);
  const creativity = clampScore(isCorrect ? 88 : 50);
  const effectiveness = clampScore(isCorrect ? 95 : 42);

  const feedback = isCorrect
    ? "Correct — good instinct for clear prompts."
    : "Not quite — the recap shows the strongest option.";

  return {
    baseScore,
    clarity,
    creativity,
    effectiveness,
    feedback,
  };
}

export {
  ROOM_STATES,
  ROUND_BLUEPRINTS,
  ROUND_DURATION_MS,
  TOTAL_ROUNDS,
  MIN_PLAYERS_TO_START,
  MAX_PLAYERS_PER_ROOM,
  ROUND_END_PAUSE_MS,
};
