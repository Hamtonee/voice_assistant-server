// server/controllers/chatController.js

import prisma from '../config/prisma.js';
import { normalizeChat, normalizeChats } from '../utils/apiResponseNormalizer.js';

// ✅ List all chats for the current user
export const listChats = async (req, res) => {
  try {
    const { feature } = req.query;
    
    // Build where clause
    const whereClause = { owner_id: req.user.id };
    
    // 🔧 FIX: Add feature filtering if specified
    if (feature) {
      whereClause.feature = feature;
      console.log(`🔧 Filtering chats by feature: ${feature}`);
    }
    
    const chats = await prisma.chat.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      include: { messages: true },
    });
    
    if (feature) {
      console.log(`✅ Found ${chats.length} chats for user ${req.user.id} with feature '${feature}'`);
    } else {
      console.log(`✅ Found ${chats.length} chats for user ${req.user.id} (all features)`);
    }
    
    // Normalize response for frontend consistency
    const normalizedChats = normalizeChats(chats);
    res.json(normalizedChats);
  } catch (err) {
    console.error('Error listing chats:', err);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
};

// ✅ Get a single chat
export const getChat = async (req, res) => {
  const id = Number(req.params.id);
  try {
    console.log('🔍 [chatController] getChat called for:', { id, userId: req.user.id });
    
    const chat = await prisma.chat.findFirst({
      where: { id, owner_id: req.user.id },
      include: { messages: true },
    });
    
    if (!chat) {
      console.log('❌ [chatController] Chat not found:', { id, userId: req.user.id });
      return res.status(404).json({ error: 'Not found' });
    }
    
    console.log('🔍 [chatController] Chat found:', {
      chatId: chat.id,
      messageCount: chat.messages?.length || 0,
      firstMessageMetadata: chat.messages?.[0]?.message_metadata,
      messagesWithMetadata: chat.messages?.filter(m => m.message_metadata)?.length || 0
    });
    
    // Normalize response for frontend consistency
    const normalizedChat = normalizeChat(chat);
    
    console.log('🔍 [chatController] Normalized chat response:', {
      chatId: normalizedChat.id,
      messageCount: normalizedChat.messages?.length || 0,
      firstMessageMetadata: normalizedChat.messages?.[0]?.messageMetadata,
      messagesWithMetadata: normalizedChat.messages?.filter(m => m.messageMetadata)?.length || 0
    });
    
    res.json(normalizedChat);
  } catch (err) {
    console.error('❌ [chatController] Error fetching chat:', err);
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
};

// ✅ Create a blank chat (manual typing or progressive input)
export const createChat = async (req, res) => {
  const { scenarioKey, feature = 'chat' } = req.body;
  try {
    const chat = await prisma.chat.create({
      data: {
        owner_id: req.user.id,
        feature: feature,
        scenario_key: scenarioKey ?? null,
      },
    });

    await prisma.event.create({
      data: {
        user_id: req.user.id,
        type: 'CHAT_CREATED',
        description: `Chat ${chat.id} created`,
      },
    });

    // Normalize response for frontend consistency
    const normalizedChat = normalizeChat(chat);
    res.status(201).json(normalizedChat);
  } catch (err) {
    console.error('Error creating chat:', err);
    res.status(500).json({ error: 'Failed to create chat' });
  }
};

// ✅ Create a scenario-based chat (includes title & system prompt)
export const createScenarioChat = async (req, res) => {
  const { scenarioKey, title, prompt } = req.body;
  try {
    const chat = await prisma.chat.create({
      data: {
        owner_id: req.user.id,
        feature: 'chat',
        scenario_key: scenarioKey,
        title,
        messages: {
          create: { role: 'system', content: prompt },
        },
      },
      include: { messages: true },
    });

    await prisma.event.create({
      data: {
        user_id: req.user.id,
        type: 'CHAT_CREATED',
        description: `Scenario chat ${chat.id} created for ${scenarioKey}`,
      },
    });

    // Normalize response for frontend consistency
    const normalizedChat = normalizeChat(chat);
    res.status(201).json(normalizedChat);
  } catch (err) {
    console.error('Error creating scenario chat:', err);
    res.status(500).json({ error: 'Failed to create scenario chat' });
  }
};

// ✅ Create a feature-based session (sema or tusome)
export const createFeatureChat = async (req, res) => {
  const { feature, scenarioKey, title, prompt } = req.body;
  try {
    const chat = await prisma.chat.create({
      data: {
        owner_id: req.user.id,
        feature,
        title: title ?? '',
        scenario_key: scenarioKey ?? null,
        messages: prompt
          ? { create: { role: 'system', content: prompt } }
          : undefined,
      },
      include: { messages: true },
    });

    await prisma.event.create({
      data: {
        user_id: req.user.id,
        type: `${feature.toUpperCase()}_CHAT_CREATED`,
        description: `${feature} chat ${chat.id} created`,
      },
    });

    // Normalize response for frontend consistency
    const normalizedChat = normalizeChat(chat);
    res.status(201).json(normalizedChat);
  } catch (err) {
    console.error('Error creating feature chat:', err);
    res.status(500).json({ error: 'Failed to create feature chat' });
  }
};

// ✅ Add a message to a chat
export const addMessage = async (req, res) => {
  const chatId = Number(req.params.id);
  const { role, text, metadata } = req.body;

  console.log('🔍 [chatController] addMessage called with:', { 
    chatId, 
    role, 
    textLength: text?.length, 
    hasMetadata: !!metadata,
    metadataKeys: metadata ? Object.keys(metadata) : [],
    metadataValues: metadata,
    requestBody: req.body
  });

  try {
    // Validate required fields
    if (!text || !text.trim()) {
      console.log('❌ Validation failed: text is empty or missing');
      return res.status(400).json({ error: 'Message text cannot be empty' });
    }

    if (!role) {
      console.log('❌ Validation failed: role is missing');
      return res.status(400).json({ error: 'Message role is required' });
    }

    // Check if chat exists and belongs to user
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, owner_id: req.user.id }
    });

    if (!chat) {
      console.log('❌ Chat not found or not owned by user:', { chatId, userId: req.user.id });
      return res.status(404).json({ error: 'Chat not found' });
    }

    console.log('✅ Chat validation passed:', { chatId, chatTitle: chat.title });

    // Combine metadata with source info
    const messageMetadata = {
      source: 'api',
      ...(metadata || {})
    };

    console.log('🔍 [chatController] Message metadata to save:', {
      originalMetadata: metadata,
      combinedMetadata: messageMetadata,
      metadataKeys: Object.keys(messageMetadata),
      hasFeature: !!messageMetadata.feature,
      featureValue: messageMetadata.feature,
      hasType: !!messageMetadata.type,
      typeValue: messageMetadata.type
    });

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: { 
          chat_id: chatId, 
          role, 
          content: text,
          message_metadata: messageMetadata
        },
      });

      console.log('🔍 [chatController] Message created successfully:', { 
        messageId: msg.id, 
        chatId, 
        role,
        savedMetadata: msg.message_metadata,
        hasSavedMetadata: !!msg.message_metadata
      });

      await tx.event.create({
        data: {
          user_id: req.user.id,
          type: 'MESSAGE_ADDED',
          description: `Message ${msg.id} added to chat ${chatId}`,
        },
      });

      // Fetch the updated chat with messages in the same transaction
      const updated = await tx.chat.findUnique({
        where: { id: chatId },
        include: { messages: true },
      });

      return { msg, updated };
    });

    console.log('🔍 [chatController] Transaction completed, messages count:', result.updated.messages?.length || 0);

    // Normalize response for frontend consistency
    const normalizedChat = normalizeChat(result.updated);
    res.json(normalizedChat);
  } catch (err) {
    console.error('❌ Error adding message:', err);
    res.status(500).json({ error: 'Failed to add message' });
  }
};

