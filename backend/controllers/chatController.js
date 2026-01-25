const ChatSession = require('../models/ChatSession');
const DiagnosticTest = require('../models/DiagnosticTest');
const { sendSuccess, sendError } = require('../utils/errorHandler');
const { analyzeWithGemini, extractBalancedJson } = require('../services/aiService');

const startChat = async (req, res) => {
  try {
    const { deviceType, deviceName } = req.body;
    
    if (!deviceType || !deviceName) {
      return sendError(res, 400, 'Validation error', 'Device type and name are required');
    }

    const chatSession = await ChatSession.create({
      user: req.user._id,
      deviceType,
      deviceName,
      messages: [{
        sender: 'ai',
        text: `Hello! I'm here to help diagnose issues with your ${deviceName}. Can you describe what problem you're experiencing?`,
        metadata: {
          suggestions: [
            'Device not turning on',
            'Strange noise or smell',
            'Performance issues',
            'Error messages'
          ]
        }
      }],
      context: {
        conversationStage: 'initial',
        collectedInfo: {},
        suspectedIssues: []
      }
    });

    sendSuccess(res, 201, chatSession, 'Chat session started');
  } catch (error) {
    console.error('Start chat error:', error);
    sendError(res, 500, 'Failed to start chat', error.message);
  }
};

const sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    
    if (!message) {
      return sendError(res, 400, 'Validation error', 'Message is required');
    }

    const session = await ChatSession.findOne({
      _id: sessionId,
      user: req.user._id
    });
    
    if (!session) {
      return sendError(res, 404, 'Not found', 'Chat session not found');
    }

    if (session.status !== 'active') {
      return sendError(res, 400, 'Invalid session', 'Chat session is not active');
    }

session.messages.push({
      sender: 'user',
      text: message
    });

const aiResponse = await generateAIResponse(session, message);
    
    session.messages.push({
      sender: 'ai',
      text: aiResponse.text,
      metadata: aiResponse.metadata
    });

session.context = aiResponse.context;

if (aiResponse.context.conversationStage === 'completed') {
      session.status = 'completed';

const d = aiResponse.diagnosis || {};
      const safeSeverity = ['Low', 'Medium', 'High', 'Critical'].includes(d.severity)
        ? d.severity
        : 'Medium';
      const diagnostic = await DiagnosticTest.create({
        user: req.user._id,
        deviceType: session.deviceType,
        deviceName: session.deviceName,
        testType: 'symptom',
        diagnosis: {
          issue: d.issue || 'Issue identified',
          severity: safeSeverity,
          confidence: Number.isFinite(d.confidence) ? d.confidence : 60,
          affectedComponents: Array.isArray(d.affectedComponents) ? d.affectedComponents : [],
          rootCause: d.rootCause || d.issue || null,
          solution: d.solution || d.recommendations?.[0] || 'Inspect the device and consult a technician if needed.',
          estimatedCost: d.estimatedCost || undefined,
          urgency: ['immediate', 'within-week', 'within-month', 'routine'].includes(d.urgency)
            ? d.urgency
            : 'routine',
          diyPossible: Boolean(d.diyPossible),
          preventiveMeasures: Array.isArray(d.recommendations) ? d.recommendations : [],
          possibleCauses: Array.isArray(d.possibleCauses) ? d.possibleCauses : [],
        },
      });
      
      session.finalDiagnosis = diagnostic._id;
    }

    await session.save();

    sendSuccess(res, 200, session, 'Message sent');
  } catch (error) {
    console.error('Send message error:', error);
    sendError(res, 500, 'Failed to send message', error.message);
  }
};

const getChatHistory = async (req, res) => {
  try {
    const sessions = await ChatSession.find({
      user: req.user._id
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .select('deviceType deviceName status createdAt messages');

    sendSuccess(res, 200, sessions, 'Chat history retrieved');
  } catch (error) {
    console.error('Get chat history error:', error);
    sendError(res, 500, 'Failed to get history', error.message);
  }
};

const getChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await ChatSession.findOne({
      _id: sessionId,
      user: req.user._id
    }).populate('finalDiagnosis');
    
    if (!session) {
      return sendError(res, 404, 'Not found', 'Chat session not found');
    }

    sendSuccess(res, 200, session, 'Session retrieved');
  } catch (error) {
    console.error('Get session error:', error);
    sendError(res, 500, 'Failed to get session', error.message);
  }
};

