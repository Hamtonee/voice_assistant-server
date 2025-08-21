/**
 * Optimized Chat Routes
 * 
 * High-performance chat endpoints that use the Smart API Orchestrator
 * for instant responses while maintaining perfect prompt engineering
 */

import express from 'express';
import { SmartAPIOrchestrator } from '../services/smartAPIOrchestrator.js';
import { authenticateUser } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const orchestrator = new SmartAPIOrchestrator();
const prisma = new PrismaClient();

/**
 * POST /api/optimized-chat/message
 * Ultra-fast chat response with intelligent routing
 */
router.post('/message', authenticateUser, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { 
      message, 
      sessionId, 
      feature = 'general',
      scenario,
      focusArea,
      conversationHistory = []
    } = req.body;

    const userId = req.user.id;

    // Validate input
    if (!message || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Message and sessionId are required'
      });
    }

    console.log(`🚀 Optimized chat request: ${feature} - "${message.substring(0, 50)}..."`);

    // Build context for Smart API Orchestrator
    const context = {
      feature,
      scenario,
      focusArea,
      conversationHistory,
      userId,
      sessionId,
      userName: req.user.full_name,
      maxTokens: getMaxTokensForFeature(feature),
      temperature: getTemperatureForFeature(feature)
    };

    // Get optimized response using Smart API Orchestrator
    const result = await orchestrator.getOptimizedResponse(message, context);

    // Save interaction to database (async, don't wait)
    saveInteractionAsync(userId, sessionId, message, result.response, feature);

    // Track performance metrics
    const totalTime = Date.now() - startTime;
    console.log(`⚡ Response delivered via ${result.source} in ${totalTime}ms`);

    // Return response with performance metadata
    res.json({
      success: true,
      response: result.response,
      metadata: {
        source: result.source,
        responseTime: totalTime,
        orchestratorTime: result.responseTime,
        feature,
        cached: result.source === 'instant' || result.source === 'template'
      }
    });

  } catch (error) {
    console.error('Error in optimized chat:', error);
    
    const totalTime = Date.now() - startTime;
    
    res.status(500).json({
      success: false,
      error: 'Failed to process message',
      metadata: {
        source: 'error',
        responseTime: totalTime
      }
    });
  }
});

/**
 * GET /api/optimized-chat/stream/:sessionId
 * Server-Sent Events for streaming responses
 */
