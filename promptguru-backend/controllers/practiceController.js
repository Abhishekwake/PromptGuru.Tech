import {
  TOTAL_ROUNDS,
  buildQuizChallengeForRound,
  priorChallengesFromPromptStems,
} from "./battleController.js";

/**
 * Solo practice challenge — same quiz engine as battle, no opponent.
 * Sends prior question stems so OpenAI can diversify prompts.
 */
export async function postSoloChallenge(req, res) {
  try {
    const rawRound =
      typeof req.body?.round === "number"
        ? req.body.round
        : parseInt(req.body?.round ?? "1", 10);

    const round = Math.min(
      TOTAL_ROUNDS,
      Math.max(1, Number.isFinite(rawRound) ? rawRound : 1)
    );

    const priorStems = Array.isArray(req.body?.priorStems) ? req.body.priorStems : [];

    const previousChallenges = priorChallengesFromPromptStems(priorStems.slice(-12));

    const challenge = await buildQuizChallengeForRound(round, previousChallenges, { solo: true });

    const payload = {
      round: challenge.round,
      totalRounds: TOTAL_ROUNDS,
      lesson: challenge.lesson,
      prompt: challenge.prompt,
      choices: challenge.choices || [],
      correctChoiceIndex: challenge.correctChoiceIndex,
      explainCorrect: challenge.explainCorrect,
      /** Client may ignore timing; unlimited pace in solo UI */
      durationMs: null,
    };

    return res.status(200).json(payload);
  } catch (err) {
    console.error("solo practice challenge:", err);
    return res.status(500).json({ message: "Could not load practice question." });
  }
}
