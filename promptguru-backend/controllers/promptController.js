import axios from "axios"; // still fine to keep for future use
import Prompt from "../models/Prompt.js";

export const analyzePrompt = async (req, res) => {
  const { prompt } = req.body;

  try {
    // FAKE FEEDBACK (Used for development / testing without OpenAI)
    const fakeFeedback = {
      Clarity: "⭐⭐⭐",
      Specificity: "⭐⭐",
      Usefulness: "⭐⭐⭐",
      Suggestion: "Write a 100-word blog post explaining AI in education.",
      Tip: "Try being more specific with your topic and tone."
    };

    // Save prompt + fake feedback in DB
    const saved = await Prompt.create({
      user: req.user._id,
      prompt,
      feedback: fakeFeedback
    });

    // Return saved data to frontend
    res.json(saved);

  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Failed to analyze prompt" });
  }
};

/* 
// Original GPT API logic — keep it here for later use when you have API key

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
            content:
              "You are a prompt coach. Give feedback on Clarity, Specificity, Usefulness, and suggest a better version. Respond in JSON format."
          },
          {
            role: "user",
            content: `Analyze: "${prompt}"`
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

    const gptReply = response.data.choices[0].message.content;

    const saved = await Prompt.create({
      user: req.user._id,
      prompt,
      feedback: JSON.parse(gptReply)
    });

    res.json(saved);

  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: "Failed to analyze prompt" });
  }
};
*/

export const getPromptHistory = async (req, res) => {
  const history = await Prompt.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(history);
};
