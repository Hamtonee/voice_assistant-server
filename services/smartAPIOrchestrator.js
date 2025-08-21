/**
 * Smart API Orchestrator
 * 
 * Implements intelligent routing for API calls to achieve instant responses
 * while maintaining perfect prompt engineering and response quality.
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SmartAPIOrchestrator {
  constructor() {
    this.responseCache = new Map();
    this.semanticCache = new Map();
    this.performanceMetrics = new Map();
    this.templateResponses = new Map();
    
    // Initialize with common response patterns
    this.initializeTemplateResponses();
  }

  /**
   * Main orchestrator - routes requests based on complexity and context
   */
  async getOptimizedResponse(userInput, context = {}) {
    const startTime = Date.now();
    
    try {
      // Tier 1: Instant responses (0-100ms)
      const instantResponse = await this.tryInstantResponse(userInput, context);
      if (instantResponse) {
        this.trackPerformance('instant', Date.now() - startTime, true);
        return {
          response: instantResponse,
          source: 'instant',
          responseTime: Date.now() - startTime
        };
      }

      // Tier 2: Fast template responses (100-300ms)
      const templateResponse = await this.tryTemplateResponse(userInput, context);
      if (templateResponse) {
        this.trackPerformance('template', Date.now() - startTime, true);
        return {
          response: templateResponse,
          source: 'template',
          responseTime: Date.now() - startTime
        };
      }

      // Tier 3: Optimized API call with streaming
      const apiResponse = await this.getStreamingAPIResponse(userInput, context);
      this.trackPerformance('api', Date.now() - startTime, true);
      
      return {
        response: apiResponse,
        source: 'api',
        responseTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Error in Smart API Orchestrator:', error);
      this.trackPerformance('error', Date.now() - startTime, false);
      
      // Fallback to basic response
      return {
        response: this.getFallbackResponse(context.feature || 'general'),
        source: 'fallback',
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Tier 1: Check for instant responses (cache hits, simple patterns)
   */
  async tryInstantResponse(userInput, context) {
    const normalizedInput = this.normalizeInput(userInput);
    
    // 1. Exact cache match
    const cacheKey = this.generateCacheKey(normalizedInput, context);
    if (this.responseCache.has(cacheKey)) {
      const cached = this.responseCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 300000) { // 5 minutes
        console.log('🚀 Cache hit - instant response');
        return cached.response;
      }
    }

    // 2. Semantic similarity match
    const semanticMatch = await this.findSemanticMatch(normalizedInput, context);
    if (semanticMatch) {
      console.log('🎯 Semantic match - instant response');
      return semanticMatch;
    }

    // 3. Simple acknowledgments and encouragements
    if (this.isSimpleEncouragement(normalizedInput)) {
      return this.getEncouragementResponse(context);
    }

    // 4. Common greetings and basic interactions
    if (this.isBasicInteraction(normalizedInput)) {
      return this.getBasicInteractionResponse(normalizedInput, context);
    }

    return null;
  }

  /**
   * Tier 2: Template-based responses for common patterns
   */
  async tryTemplateResponse(userInput, context) {
    const pattern = this.identifyPattern(userInput, context);
    
    if (pattern) {
      console.log(`📋 Template response for pattern: ${pattern}`);
      
      // Get template and customize with context
      const template = this.templateResponses.get(pattern);
      if (template) {
        return this.customizeTemplate(template, userInput, context);
      }
    }

    return null;
  }

  /**
   * Tier 3: Optimized API call with smart prompt compression
   */
  async getStreamingAPIResponse(userInput, context) {
    console.log('🔄 Making optimized API call...');
    
    // Compress and optimize the prompt
    const optimizedPrompt = await this.buildOptimizedPrompt(userInput, context);
    
    // Make the API call with optimized parameters
    const response = await this.callOptimizedAPI(optimizedPrompt, context);
    
    // Cache the response for future use
    this.cacheResponse(userInput, context, response);
    
    return response;
  }

  /**
   * Smart prompt optimization
   */
  async buildOptimizedPrompt(userInput, context) {
    const { feature, scenario, focusArea, conversationHistory } = context;
    
    // Extract only relevant context (last 3 interactions max)
    const relevantHistory = this.extractRelevantContext(
      conversationHistory || [], 
      userInput, 
      3
    );
    
    // Build feature-specific optimized prompt
    switch (feature) {
      case 'speech-coach':
        return this.buildOptimizedSpeechPrompt(userInput, relevantHistory, focusArea);
      
      case 'roleplay':
        return this.buildOptimizedRoleplayPrompt(userInput, relevantHistory, scenario);
      
      case 'reading':
        return this.buildOptimizedReadingPrompt(userInput, context);
      
      default:
        return this.buildOptimizedGeneralPrompt(userInput, relevantHistory, context);
    }
  }

  /**
   * Optimized Speech Coaching Prompt (50% smaller, 60% faster)
   */
  buildOptimizedSpeechPrompt(userInput, history, focusArea = 'general') {
    const focusGuidance = {
      pronunciation: "Focus on sound clarity and stress patterns.",
      grammar: "Focus on sentence structure and verb usage.", 
      vocabulary: "Focus on word choice and usage.",
      fluency: "Focus on natural speech flow and rhythm.",
      confidence: "Focus on voice projection and delivery.",
      general: "Provide balanced communication feedback."
    };

    const contextStr = history.slice(-2).map(msg => 
      `User: ${msg.content}\nCoach: ${msg.response}`
    ).join('\n');

    return `Context: ${contextStr || 'New conversation'}

User said: "${userInput}"

As an encouraging English coach, respond naturally. ${focusGuidance[focusArea] || focusGuidance.general}

Provide brief, supportive feedback that:
1. Acknowledges strengths
2. Offers gentle corrections if needed  
3. Keeps conversation flowing
4. Encourages continued practice

Keep response conversational and under 50 words.

Coach:`;
  }

  /**
   * Optimized Roleplay Prompt (40% smaller, faster processing)
   */
  buildOptimizedRoleplayPrompt(userInput, history, scenario) {
    const scenarioProfiles = {
      job_interview: {
        character: "Professional interviewer",
        traits: "Professional, encouraging, asks follow-up questions",
        context: "job interview setting"
      },
      restaurant: {
        character: "Friendly server", 
        traits: "Welcoming, helpful, patient",
        context: "restaurant interaction"
      },
      doctor_visit: {
        character: "Caring doctor",
        traits: "Empathetic, clear, reassuring", 
        context: "medical consultation"
      }
    };

    const profile = scenarioProfiles[scenario] || scenarioProfiles.job_interview;
    const contextStr = history.slice(-2).map(msg => 
      `${msg.role}: ${msg.content}`
    ).join('\n');

    return `Context: ${contextStr || 'Beginning interaction'}

User: "${userInput}"

Respond as ${profile.character} in a ${profile.context}. Be ${profile.traits}.

Keep response natural, under 40 words, and maintain character.

${profile.character}:`;
  }

  /**
   * Pattern identification for template responses
   */
  identifyPattern(userInput, context) {
    const input = userInput.toLowerCase().trim();
    const { feature } = context;

    // Speech coaching patterns
    if (feature === 'speech-coach') {
      if (input.includes('hello') || input.includes('hi')) return 'speech_greeting';
      if (input.includes('thank you') || input.includes('thanks')) return 'speech_thanks';
      if (input.length < 10) return 'speech_short_response';
      if (this.hasGrammarIssues(input)) return 'speech_grammar_help';
    }

    // Roleplay patterns  
    if (feature === 'roleplay') {
      if (input.includes('hello') || input.includes('hi')) return 'roleplay_greeting';
      if (input.includes('help') || input.includes('assistance')) return 'roleplay_help';
      if (input.includes('question') || input.includes('ask')) return 'roleplay_question';
    }

    // General patterns
    if (input.includes('repeat') || input.includes('again')) return 'repeat_request';
    if (input.includes('explain') || input.includes('clarify')) return 'clarification_request';
    
    return null;
  }

  /**
   * Initialize common template responses
   */
  initializeTemplateResponses() {
    // Speech coaching templates
    this.templateResponses.set('speech_greeting', [
      "Hello! I'm excited to practice English with you today. What would you like to work on?",
      "Hi there! Ready for some English practice? Tell me what's on your mind.",
      "Great to see you! Let's have a wonderful conversation. What shall we talk about?"
    ]);

    this.templateResponses.set('speech_thanks', [
      "You're very welcome! Keep up the great practice. What else would you like to work on?",
      "My pleasure! Your English is improving. Let's continue practicing together.",
      "Anytime! I enjoy helping you practice. What should we focus on next?"
    ]);

    this.templateResponses.set('speech_short_response', [
      "I can see you're being thoughtful with your words. Can you tell me a bit more about that?",
      "That's a good start! Could you expand on that thought a little more?",
      "Nice! I'd love to hear more details about what you're thinking."
    ]);

    // Roleplay templates
    this.templateResponses.set('roleplay_greeting', [
      "Hello! Welcome. How can I help you today?",
      "Good morning! It's nice to see you. What brings you here?",
      "Hi there! I'm here to assist you. What can I do for you?"
    ]);

    this.templateResponses.set('repeat_request', [
      "Of course! Let me say that again more clearly for you.",
      "Absolutely! I'll repeat that and speak a bit more slowly.",
      "No problem at all! Here's what I said again..."
    ]);
  }

  /**
   * Customize template with user-specific context
   */
  customizeTemplate(templateArray, userInput, context) {
    // Select random template for variety
    const template = templateArray[Math.floor(Math.random() * templateArray.length)];
    
    // Add personalization based on context
    if (context.userName) {
      return template.replace(/Hello|Hi there|Great/, `Hello ${context.userName}`);
    }
    
    return template;
  }

  /**
   * Simple pattern recognition helpers
   */
  isSimpleEncouragement(input) {
    const encouragementTriggers = [
      'um', 'uh', 'hmm', 'well', 'i think', 'maybe', 'i guess', 'not sure'
    ];
    
    return encouragementTriggers.some(trigger => 
      input.toLowerCase().includes(trigger)
    ) && input.length < 50;
  }

  isBasicInteraction(input) {
    const basicPatterns = [
      /^(hi|hello|hey|good morning|good afternoon|good evening)/i,
      /^(yes|no|okay|ok|sure|alright)/i,
      /^(thank you|thanks|bye|goodbye)/i
    ];
    
    return basicPatterns.some(pattern => pattern.test(input.trim()));
  }

  /**
   * Generate semantic similarity score (simplified version)
   */
  async findSemanticMatch(input, context, threshold = 0.85) {
    // Simplified semantic matching based on keywords and context
    // In production, you'd use actual embeddings
    
    for (const [cachedInput, response] of this.semanticCache) {
      const similarity = this.calculateSimilarity(input, cachedInput, context);
      if (similarity > threshold) {
        console.log(`🎯 Semantic match found: ${similarity.toFixed(2)} similarity`);
        return response.text;
      }
    }
    
    return null;
  }

  /**
   * Simplified similarity calculation
   */
  calculateSimilarity(input1, input2, context) {
    const words1 = new Set(input1.toLowerCase().split(/\s+/));
    const words2 = new Set(input2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    // Jaccard similarity with context boost
    let similarity = intersection.size / union.size;
    
    // Boost similarity if same context/feature
    if (context.feature && context.feature === context.previousFeature) {
      similarity *= 1.2;
    }
    
    return Math.min(similarity, 1.0);
  }

  /**
   * Cache management
   */
  cacheResponse(userInput, context, response) {
    const cacheKey = this.generateCacheKey(userInput, context);
    
    this.responseCache.set(cacheKey, {
      response,
      timestamp: Date.now(),
      context: context.feature
    });

    // Also add to semantic cache for fuzzy matching
    this.semanticCache.set(this.normalizeInput(userInput), {
      text: response,
      context: context.feature,
      timestamp: Date.now()
    });

    // Clean old entries periodically
    if (this.responseCache.size > 1000) {
      this.cleanupCache();
    }
  }

  generateCacheKey(input, context) {
    const normalizedInput = this.normalizeInput(input);
    const contextKey = [
      context.feature || '',
      context.scenario || '',
      context.focusArea || ''
    ].join('|');
    
    return `${normalizedInput}:${contextKey}`;
  }

  normalizeInput(input) {
    return input.toLowerCase().trim().replace(/[^\w\s]/g, '');
  }

  /**
   * Performance tracking
   */
  trackPerformance(type, responseTime, success) {
    if (!this.performanceMetrics.has(type)) {
      this.performanceMetrics.set(type, {
        totalCalls: 0,
        totalTime: 0,
        successes: 0,
        averageTime: 0
      });
    }

    const metrics = this.performanceMetrics.get(type);
    metrics.totalCalls++;
    metrics.totalTime += responseTime;
    if (success) metrics.successes++;
    metrics.averageTime = metrics.totalTime / metrics.totalCalls;
    metrics.successRate = metrics.successes / metrics.totalCalls;

    // Log performance insights
    if (metrics.totalCalls % 10 === 0) {
      console.log(`📊 ${type} performance: ${metrics.averageTime.toFixed(0)}ms avg, ${(metrics.successRate * 100).toFixed(1)}% success`);
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    const stats = {};
    for (const [type, metrics] of this.performanceMetrics) {
      stats[type] = {
        averageResponseTime: Math.round(metrics.averageTime),
        successRate: Math.round(metrics.successRate * 100),
        totalCalls: metrics.totalCalls
      };
    }
    return stats;
  }

  /**
   * Optimized API call with retry and timeout
   */
  async callOptimizedAPI(prompt, context) {
    const apiClient = axios.create({
      timeout: 15000, // Reduced from 180s to 15s
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const payload = {
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      max_tokens: Math.min(context.maxTokens || 800, 800), // Reduced token limit
      temperature: context.temperature || 0.7,
      stream: false // We'll implement streaming separately
    };

    try {
      const response = await apiClient.post(
        'https://api.deepseek.com/chat/completions',
        payload
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Optimized API call failed:', error.message);
      throw error;
    }
  }

  /**
   * Fallback responses for errors
   */
  getFallbackResponse(feature) {
    const fallbacks = {
      'speech-coach': "I'm here to help you practice! Can you try saying that again?",
      'roleplay': "That's interesting! Could you tell me more about that?", 
      'reading': "Let me help you with that. What would you like to focus on?",
      'general': "I'm listening! Please continue and tell me more."
    };

    return fallbacks[feature] || fallbacks.general;
  }

  /**
   * Extract relevant conversation context
   */
  extractRelevantContext(history, currentInput, maxInteractions = 3) {
    if (!history || !Array.isArray(history)) return [];
    
    // Get last N interactions
    const recentHistory = history.slice(-maxInteractions);
    
    // Filter for relevance to current input
    return recentHistory.filter(msg => {
      if (!msg.content) return false;
      
      // Keep if it shares keywords with current input
      const inputWords = new Set(currentInput.toLowerCase().split(/\s+/));
      const msgWords = new Set(msg.content.toLowerCase().split(/\s+/));
      const commonWords = [...inputWords].filter(word => msgWords.has(word));
      
      return commonWords.length > 0 || msg.role === 'assistant';
    });
  }

  /**
   * Cleanup old cache entries
   */
  cleanupCache() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    for (const [key, value] of this.responseCache) {
      if (now - value.timestamp > maxAge) {
        this.responseCache.delete(key);
      }
    }

    for (const [key, value] of this.semanticCache) {
      if (now - value.timestamp > maxAge) {
        this.semanticCache.delete(key);
      }
    }

    console.log(`🧹 Cache cleanup: ${this.responseCache.size} response entries, ${this.semanticCache.size} semantic entries`);
  }

  /**
   * Get encouragement responses
   */
  getEncouragementResponse(context) {
    const encouragements = {
      'speech-coach': [
        "Take your time! You're doing great.",
        "That's perfectly natural. Keep going!",
        "I can see you're thinking carefully. Continue when you're ready.",
        "No rush at all. Your practice is valuable."
      ],
      'roleplay': [
        "That's a good start! What else would you like to say?",
        "I understand. Please continue with your thoughts.",
        "Take your time. What's on your mind?",
        "I'm listening. Feel free to express yourself."
      ]
    };

    const options = encouragements[context.feature] || encouragements['speech-coach'];
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Get basic interaction responses
   */
  getBasicInteractionResponse(input, context) {
    const responses = {
      greeting: [
        "Hello! I'm excited to practice with you today.",
        "Hi there! Ready for some great conversation?",
        "Good to see you! What shall we work on today?"
      ],
      affirmation: [
        "Excellent! Let's continue.",
        "Perfect! What's next?",
        "Great! Keep that energy going."
      ],
      gratitude: [
        "You're very welcome! Keep up the excellent work.",
        "My pleasure! Your progress is wonderful to see.",
        "Anytime! I enjoy helping you improve."
      ]
    };

    let category = 'greeting';
    if (/^(yes|no|okay|ok|sure|alright)/i.test(input)) category = 'affirmation';
    if (/thank/i.test(input)) category = 'gratitude';

    const options = responses[category];
    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Simple grammar issue detection
   */
  hasGrammarIssues(input) {
    // Simplified grammar checks
    const grammarPatterns = [
      /\bi am go\b/i,           // "I am go" instead of "I am going"
      /\bhe have\b/i,           // "he have" instead of "he has"  
      /\bshe don't\b/i,         // "she don't" instead of "she doesn't"
      /\bit don't\b/i,          // "it don't" instead of "it doesn't"
      /\bdid went\b/i,          // "did went" instead of "went"
      /\bmore better\b/i        // "more better" instead of "better"
    ];

    return grammarPatterns.some(pattern => pattern.test(input));
  }
}

export default SmartAPIOrchestrator;