const generateAIResponse = async (session, userMessage) => {
  const stage = session.context.conversationStage;
  const deviceType = session.deviceType;
  const collectedInfo = session.context.collectedInfo || {};

const conversationHistory = session.messages.slice(-5).map(m => 
    `${m.sender === 'user' ? 'User' : 'AI'}: ${m.text}`
  ).join('\n');

  const prompt = `You are an expert appliance troubleshooting assistant. 
Device: ${session.deviceName} (${deviceType})
Conversation stage: ${stage}
Collected info: ${JSON.stringify(collectedInfo)}

Conversation history:
${conversationHistory}
User: ${userMessage}

Based on the user's message, provide:
1. A helpful response (ask follow-up questions or provide diagnosis)
2. Update conversation stage (initial/gathering/analyzing/diagnosing/completed)
3. Collect relevant information
4. If enough info, provide diagnosis with issue, severity, confidence, causes, and recommendations

Respond in JSON format:
{
  "text": "your response",
  "stage": "current stage",
  "collectedInfo": {},
  "suspectedIssues": [],
  "diagnosis": null or {issue, severity, confidence, possibleCauses, recommendations}
}`;

  try {
    const aiResult = await analyzeWithGemini(prompt, null);

let parsed;
    try {
      const jsonContent = extractBalancedJson(aiResult);
      parsed = jsonContent ? JSON.parse(jsonContent) : null;
    } catch (e) {
      parsed = null;
    }

    if (!parsed) {
      
      return generateFallbackResponse(session, userMessage);
    }

    return {
      text: parsed.text,
      metadata: {
        suggestions: parsed.suggestions || [],
        diagnosis: parsed.diagnosis
      },
      context: {
        conversationStage: parsed.stage || 'gathering',

collectedInfo: deepMerge(collectedInfo, parsed.collectedInfo || {}),
        suspectedIssues: parsed.suspectedIssues || []
      },
      diagnosis: parsed.diagnosis
    };
  } catch (error) {
    console.error('AI generation error:', error);
    return generateFallbackResponse(session, userMessage);
  }
};

const isPlainObject = (v) => v != null && typeof v === 'object' && !Array.isArray(v);
const deepMerge = (base, patch) => {
  if (!isPlainObject(base)) return isPlainObject(patch) ? { ...patch } : patch;
  if (!isPlainObject(patch)) return base;
  const out = { ...base };
  for (const k of Object.keys(patch)) {
    const bv = base[k];
    const pv = patch[k];
    if (pv === undefined) continue;
    if (Array.isArray(pv) && Array.isArray(bv)) {
      out[k] = Array.from(new Set([...bv, ...pv]));
    } else if (isPlainObject(pv) && isPlainObject(bv)) {
      out[k] = deepMerge(bv, pv);
    } else {
      out[k] = pv;
    }
  }
  return out;
};

const generateFallbackResponse = (session, userMessage) => {
  const stage = session.context.conversationStage;
  
  if (stage === 'initial') {
    return {
      text: "Thank you for describing the issue. Can you tell me:\n1. When did this problem start?\n2. Does it happen all the time or intermittently?\n3. Have you noticed any unusual sounds, smells, or error messages?",
      metadata: { suggestions: ['Recently', 'A while ago', 'Just today'] },
      context: {
        conversationStage: 'gathering',
        collectedInfo: { initialSymptom: userMessage },
        suspectedIssues: []
      }
    };
  }
  
  return {
    text: "I understand. Based on what you've told me, I recommend:\n1. Check power connections\n2. Inspect for visible damage\n3. Consult the user manual\n4. Contact a professional technician if the issue persists\n\nWould you like me to help with anything else?",
    metadata: {},
    context: {
      conversationStage: 'completed',
      collectedInfo: session.context.collectedInfo,
      suspectedIssues: ['general_malfunction']
    },
    diagnosis: {
      issue: 'General malfunction',
      severity: 'Medium',
      confidence: 60,
      possibleCauses: ['Power issue', 'Component failure', 'Configuration error'],
      recommendations: ['Check connections', 'Inspect device', 'Contact technician']
    }
  };
};

module.exports = {
  startChat,
  sendMessage,
  getChatHistory,
  getChatSession
};
