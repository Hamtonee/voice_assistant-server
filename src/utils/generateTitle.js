// src/utils/generateTitle.js

import { generateChatTitle, renameChat } from '../api';

/**
 * Generate and persist a concise 3–5 word title for any session.
 *
 * @param {'chat'|'sema'|'tusome'} feature
 * @param {string?} scenarioLabel    Optional label for role-play scenarios
 * @param {string|number} chatId     ID of the session to update
 * @param {string[]} messages        Array of user messages (length 2 for chat/sema, 1 for tusome)
 * @returns {Promise<string>}        The generated title
 * @throws {Error}                   On network or server errors
 */
export async function generateTitleForChat(feature, scenarioLabel, chatId, messages) {
  // Validate
  if (
    feature === 'tusome'
      ? !Array.isArray(messages) || messages.length < 1
      : !Array.isArray(messages) || messages.length < 2
  ) {
    throw new Error(
      feature === 'tusome'
        ? 'Need at least one message to generate a title for Tusome.'
        : 'Need at least two user messages to generate a title for Chat/Sema.'
    );
  }

  // 1. Ask the backend to generate a title
  const genResp = await generateChatTitle({
    feature,
    scenarioLabel,
    messages
  });

  if (genResp.status !== 200) {
    throw new Error(`Title generation failed: ${genResp.statusText}`);
  }

  const title = genResp.data.title?.trim() || 'Untitled Session';

  // 2. Persist the new title
  const saveResp = await renameChat(chatId, title);
  if (saveResp.status !== 200) {
    throw new Error(`Persisting title failed: ${saveResp.statusText}`);
  }

  return title;
}

export default generateTitleForChat;
