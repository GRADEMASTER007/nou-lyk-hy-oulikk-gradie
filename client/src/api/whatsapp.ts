import express from 'express';
import { db } from '../lib/firebase.js';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, addDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { getGenAI } from '../lib/gemini.js';

export const whatsappRouter = express.Router();

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '1124982727364139';
const WHATSAPP_BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '2042552476625265';
const WHATSAPP_WEBHOOK_VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'proagrisa_verify';

// 1. Webhook Verification
whatsappRouter.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode && token) {
    if (mode === 'subscribe' && token === WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Helper to determine service window (24h)
const getServiceWindowExpiry = () => {
  const d = new Date();
  d.setHours(d.getHours() + 24);
  return d.toISOString();
};

// 2. Incoming Webhook Receiver
whatsappRouter.post('/webhook/whatsapp', async (req, res) => {
  res.sendStatus(200); // Quick ack
  const body = req.body;
  
  if (body.object && body.entry && body.entry[0].changes && body.entry[0].changes[0]) {
    const value = body.entry[0].changes[0].value;
    
    // Handle message status updates (Sent/Delivered/Read/Failed)
    if (value.statuses && value.statuses.length > 0) {
       for (const status of value.statuses) {
          const wamid = status.id;
          const statusValue = status.status;
          try {
             // Find message by wamid
             const msgQuery = query(collection(db, 'whatsapp_messages'), where('wamid', '==', wamid), limit(1));
             const msgsSnap = await getDocs(msgQuery);
             if (!msgsSnap.empty) {
                const msgDoc = msgsSnap.docs[0];
                await updateDoc(msgDoc.ref, { status: statusValue, updatedAt: new Date().toISOString() });
             }
          } catch(e) { console.error('Status update error', e); }
       }
    }

    // Handle incoming messages
    if (value.messages && value.messages.length > 0) {
      for (const message of value.messages) {
        const contact = value.contacts?.[0];
        const from = message.from; 
        const wamid = message.id;
        
        let text = '';
        let type = 'unsupported';
        if (message.type === 'text') { text = message.text.body; type = 'text'; }
        else if (message.type === 'button') { text = message.button.text; type = 'interactive'; }
        else if (message.type === 'interactive') { 
           if (message.interactive.type === 'button_reply') text = message.interactive.button_reply.title;
           else if (message.interactive.type === 'list_reply') text = message.interactive.list_reply.title;
           type = 'interactive';
        } else {
           text = `[${message.type} message received]`;
           type = message.type;
        }

        const now = new Date().toISOString();
        
        // 1. Check or Create Conversation
        const convRef = doc(db, 'whatsapp_conversations', from);
        const convSnap = await getDoc(convRef);
        let conversationData: any = {};
        
        if (!convSnap.exists()) {
           conversationData = {
              id: from,
              whatsappPhoneNumber: from,
              contactName: contact?.profile?.name || from,
              profileName: contact?.profile?.name || '',
              status: 'New',
              priority: 'Normal',
              tags: [],
              unreadCount: 1,
              aiEnabled: true,
              humanTakeover: false,
              lastInboundMessageAt: now,
              lastMessageAt: now,
              serviceWindowExpiresAt: getServiceWindowExpiry(),
              createdAt: now,
              updatedAt: now
           };
        } else {
           const existing = convSnap.data();
           conversationData = {
              ...existing,
              unreadCount: (existing.unreadCount || 0) + 1,
              status: existing.status === 'Resolved' || existing.status === 'Closed' ? 'Open' : existing.status,
              lastInboundMessageAt: now,
              lastMessageAt: now,
              serviceWindowExpiresAt: getServiceWindowExpiry(),
              updatedAt: now
           };
        }

        // 2. Save incoming message
        const newMsg: any = {
           conversationId: from,
           wamid: wamid,
           from: from,
           to: WHATSAPP_PHONE_NUMBER_ID || 'me',
           text: text,
           type: type,
           timestamp: now,
           direction: 'inbound',
           senderType: 'customer',
           senderName: contact?.profile?.name || from,
           status: 'received',
           createdAt: now
        };
        const msgRef = await addDoc(collection(db, 'whatsapp_messages'), newMsg);
        newMsg.id = msgRef.id;
        
        conversationData.lastMessage = newMsg;
        await setDoc(convRef, conversationData);

        // 3. AI Copilot (if active and not taken over by human)
        if (conversationData.aiEnabled && !conversationData.humanTakeover && process.env.GEMINI_API_KEY && text) {
           try {
              const ai = getGenAI();
              const historyQuery = query(collection(db, 'whatsapp_messages'), where('conversationId', '==', from), orderBy('timestamp', 'desc'), limit(10));
              const historySnap = await getDocs(historyQuery);
              const history = historySnap.docs.map(d => d.data()).reverse();
              
              const contents = [
                 { role: 'user', parts: [{ text: "You are the AI assistant for ProAgriSA. Be professional, concise, and helpful." }]},
                 { role: 'model', parts: [{ text: "Understood." }]},
                 ...history.map(m => ({
                    role: m.direction === 'inbound' ? 'user' : 'model',
                    parts: [{ text: m.text }]
                 }))
              ];
              const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents });
              const replyText = response.text || '';
              
              if (replyText) {
                 // Send via Meta
                 let sentWamid = null;
                 if (WHATSAPP_ACCESS_TOKEN) {
                    const metaRes = await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
                       method: 'POST',
                       headers: { 'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
                       body: JSON.stringify({ messaging_product: "whatsapp", to: from, type: "text", text: { body: replyText } })
                    });
                    const metaData = await metaRes.json();
                    if (metaData.messages && metaData.messages[0]) sentWamid = metaData.messages[0].id;
                 }
                 
                 const outNow = new Date().toISOString();
                 const outMsg: any = {
                    conversationId: from,
                    wamid: sentWamid,
                    from: WHATSAPP_PHONE_NUMBER_ID,
                    to: from,
                    text: replyText,
                    type: 'text',
                    timestamp: outNow,
                    direction: 'outbound',
                    senderType: 'ai',
                    senderName: 'AI Assistant',
                    status: sentWamid ? 'sent' : 'failed',
                    createdAt: outNow
                 };
                 const outMsgRef = await addDoc(collection(db, 'whatsapp_messages'), outMsg);
                 outMsg.id = outMsgRef.id;
                 await updateDoc(convRef, { lastMessage: outMsg, lastMessageAt: outNow, lastOutboundMessageAt: outNow });
              }
           } catch (e) { console.error("AI processing error:", e); }
        }
      }
    }
  }
});

