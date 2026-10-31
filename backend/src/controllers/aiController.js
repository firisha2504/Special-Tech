import prisma from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { aiChatSchema } from '../validators/schemas.js';
import { generateAIResponse, generateProjectSpecification } from '../services/ai/aiService.js';
import { MessageSender } from '@prisma/client';

export const startConversation = async (req, res, next) => {
  try {
    const { sessionToken, customerEmail } = req.body;
    const token = sessionToken || `sess_${uuidv4().replace(/-/g, '').slice(0, 16)}`;

    let customer = null;
    if (customerEmail) {
      customer = await prisma.customer.findUnique({ where: { email: customerEmail } });
    }

    let conversation = await prisma.conversation.findUnique({
      where: { sessionToken: token },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        requirements: { orderBy: { version: 'desc' }, take: 1 },
        prototypes: { include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } } },
      },
    });

    if (!conversation) {
      try {
        conversation = await prisma.conversation.create({
          data: {
            sessionToken: token,
            customerId: customer?.id || null,
            title: 'New AI Project Discovery',
          },
          include: {
            messages: true,
            requirements: true,
            prototypes: true,
          },
        });

        // Seed initial welcome message
        const welcome = await prisma.message.create({
          data: {
            conversationId: conversation.id,
            sender: MessageSender.ASSISTANT,
            content: `Hello! Welcome to Special Tech.\n\nHave an idea for a website, mobile app, or business management system?\n\nDon't worry if you don't know the technical details. Tell me what problem you want to solve, and I'll help you turn your idea into a clear software solution.`,
          },
        });

        conversation.messages = [welcome];
      } catch (raceErr) {
        if (raceErr.code === 'P2002') {
          conversation = await prisma.conversation.findUnique({
            where: { sessionToken: token },
            include: {
              messages: { orderBy: { createdAt: 'asc' } },
              requirements: { orderBy: { version: 'desc' }, take: 1 },
              prototypes: { include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } } },
            },
          });
        } else {
          throw raceErr;
        }
      }
    }

    res.json({
      success: true,
      sessionToken: token,
      conversationId: conversation.id,
      conversation,
    });
  } catch (err) {
    next(err);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, sessionToken, message } = aiChatSchema.parse(req.body);

    let conversation = null;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
    } else if (sessionToken) {
      conversation = await prisma.conversation.findUnique({
        where: { sessionToken },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
    }

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation session not found' });
    }

    // 1. Save Customer's Message
    const userMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: MessageSender.USER,
        content: message,
      },
    });

    conversation.messages.push(userMessage);

    // 2. Generate AI Response via Business Analyst Engine
    const aiText = await generateAIResponse(conversation, message);

    // 3. Save AI's Response
    const aiMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: MessageSender.ASSISTANT,
        content: aiText,
      },
    });

    // Update conversation title if default
    if (conversation.title === 'New AI Project Discovery' && conversation.messages.length >= 2) {
      const summaryTitle = message.slice(0, 38).trim() + (message.length > 38 ? '...' : '');
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { title: summaryTitle },
      });
    }

    res.json({
      success: true,
      userMessage,
      aiMessage,
    });
  } catch (err) {
    next(err);
  }
};

export const getConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        requirements: { orderBy: { version: 'desc' }, take: 1 },
        prototypes: {
          include: {
            versions: { orderBy: { versionNumber: 'desc' } },
          },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    res.json({ success: true, data: conversation });
  } catch (err) {
    next(err);
  }
};

export const generateSpecification = async (req, res, next) => {
  try {
    const { conversationId } = req.body;
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: true },
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const requirement = await generateProjectSpecification(conversation);

    res.json({
      success: true,
      message: 'Project specification generated successfully',
      data: requirement,
    });
  } catch (err) {
    next(err);
  }
};

export const updateSpecification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const requirement = await prisma.requirement.update({
      where: { id },
      data: {
        ...updateData,
        version: { increment: 1 },
      },
    });

    res.json({
      success: true,
      message: 'Specification updated successfully',
      data: requirement,
    });
  } catch (err) {
    next(err);
  }
};
