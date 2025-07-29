import axios from "axios";
import Prompt from "../models/Prompt.js";

// ✅ Analyze prompt and return structured feedback
const analyzePrompt = async (req, res) => {
  const { prompt } = req.body;

  try {
    if (!prompt || prompt.length > 130) {
      return res.status(400).json({ error: "Prompt must be 130 characters or fewer." });
    }

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const count = await Prompt.countDocuments({
      user: req.user._id,
      createdAt: { $gte: last24Hours },
    });

    if (count >= 10) {
      return res.status(429).json({ error: "Daily limit reached. Only 10 prompts allowed per day." });
    }

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

Only respond in valid, raw JSON format. The JSON object must follow this exact structure:
{
  "Clarity": number,
  "Specificity": number,
  "Usefulness": number,
  "suggested_prompts": ["...", "...", "..."],
  "tips": ["...", "..."]
}

⚠️ Do not explain anything.
⚠️ Do not wrap the JSON in code blocks like \`\`\`json.
⚠️ Ensure every key-value pair is separated by a comma.
⚠️ Your only output must be the pure JSON object.`
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

    // Clean up potential markdown formatting
    if (gptReply.startsWith("```")) {
      gptReply = gptReply.replace(/```json|```/g, "").trim();
    }

    let feedback;
    try {
      feedback = JSON.parse(gptReply);
    } catch (err) {
      console.error("❌ Invalid JSON from GPT (first attempt):", gptReply);
      try {
        // Attempt to fix the most common error: a missing comma between a `]` and a `"`
        const fixedJsonString = gptReply.replace(/\]\s*"/g, '],"');
        console.log("✅ Attempting to parse fixed JSON:", fixedJsonString);
        feedback = JSON.parse(fixedJsonString);
      } catch (finalErr) {
         console.error("❌ Failed to parse even after attempting a fix:", finalErr);
         return res.status(500).json({ error: "The AI response was not valid JSON and could not be automatically fixed." });
      }
    }

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

// ✅ Delete a prompt
const deletePrompt = async (req, res) => {
  try {
    const { id } = req.body;
    const deleted = await Prompt.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Prompt not found" });
    }

    res.status(200).json({ message: "Prompt deleted successfully" });
  } catch (err) {
    console.error("❌ Delete Error:", err.message);
    res.status(500).json({ error: "Failed to delete prompt" });
  }
};

// ✅ Get history of prompts
const getPromptHistory = async (req, res) => {
  try {
    const history = await Prompt.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json(history);
  } catch (err) {
    console.error("❌ History Fetch Error:", err.message);
    res.status(500).json({ error: "Failed to fetch history" });
  }
};

// ✅ Get a single prompt by ID
const getPromptById = async (req, res) => {
  try {
    const prompt = await Prompt.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!prompt) {
      return res.status(404).json({ error: "Prompt not found" });
    }

    res.json(prompt);
  } catch (err) {
    console.error("❌ Get Prompt Error:", err.message);
    res.status(500).json({ error: "Failed to fetch prompt" });
  }
};

// ✅ Future placeholder
const improvePrompt = (req, res) => res.send("improvePrompt - not implemented yet");
const savePromptToLibrary = (req, res) => res.send("savePromptToLibrary - not implemented yet");

// ✅ Export all at once (no duplicates!)
export {
  analyzePrompt,
  deletePrompt,
  getPromptHistory,
  getPromptById,
  improvePrompt,
  savePromptToLibrary
};
