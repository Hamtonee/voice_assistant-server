// server/controllers/chatTitleController.js

import axios from 'axios';

// Configure DeepSeek HTTP client
const deepseekClient = axios.create({
  baseURL: process.env.DEEPSEEK_API_URL,    // e.g. 'https://api.deepseek.ai/v1'
  headers: {
    Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * POST /api/chats/chat-title
 * Body: {
 *   feature: 'chat' | 'tusome' | 'sema',
 *   scenarioKey?: string,
 *   scenarioLabel?: string,
 *   messages: string[]
 * }
 * Returns: { title: string }
 */
export const generateChatTitle = async (req, res) => {
  const { feature, scenarioLabel, messages } = req.body;

  // Validate input
  if (!Array.isArray(messages) ||
      (feature === 'chat' && messages.length < 2) ||
      (feature === 'tusome' && messages.length < 1)) {
    return res
      .status(400)
      .json({ error: 'Invalid payload: wrong number of messages for feature.' });
  }

  // Build feature-specific prompt
  let prompt;
  if (feature === 'tusome') {
    // Single-message (article) title generation
    const [article] = messages;
    prompt = `
Here is the reading passage:
"${article}"

Please provide a concise 3–5 word title summarizing this article.
    `.trim();
  } else {
    // 'chat' or 'sema' sessions — use first two user messages
    const [msg1, msg2] = messages;
    prompt = '';
    if (scenarioLabel) {
      prompt += `This is a "${scenarioLabel}" role-play scenario.\n`;
    }
    prompt += `
Here are the first two user messages:
1) "${msg1}"
2) "${msg2}"

Please provide a concise 3–5 word title summarizing this chat session.
    `.trim();
  }

  try {
    // Call DeepSeek's generation endpoint
    const response = await deepseekClient.post('/generate', {
      prompt,
      max_tokens: 10,
      temperature: 0.7,
    });

    // Extract generated text
    const raw =
      response.data.choices?.[0]?.text ??
      response.data.text ??
      '';
    const title = raw.trim() || 'Untitled Session';

    return res.json({ title });
  } catch (error) {
    console.error('DeepSeek title generation error:', error);
    return res
      .status(500)
      .json({ error: 'Failed to generate title.' });
  }
};