// ✅ Update chat title
export const updateTitle = async (req, res) => {
  const id = Number(req.params.id);
  const { title } = req.body;

  try {
    const result = await prisma.chat.updateMany({
      where: { id, owner_id: req.user.id },
      data: { title },
    });

    if (result.count === 0)
      return res.status(404).json({ error: 'Not found' });

    await prisma.event.create({
      data: {
        user_id: req.user.id,
        type: 'CHAT_RENAMED',
        description: `Chat ${id} renamed to "${title}"`,
      },
    });

    const updated = await prisma.chat.findUnique({
      where: { id },
      include: { messages: true },
    });

    // Normalize response for frontend consistency
    const normalizedChat = normalizeChat(updated);
    res.json(normalizedChat);
  } catch (err) {
    console.error('Error renaming chat:', err);
    res.status(500).json({ error: 'Failed to update title' });
  }
};

// ✅ Delete a chat + messages
export const deleteChat = async (req, res) => {
  const id = Number(req.params.id);

  try {
    const existing = await prisma.chat.findUnique({
      where: { id },
      select: { owner_id: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    if (existing.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Delete chat and associated messages (cascade should handle this)
    await prisma.chat.delete({
      where: { id },
    });

    await prisma.event.create({
      data: {
        user_id: req.user.id,
        type: 'CHAT_DELETED',
        description: `Chat ${id} deleted`,
      },
    });

    res.json({ success: true, message: 'Chat deleted successfully' });
  } catch (err) {
    console.error('Error deleting chat:', err);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
};
