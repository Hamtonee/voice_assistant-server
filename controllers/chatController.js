// server/controllers/chatController.js

import prisma from '../config/prisma.js';

// ✅ List all chats for the current user
export const listChats = async (req, res) => {
  try {
    const chats = await prisma.chat.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: { messages: true },
    });
    res.json(chats);
  } catch (err) {
    console.error('Error listing chats:', err);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
};

// ✅ Get a single chat
export const getChat = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const chat = await prisma.chat.findFirst({
      where: { id, ownerId: req.user.id },
      include: { messages: true },
    });
    if (!chat) return res.status(404).json({ error: 'Not found' });
    res.json(chat);
  } catch (err) {
    console.error('Error fetching chat:', err);
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
};

// ✅ Create a blank chat (manual typing or progressive input)
export const createChat = async (req, res) => {
  const { scenarioKey } = req.body;
  try {
    const chat = await prisma.chat.create({
      data: {
        ownerId: req.user.id,
        feature: 'chat',
        scenarioKey: scenarioKey ?? null,
      },
    });

    await prisma.event.create({
      data: {
        userId: req.user.id,
        type: 'CHAT_CREATED',
        description: `Chat ${chat.id} created`,
      },
    });

    res.status(201).json(chat);
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
        ownerId: req.user.id,
        feature: 'chat',
        scenarioKey,
        title,
        messages: {
          create: { role: 'system', text: prompt },
        },
      },
      include: { messages: true },
    });

    await prisma.event.create({
      data: {
        userId: req.user.id,
        type: 'CHAT_CREATED',
        description: `Scenario chat ${chat.id} created for ${scenarioKey}`,
      },
    });

    res.status(201).json(chat);
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
        ownerId: req.user.id,
        feature,
        title: title ?? '',
        scenarioKey: scenarioKey ?? null,
        messages: prompt
          ? { create: { role: 'system', text: prompt } }
          : undefined,
      },
      include: { messages: true },
    });

    await prisma.event.create({
      data: {
        userId: req.user.id,
        type: `${feature.toUpperCase()}_CHAT_CREATED`,
        description: `${feature} chat ${chat.id} created`,
      },
    });

    res.status(201).json(chat);
  } catch (err) {
    console.error('Error creating feature chat:', err);
    res.status(500).json({ error: 'Failed to create feature chat' });
  }
};

// ✅ Add a message to a chat
export const addMessage = async (req, res) => {
  const chatId = Number(req.params.id);
  const { role, text } = req.body;

  try {
    const msg = await prisma.message.create({
      data: { chatId, role, text },
    });

    await prisma.event.create({
      data: {
        userId: req.user.id,
        type: 'MESSAGE_ADDED',
        description: `Message ${msg.id} added to chat ${chatId}`,
      },
    });

    const updated = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { messages: true },
    });

    res.json(updated);
  } catch (err) {
    console.error('Error adding message:', err);
    res.status(500).json({ error: 'Failed to add message' });
  }
};

// ✅ Update chat title
export const updateTitle = async (req, res) => {
  const id = Number(req.params.id);
  const { title } = req.body;

  try {
    const result = await prisma.chat.updateMany({
      where: { id, ownerId: req.user.id },
      data: { title },
    });

    if (result.count === 0)
      return res.status(404).json({ error: 'Not found' });

    await prisma.event.create({
      data: {
        userId: req.user.id,
        type: 'CHAT_RENAMED',
        description: `Chat ${id} renamed to "${title}"`,
      },
    });

    const updated = await prisma.chat.findUnique({
      where: { id },
      include: { messages: true },
    });

    res.json(updated);
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
      select: { ownerId: true },
    });

    if (!existing || existing.ownerId !== req.user.id)
      return res.status(404).json({ error: 'Not found' });

    // Manually delete messages (if cascade not enabled)
    await prisma.message.deleteMany({ where: { chatId: id } });

    // Delete the chat
    await prisma.chat.delete({ where: { id } });

    await prisma.event.create({
      data: {
        userId: req.user.id,
        type: 'CHAT_DELETED',
        description: `Chat ${id} deleted`,
      },
    });

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting chat:', err);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
};
