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
            content: `You are a helpful, casual-friendly prompt feedback coach.

You must return only valid JSON with 4 keys:
{
  "Clarity": 1-10, // How clearly the meaning is conveyed
  "Specificity": 1-10, // How specific the request is
  "Usefulness": 1-10, // How useful this prompt is in getting what the user wants
  "suggested_prompt": "One better version of the prompt, keeping the user's original tone (casual, technical, friendly, formal, etc.)"
}

✅ Don't assume intent that's not in the prompt  
✅ Don't formalize casual prompts unless clearly needed  
✅ Focus on what the user *meant*, even if their grammar is imperfect  
✅ Don't wrap output in backticks, code blocks, or explanation

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
