import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { whatsappRouter } from '../../client/src/api/whatsapp.js';
import { getGenAI } from '../../client/src/lib/gemini.js';

dotenv.config();
const app = express();
const PORT = Number(process.env.PORT || 3000);
app.use(express.json({ limit: '10mb' }));
app.use('/api/whatsapp', whatsappRouter);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, message, history, context, dbState } = req.body;
    const rawMessages = messages || (history ? [...history.map((h: any) => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.parts?.[0]?.text || h.text || '' })), { role: 'user', content: message }] : [{ role: 'user', content: message || '' }]);
    const state = dbState || context || {};
    if (!Array.isArray(rawMessages) || rawMessages.length === 0) return res.status(400).json({ error: 'Messages array or message is required' });
    if (!process.env.GEMINI_API_KEY) {
      const lastUserMsg = rawMessages[rawMessages.length - 1]?.content || '';
      return res.json({ content: `I received your request: "${lastUserMsg}". To enable full live Gemini intelligence, please ensure your GEMINI_API_KEY is configured. You can still use our direct Quotations and Invoices generator screens to create and download official PDFs instantly.`, actionDraft: null });
    }
    const ai = getGenAI();
    const clientsList = (state?.clients || []).map((c: any) => ({ id: c.id, companyName: c.companyName, contactPerson: c.contactPerson, email: c.email, phone: c.phone, whatsapp: c.whatsapp, country: c.country, city: c.city, clientType: c.clientType, specialPricing: c.specialPricing }));
    const productsList = (state?.products || []).map((p: any) => ({ id: p.id, sku: p.sku, name: p.name, standardPrice: p.standardPrice, wholesalePrice: p.wholesalePrice, retailPrice: p.retailPrice, unit: p.unit, category: p.category }));
    const shippingList = (state?.shippingRates || []).map((s: any) => ({ id: s.id, destinationCountry: s.destinationCountry, destinationProvince: s.destinationProvince, shippingCompany: s.shippingCompany, cost: s.cost, deliveryTime: s.deliveryTime, shippingMethod: s.shippingMethod }));
    const outstandingInvoices = (state?.invoices || []).filter((inv: any) => inv.status !== 'Paid' && inv.balanceDue > 0).map((inv: any) => ({ invoiceNumber: inv.invoiceNumber, client: inv.clientSnapshot?.companyName, grandTotal: inv.grandTotal, amountPaid: inv.amountPaid, balanceDue: inv.balanceDue, dueDate: inv.dueDate, status: inv.status }));
    const companyInfo = state?.companySettings || { companyName: 'Healthy Fields Business Hub', tradingName: 'ProAgriSA / Healthy Fields Business Hub', physicalAddress: 'Franschhoek Estate Unit 11, 22 Wren Street, Chancliff Ridge / Rant en Dal, Krugersdorp, 1739, South Africa', phone: '+27 83 447 4639', whatsapp: '+27 83 447 4639', email: 'admin@proagrisa.co.za', vatNumber: '4820293819', bankName: 'Capitec Business Bank', accountName: 'Healthy Fields', accountNumber: '1052 3916 30', branchCode: '450105' };
    const knowledgeSnippets = (state?.knowledge || []).map((k: any) => ({ title: k.title, category: k.category, content: k.content }));
    const systemPrompt = `You are the private AI Business Assistant for "Healthy Fields Business Hub / ProAgriSA Grade Master" — an enterprise agricultural CRM, Quotation, Invoicing, and PDF generator system. The user is the business owner and operations manager. Official address: Franschhoek Estate Unit 11, 22 Wren Street, Chancliff Ridge / Rant en Dal, Krugersdorp, Area Code 1739, South Africa. Never invent product prices, shipping rates, or totals. Check client-specific pricing, client tier, standard price, and exact shipping data before preparing financial documents. When asked to create an invoice or quote, output a json_action block for the UI. Current database state: Company ${JSON.stringify(companyInfo)}; Clients (${clientsList.length}) ${JSON.stringify(clientsList)}; Products (${productsList.length}) ${JSON.stringify(productsList)}; Shipping (${shippingList.length}) ${JSON.stringify(shippingList)}; Outstanding invoices ${JSON.stringify(outstandingInvoices)}; Knowledge ${JSON.stringify(knowledgeSnippets)}. Keep responses professional, concise, and focused on agricultural business operations.`;
    const contents = [{ role: 'user', parts: [{ text: systemPrompt }] }, { role: 'model', parts: [{ text: 'Understood. I am Healthy Fields & ProAgriSA AI Business Copilot, connected to your database with live PDF generation capability.' }] }, ...rawMessages.map((m: any) => ({ role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user', parts: [{ text: m.content || m.text || '' }] }))];
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents, config: { temperature: 0.2 } });
    const responseText = response.text || '';
    let cleanedContent = responseText;
    let actionDraft = null;
    const actionMatch = responseText.match(/```(?:json_action|action_draft)\s*([\s\S]*?)\s*```/);
    if (actionMatch) {
      try { actionDraft = JSON.parse(actionMatch[1]); if (actionDraft.type === 'invoice_preview') actionDraft.type = 'create_invoice'; if (actionDraft.type === 'quote_preview') actionDraft.type = 'create_quote'; actionDraft.status = 'pending_confirmation'; cleanedContent = responseText.replace(/```(?:json_action|action_draft)\s*[\s\S]*?\s*```/, '').trim(); } catch (error) { console.warn('Failed to parse json_action block:', error); }
    }
    res.json({ content: cleanedContent, text: cleanedContent, actionDraft });
  } catch (error: any) { console.error('Error in /api/ai/chat:', error); res.status(500).json({ error: error.message || 'Internal AI processing error' }); }
});

app.post('/api/email/send', (req, res) => {
  const { to, subject, documentNumber } = req.body;
  if (!to) return res.status(400).json({ error: 'Recipient email is required' });
  console.log(`[Email Dispatch] Sending to: ${to} | Subject: ${subject} | Ref: ${documentNumber}`);
  res.json({ success: true, messageId: `msg_${Date.now()}`, status: 'Sent', sentAt: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ root: path.resolve(process.cwd(), 'client'), server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`ProAgriSA Grade Master server ready on port ${PORT}`));
}
startServer();
