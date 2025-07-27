import axios from "axios";
import Prompt from "../models/Prompt.js";

export const analyzePrompt = async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a world-class Prompt Engineering Coach who helps users write powerful prompts for LLMs like GPT-4.

Your task is:
- Understand the user's goal or intent.
- Evaluate the prompt and rate it on:
  - Clarity (1–10)
  - Specificity (1–10)
  - Usefulness (1–10)

Then suggest 3 better versions using prompt engineering techniques:
- Giving the AI a role or persona
- Using context, examples, or constraints
- Structuring multi-part prompts

Also give 2 tips on how the user can improve their prompt.

Only respond in valid JSON:
{
  "Clarity": number,
  "Specificity": number,
  "Usefulness": number,
  "suggested_prompts": ["...", "...", "..."],
  "tips": ["...", "..."]
}

⚠️ Do not explain anything.
⚠️ Do not wrap in code blocks.
⚠️ Your only output should be the pure JSON result.`
          },
          {
            role: "user",
            content: `Here is the prompt to evaluate and improve: "${prompt}"`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let gptReply = response.data.choices[0].message.content.trim();

    if (gptReply.startsWith("```")) {
      gptReply = gptReply.replace(/```json|```/g, "").trim();
    }

    let feedback;
    try {
      feedback = JSON.parse(gptReply);
    } catch (err) {
      console.error("❌ Invalid JSON from GPT:", gptReply);
      return res.status(500).json({ error: "GPT response was not valid JSON." });
    }

    // ✅ Add score
    const score = ((feedback.Clarity + feedback.Specificity + feedback.Usefulness) / 3).toFixed(1);

    const fullFeedback = {
      Clarity: feedback.Clarity,
      Specificity: feedback.Specificity,
      Usefulness: feedback.Usefulness,
      score: parseFloat(score),
      suggested_prompts: feedback.suggested_prompts,
      tips: feedback.tips,
    };

    const saved = await Prompt.create({
      user: req.user._id,
      prompt,
      feedback: fullFeedback,
    });

    res.json(saved);
  } catch (err) {
    console.log("❌ API/DB Error:", err.message);
    res.status(500).json({ error: "Failed to analyze prompt" });
  }
};

export const getPromptHistory = async (req, res) => {
  const history = await Prompt.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(history);
};
// Delete a prompt by ID
export const deletePrompt = async (req, res) => {
  const { id } = req.body;
  try {
    const prompt = await Prompt.findOneAndDelete({ _id: id, user: req.user._id });
    if (!prompt) return res.status(404).json({ error: "Prompt not found" });
    res.json({ message: "Prompt deleted" });
  } catch (err) {
    console.error("❌ Delete error:", err.message);
    res.status(500).json({ error: "Server error while deleting prompt" });
  }
};
export const getPromptById = async (req, res) => {
  try {
    const prompt = await Prompt.findById(req.params.id);
    if (!prompt) return res.status(404).json({ message: 'Prompt not found' });
    res.json(prompt);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
export const savePromptToLibrary = async (req, res) => {
  const { id } = req.body;
  const prompt = await Prompt.findById(id);
  if (!prompt) return res.status(404).json({ message: 'Prompt not found' });

  prompt.saved = true;
  await prompt.save();
  res.json({ message: "Prompt saved." });
};
export const improvePrompt = async (req, res) => {
  const { prompt, tips } = req.body;

  const improvedPrompt = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{
      role: "user",
      content: `Rewrite the following prompt to improve it based on these tips:\nPrompt: "${prompt}"\nTips: ${tips.join(", ")}`
    }]
  });

  res.json({ improved: improvedPrompt.choices[0].message.content });
}