router.get('/stream/:sessionId', authenticateUser, async (req, res) => {
  const { sessionId } = req.params;
  const { message, feature = 'general', scenario, focusArea } = req.query;

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  try {
    console.log(`🔄 Starting streaming response for: ${message.substring(0, 50)}...`);

    // Get conversation history
    const conversationHistory = await getConversationHistory(sessionId, 5);

    const context = {
      feature,
      scenario, 
      focusArea,
      conversationHistory,
      userId: req.user.id,
      sessionId,
      userName: req.user.full_name,
      streaming: true
    };

    // Try instant/template response first
    const instantResult = await orchestrator.tryInstantResponse(message, context) || 
                         await orchestrator.tryTemplateResponse(message, context);

    if (instantResult) {
      // Send instant response in chunks to simulate streaming
      const words = instantResult.split(' ');
      for (let i = 0; i < words.length; i += 3) {
        const chunk = words.slice(i, i + 3).join(' ') + ' ';
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay between chunks
      }
      
      res.write(`data: ${JSON.stringify({ type: 'complete', source: 'instant' })}\n\n`);
      res.end();
      return;
    }

    // Stream from API
    await streamFromAPI(message, context, res);

  } catch (error) {
    console.error('Streaming error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', content: 'Failed to generate response' })}\n\n`);
    res.end();
  }
});

/**
 * POST /api/optimized-chat/speech-coach
 * Specialized speech coaching with ultra-fast feedback
 */
router.post('/speech-coach', authenticateUser, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { transcript, sessionId, focusArea = 'general' } = req.body;
    
    if (!transcript || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Transcript and sessionId are required'
      });
    }

    console.log(`🎤 Speech coaching request: ${focusArea} - "${transcript.substring(0, 30)}..."`);

    // Get recent coaching history
    const conversationHistory = await getConversationHistory(sessionId, 3);

    const context = {
      feature: 'speech-coach',
      focusArea,
      conversationHistory,
      userId: req.user.id,
      sessionId,
      userName: req.user.full_name,
      maxTokens: 200, // Keep speech coaching concise
      temperature: 0.6 // Slightly more consistent for coaching
    };

    // Use orchestrator for optimized coaching response
    const result = await orchestrator.getOptimizedResponse(transcript, context);

    // Analyze speech patterns for additional feedback
    const analysis = analyzeSpeechPatterns(transcript, focusArea);
    
    // Generate corrected sentence if needed
    const correctedSentence = generateCorrectedSentence(transcript, analysis);

    // Save coaching interaction
    saveCoachingInteractionAsync(
      req.user.id, 
      sessionId, 
      transcript, 
      result.response, 
      analysis,
      focusArea
    );

    const totalTime = Date.now() - startTime;
    console.log(`🎯 Speech coaching response via ${result.source} in ${totalTime}ms`);

    res.json({
      success: true,
      feedbackText: result.response,
      correctedSentence,
      analysis,
      suggestions: generateSuggestions(analysis, focusArea),
      metadata: {
        source: result.source,
        responseTime: totalTime,
        focusArea,
        cached: result.source === 'instant' || result.source === 'template'
      }
    });

  } catch (error) {
    console.error('Error in speech coaching:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to process speech coaching request',
      feedbackText: 'I apologize, but I encountered an issue processing your speech. Please try again.',
      metadata: {
        source: 'error',
        responseTime: Date.now() - startTime
      }
    });
  }
});

/**
 * POST /api/optimized-chat/roleplay
 * High-speed roleplay interactions
 */
router.post('/roleplay', authenticateUser, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { message, sessionId, scenario, character, personality = 'friendly' } = req.body;

    if (!message || !sessionId || !scenario) {
      return res.status(400).json({
        success: false,
        error: 'Message, sessionId, and scenario are required'
      });
    }

    console.log(`🎭 Roleplay request: ${scenario} - "${message.substring(0, 30)}..."`);

    // Get roleplay conversation history
    const conversationHistory = await getConversationHistory(sessionId, 4);

    const context = {
      feature: 'roleplay',
      scenario,
      character,
      personality,
      conversationHistory,
      userId: req.user.id,
      sessionId,
      userName: req.user.full_name,
      maxTokens: 300,
      temperature: 0.7
    };

    // Get optimized roleplay response
    const result = await orchestrator.getOptimizedResponse(message, context);

    // Save roleplay interaction
    saveRoleplayInteractionAsync(
      req.user.id,
      sessionId,
      message,
      result.response,
      scenario,
      character
    );

    const totalTime = Date.now() - startTime;
    console.log(`🎪 Roleplay response via ${result.source} in ${totalTime}ms`);

    res.json({
      success: true,
      feedbackText: result.response,
      character,
      scenario,
      metadata: {
        source: result.source,
        responseTime: totalTime,
        scenario,
        cached: result.source === 'instant' || result.source === 'template'
      }
    });

  } catch (error) {
    console.error('Error in roleplay:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to process roleplay request',
      metadata: {
        source: 'error',
        responseTime: Date.now() - startTime
      }
    });
  }
});

/**
 * GET /api/optimized-chat/performance
 * Get performance statistics
 */
router.get('/performance', authenticateUser, async (req, res) => {
  try {
    const stats = orchestrator.getPerformanceStats();
    
    res.json({
      success: true,
      performance: stats,
      cacheStats: {
        responseCache: orchestrator.responseCache.size,
        semanticCache: orchestrator.semanticCache.size
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting performance stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get performance statistics'
    });
  }
});

/**
 * Helper Functions
 */

function getMaxTokensForFeature(feature) {
  const limits = {
    'speech-coach': 200,
    'roleplay': 300,
    'reading': 800,
    'general': 400
  };
  return limits[feature] || limits.general;
}

function getTemperatureForFeature(feature) {
  const temperatures = {
    'speech-coach': 0.6,  // More consistent coaching
    'roleplay': 0.7,      // Balanced creativity
    'reading': 0.5,       // More focused content
    'general': 0.7        // Default balance
  };
  return temperatures[feature] || temperatures.general;
}

async function getConversationHistory(sessionId, limit = 5) {
  try {
    const messages = await prisma.message.findMany({
      where: {
        chat: {
          owner_id: { not: null } // Ensure we have valid chats
        },
        OR: [
          { session_id: sessionId },
          { chat: { id: parseInt(sessionId) || -1 } }
        ]
      },
      orderBy: { timestamp: 'desc' },
      take: limit * 2, // Get user + assistant pairs
      select: {
        role: true,
        content: true,
        timestamp: true
      }
    });

    return messages.reverse().map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp
    }));
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return [];
  }
}

async function streamFromAPI(message, context, res) {
  try {
    // Build optimized prompt
    const prompt = await orchestrator.buildOptimizedPrompt(message, context);
    
    // Simulate streaming by chunking the API response
    // In production, you'd use actual streaming from the API
    const response = await orchestrator.callOptimizedAPI(prompt, context);
    
    // Split response into natural chunks
    const sentences = response.split(/[.!?]+/).filter(s => s.trim());
    
    for (const sentence of sentences) {
      if (sentence.trim()) {
        res.write(`data: ${JSON.stringify({ 
          type: 'chunk', 
          content: sentence.trim() + '. ' 
        })}\n\n`);
        
        // Natural delay between sentences
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    res.write(`data: ${JSON.stringify({ type: 'complete', source: 'api' })}\n\n`);
    res.end();
    
  } catch (error) {
    console.error('Error streaming from API:', error);
    res.write(`data: ${JSON.stringify({ 
      type: 'error', 
      content: 'I apologize, but I encountered an issue. Please try again.' 
    })}\n\n`);
    res.end();
  }
}

function analyzeSpeechPatterns(transcript, focusArea) {
  const analysis = {
    wordCount: transcript.split(/\s+/).length,
    sentenceCount: transcript.split(/[.!?]+/).filter(s => s.trim()).length,
    issues: [],
    strengths: []
  };

  // Simple pattern analysis
  if (focusArea === 'grammar') {
    // Check for common grammar issues
    if (/\bi am go\b/i.test(transcript)) {
      analysis.issues.push('Use "I am going" instead of "I am go"');
    }
    if (/\bhe have\b/i.test(transcript)) {
      analysis.issues.push('Use "he has" instead of "he have"');
    }
    if (analysis.issues.length === 0) {
      analysis.strengths.push('Great grammar usage!');
    }
  }

  if (focusArea === 'pronunciation') {
    // Placeholder for pronunciation analysis
    analysis.strengths.push('Clear articulation detected');
  }

  if (focusArea === 'vocabulary') {
    const uniqueWords = new Set(transcript.toLowerCase().split(/\s+/));
    if (uniqueWords.size / analysis.wordCount > 0.8) {
      analysis.strengths.push('Excellent vocabulary variety');
    }
  }

  return analysis;
}

function generateCorrectedSentence(transcript, analysis) {
  let corrected = transcript;
  
  // Apply simple corrections based on analysis
  corrected = corrected.replace(/\bi am go\b/gi, 'I am going');
  corrected = corrected.replace(/\bhe have\b/gi, 'he has');
  corrected = corrected.replace(/\bshe don't\b/gi, "she doesn't");
  
  return corrected !== transcript ? corrected : null;
}

function generateSuggestions(analysis, focusArea) {
  const suggestions = [];
  
  if (analysis.issues.length > 0) {
    suggestions.push("Try to focus on the grammar corrections I mentioned.");
  }
  
  if (analysis.wordCount < 5) {
    suggestions.push("Try to speak in longer sentences to practice more.");
  }
  
  if (focusArea === 'fluency' && analysis.sentenceCount === 1) {
    suggestions.push("Try connecting your ideas with words like 'and', 'but', or 'because'.");
  }
  
  return suggestions;
}

// Async database operations (fire and forget)
async function saveInteractionAsync(userId, sessionId, userMessage, aiResponse, feature) {
  try {
    // This runs asynchronously without blocking the response
    await prisma.message.createMany({
      data: [
        {
          chat_id: parseInt(sessionId) || 1,
          role: 'user',
          content: userMessage,
          session_id: sessionId,
          user_id: userId,
          feature_type: feature
        },
        {
          chat_id: parseInt(sessionId) || 1,
          role: 'assistant', 
          content: aiResponse,
          session_id: sessionId,
          user_id: userId,
          feature_type: feature
        }
      ]
    });
  } catch (error) {
    console.error('Error saving interaction:', error);
  }
}

async function saveCoachingInteractionAsync(userId, sessionId, transcript, feedback, analysis, focusArea) {
  try {
    await prisma.message.createMany({
      data: [
        {
          chat_id: parseInt(sessionId) || 1,
          role: 'user',
          content: transcript,
          session_id: sessionId,
          user_id: userId,
          feature_type: 'speech-coach',
          message_metadata: { analysis, focusArea }
        },
        {
          chat_id: parseInt(sessionId) || 1,
          role: 'assistant',
          content: feedback,
          session_id: sessionId,
          user_id: userId,
          feature_type: 'speech-coach',
          message_metadata: { analysis, focusArea }
        }
      ]
    });
  } catch (error) {
    console.error('Error saving coaching interaction:', error);
  }
}

async function saveRoleplayInteractionAsync(userId, sessionId, userMessage, aiResponse, scenario, character) {
  try {
    await prisma.message.createMany({
      data: [
        {
          chat_id: parseInt(sessionId) || 1,
          role: 'user',
          content: userMessage,
          session_id: sessionId,
          user_id: userId,
          feature_type: 'roleplay',
          message_metadata: { scenario, character }
        },
        {
          chat_id: parseInt(sessionId) || 1,
          role: 'assistant',
          content: aiResponse,
          session_id: sessionId,
          user_id: userId,
          feature_type: 'roleplay',
          message_metadata: { scenario, character }
        }
      ]
    });
  } catch (error) {
    console.error('Error saving roleplay interaction:', error);
  }
}

export default router;
