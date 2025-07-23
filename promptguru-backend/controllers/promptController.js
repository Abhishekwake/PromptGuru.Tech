import axios from "axios"; // ✅ unchanged
import Prompt from "../models/Prompt.js"; // ✅ unchanged

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
            // 🔧 CHANGED: Stronger, more realistic scoring rules + tone match
   content: `You are a world-class Prompt Engineering Coach who helps users write powerful prompts for LLMs like GPT-4.

Your task is:
- Understand the user's goal or intent.
- Evaluate the prompt and rate it on:
  - Clarity (1–10)
  - Specificity (1–10)
  - Usefulness (1–10)

Then suggest a better version using prompt engineering techniques, including:
- Giving the AI a role or persona
- Using context, examples, or constraints
- Structuring multi-part prompts

Only respond in valid JSON:
{
  "Clarity": number,
  "Specificity": number,
  "Usefulness": number,
  "suggested_prompt": "..."
}

⚠️ Do not explain anything.
⚠️ Do not wrap in code blocks.
⚠️ Your only output should be the pure JSON result.


Your only output must be pure JSON.`
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

    // 🔧 ADDED: Clean GPT output if it comes with ```json or extra text
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

    const saved = await Prompt.create({
      user: req.user._id,
      prompt,
      feedback
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