// 3. Send Manual Message
whatsappRouter.post('/send', async (req, res) => {
  const { to, text, type = 'text', template } = req.body;
  const now = new Date().toISOString();
  let sentWamid = null;
  let status = 'failed';
  let failureReason = null;
  
  if (WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID) {
    try {
       const payload: any = { messaging_product: "whatsapp", to: to, type: type };
       if (type === 'text') payload.text = { body: text };
       else if (type === 'template' && template) payload.template = template;

       const metaRes = await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
       });
       const metaData = await metaRes.json();
       if (metaData.error) {
          failureReason = metaData.error.message;
       } else if (metaData.messages && metaData.messages[0]) {
          sentWamid = metaData.messages[0].id;
          status = 'sent';
       }
    } catch (e: any) { failureReason = e.message; }
  } else {
    failureReason = "No WhatsApp Access Token Configured";
  }

  const outMsg: any = {
    conversationId: to,
    wamid: sentWamid,
    from: WHATSAPP_PHONE_NUMBER_ID || 'me',
    to: to,
    text: type === 'template' ? `[Template Sent: ${template?.name}]` : text,
    type: type,
    timestamp: now,
    direction: 'outbound',
    senderType: 'human',
    status: status,
    failureReason: failureReason,
    createdAt: now
  };
  
  const msgRef = await addDoc(collection(db, 'whatsapp_messages'), outMsg);
  outMsg.id = msgRef.id;
  
  // If human sends, trigger human takeover
  await updateDoc(doc(db, 'whatsapp_conversations', to), {
     lastMessage: outMsg,
     lastMessageAt: now,
     lastOutboundMessageAt: now,
     humanTakeover: true,
     aiEnabled: false
  });
  
  res.json(outMsg);
});

// 4. AI Suggestion for manual reply
whatsappRouter.post('/suggest', async (req, res) => {
  const { conversationId, crmContext } = req.body;
  try {
     const historyQuery = query(collection(db, 'whatsapp_messages'), where('conversationId', '==', conversationId), orderBy('timestamp', 'desc'), limit(5));
     const historySnap = await getDocs(historyQuery);
     const history = historySnap.docs.map(d => d.data()).reverse();
     
     const contextStr = crmContext ? `CRM Context: ${JSON.stringify(crmContext)}\n` : '';
     const prompt = `You are a professional CRM assistant for ProAgriSA. Based on the recent conversation, generate 3 different suggested short text replies for the human agent to send to the customer. 
     ${contextStr}
     Format the output strictly as a JSON array of 3 strings: ["Reply 1", "Reply 2", "Reply 3"]`;

     const ai = getGenAI();
     const contents = [ { role: 'user', parts: [{ text: prompt }]}, ...history.map(m => ({ role: m.direction === 'inbound' ? 'user' : 'model', parts: [{ text: m.text }] })) ];
     const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents });
     let textResponse = response.text || '[]';
     textResponse = textResponse.replace(/```json/g, '').replace(/```/g, '');
     const suggestions = JSON.parse(textResponse);
     res.json(suggestions);
  } catch (e) {
     console.error(e);
     res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Token Exchange
whatsappRouter.post('/exchange-token', async (req, res) => {
  const { appId, appSecret, shortToken } = req.body;
  if (!appId || !appSecret || !shortToken) return res.status(400).json({ error: 'Required fields missing' });
  try {
    const url = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`;
    const response = await fetch(url);
    res.json(await response.json());
  } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

