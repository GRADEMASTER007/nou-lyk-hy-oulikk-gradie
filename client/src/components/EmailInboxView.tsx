import React, { useState, useEffect, useRef } from 'react';
import { Mail, Bot, User, Check, CheckCheck, Clock, Paperclip, FileText, Send, MoreVertical, Plus, Tag, Search, ShieldAlert, Cpu, UserCheck, MessageSquare } from 'lucide-react';
import { EmailConversation, EmailMessage, Client } from '../types';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, addDoc } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import { useApp } from '../lib/store';

export const EmailInboxView: React.FC = () => {
  const { user } = useApp();
  const [conversations, setConversations] = useState<EmailConversation[]>([]);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [subjectInput, setSubjectInput] = useState('');
  const [sending, setSending] = useState(false);
  
  // AI Suggestions
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'email_conversations'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const convs = snap.docs.map(d => ({ ...d.data(), id: d.id } as EmailConversation));
      setConversations(convs);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'clients'));
    const unsub = onSnapshot(q, (snap) => {
      setClients(snap.docs.map(d => ({ ...d.data(), id: d.id } as Client)));
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user || !selectedConvId) {
       setMessages([]);
       return;
    }
    const q = query(collection(db, 'email_messages'), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs
         .map(d => ({ ...d.data(), id: d.id } as EmailMessage))
         .filter(m => m.conversationId === selectedConvId);
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      
      const convRef = doc(db, 'email_conversations', selectedConvId);
      updateDoc(convRef, { unreadCount: 0 });
    });
    return () => unsub();
  }, [selectedConvId, user]);

  const selectedConv = conversations.find(c => c.id === selectedConvId);
  const matchedClient = selectedConv ? clients.find(c => c.email.toLowerCase().includes(selectedConv.emailAddress.toLowerCase())) : null;

  const handleSend = async () => {
    if (!selectedConvId) return;
    if (!messageInput.trim()) return;
    
    setSending(true);
    setAiSuggestions([]);
    try {
      const outMsg = {
        conversationId: selectedConvId,
        subject: subjectInput || (messages.length > 0 ? `Re: ${messages[0].subject}` : 'Update from ProAgriSA'),
        from: 'admin@proagrisa.co.za',
        to: selectedConvId,
        body: messageInput,
        timestamp: new Date().toISOString(),
        direction: 'outbound',
        senderType: 'human',
        senderName: 'Admin',
        status: 'sent',
        createdAt: new Date().toISOString()
      };
      const msgRef = await addDoc(collection(db, 'email_messages'), outMsg);
      
      await updateDoc(doc(db, 'email_conversations', selectedConvId), {
         lastMessage: { ...outMsg, id: msgRef.id },
         lastMessageAt: outMsg.timestamp,
         updatedAt: outMsg.timestamp,
         humanTakeover: true,
         aiEnabled: false
      });

      setMessageInput('');
      setSubjectInput('');
    } catch(e) {
      console.error(e);
      alert('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const toggleAiMode = async () => {
    if (!selectedConvId || !selectedConv) return;
    const isAiEnabled = !selectedConv.aiEnabled;
    await updateDoc(doc(db, 'email_conversations', selectedConvId), {
       aiEnabled: isAiEnabled,
       humanTakeover: !isAiEnabled
    });
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'sent': return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered': return <CheckCheck className="w-3 h-3 text-gray-400" />;
      case 'read': return <CheckCheck className="w-3 h-3 text-blue-400" />;
      case 'failed': return <ShieldAlert className="w-3 h-3 text-red-500" />;
      default: return <Clock className="w-3 h-3 text-gray-500" />;
    }
  };

  const formatTime = (iso: string) => iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const formatDate = (iso: string) => iso ? new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  return (
    <div className="flex h-full bg-[#0A0B0E] text-[#D1D5DB] font-sans relative">
      {/* LEFT COLUMN - Inbox List */}
      <div className="w-80 border-r border-[#252D3D] flex flex-col bg-[#11141D]">
        <div className="p-4 border-b border-[#252D3D]">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-white font-bold text-lg">Email Inbox</h2>
             <div className="flex space-x-2">
             </div>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1.5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search emails..." 
              className="w-full bg-[#1A202C] border border-[#2D3748] rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:border-[#EAB308] text-white"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map(c => (
            <div 
              key={c.id} 
              onClick={() => setSelectedConvId(c.id)}
              className={`p-4 border-b border-[#252D3D] cursor-pointer hover:bg-[#1A202C] transition-colors ${selectedConvId === c.id ? 'bg-[#1A202C] border-l-2 border-l-#EAB308' : ''}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-white text-sm truncate">{c.contactName}</span>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{formatDate(c.lastMessageAt) === formatDate(new Date().toISOString()) ? formatTime(c.lastMessageAt) : formatDate(c.lastMessageAt)}</span>
              </div>
              <div className="text-xs text-[#EAB308] mb-1 truncate">{c.lastMessage?.subject || 'No Subject'}</div>
              <div className="flex justify-between items-end">
                <p className="text-xs text-gray-400 truncate pr-2">
                  {c.lastMessage?.body || 'No messages'}
                </p>
                {c.unreadCount > 0 && (
                  <span className="bg-[#EAB308] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {c.unreadCount}
                  </span>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                {c.aiEnabled && !c.humanTakeover ? (
                  <span className="flex items-center text-[10px] bg-indigo-900/40 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-900/50">
                    <Cpu className="w-3 h-3 mr-1" /> AI ACTIVE
                  </span>
                ) : (
                  <span className="flex items-center text-[10px] bg-yellow-950/40 text-[#EAB308] px-1.5 py-0.5 rounded border border-yellow-800/50">
                    <UserCheck className="w-3 h-3 mr-1" /> HUMAN
                  </span>
                )}
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">
              <p>No active email threads yet.</p>
              <p className="text-xs mt-2 text-[#EAB308]">🟢 Email System Ready</p>
            </div>
          )}
        </div>
      </div>

      {/* MIDDLE COLUMN - Email Thread */}
      <div className="flex-1 flex flex-col bg-[#0A0B0E] relative">
        {selectedConvId && selectedConv ? (
          <>
            {/* Header */}
            <div className="h-16 px-6 border-b border-[#252D3D] flex items-center justify-between bg-[#11141D]">
              <div>
                <h3 className="text-white font-bold">{selectedConv.contactName}</h3>
                <p className="text-xs text-gray-400">{selectedConv.emailAddress}</p>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={toggleAiMode}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    selectedConv.aiEnabled && !selectedConv.humanTakeover 
                    ? 'bg-indigo-900/30 text-indigo-400 border-indigo-900/50 hover:bg-indigo-900/50' 
                    : 'bg-yellow-950/30 text-[#EAB308] border-yellow-800/50 hover:bg-yellow-950/50'
                  }`}
                >
                  {selectedConv.aiEnabled && !selectedConv.humanTakeover ? <Cpu className="w-4 h-4"/> : <UserCheck className="w-4 h-4" />}
                  <span className="font-bold">{selectedConv.aiEnabled && !selectedConv.humanTakeover ? 'AI MODE' : 'HUMAN MODE'}</span>
                </button>
                <button className="p-1.5 hover:bg-[#252D3D] rounded text-gray-400">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="text-center text-xs text-gray-500 my-4">
                Conversation started on {formatDate(selectedConv.createdAt)}
              </div>
              
              {messages.map((msg, idx) => {
                const showDate = idx === 0 || formatDate(messages[idx-1].timestamp) !== formatDate(msg.timestamp);
                const isOut = msg.direction === 'outbound';
                
                return (
                  <React.Fragment key={msg.id}>
                    {showDate && (
                      <div className="text-center text-xs text-gray-500 my-6">
                        <span className="bg-[#1A202C] px-3 py-1 rounded-full">{formatDate(msg.timestamp)}</span>
                      </div>
                    )}
                    <div className={`flex flex-col ${isOut ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[85%] rounded-lg border shadow-sm flex flex-col ${
                        isOut 
                          ? 'bg-[#1C3A27] border-[#2F5A3D] text-[#E5F0EA]'
                          : 'bg-[#1A202C] border-[#2D3748] text-white'
                      }`}>
                        <div className={`px-4 py-2 border-b text-xs flex justify-between items-center ${isOut ? 'border-[#2F5A3D]/50' : 'border-[#2D3748]/50'}`}>
                           <span className="font-bold">{msg.subject || 'No Subject'}</span>
                           <span className={isOut ? 'text-[#EAB308]/80' : 'text-gray-400'}>{formatTime(msg.timestamp)}</span>
                        </div>
                        <div className="p-4 text-sm whitespace-pre-wrap">
                           {msg.body}
                        </div>
                      </div>
                      {msg.status === 'failed' && (
                        <div className="text-[10px] text-red-400 mt-1 flex items-center">
                          <ShieldAlert className="w-3 h-3 mr-1" />
                          Failed to send email
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div className="p-4 bg-[#11141D] border-t border-[#252D3D]">
              <div className="mb-2">
                 <input 
                    type="text" 
                    placeholder="Subject..." 
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    className="w-full bg-[#0A0B0E] border border-[#252D3D] rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-[#EAB308]"
                 />
              </div>
              <div className="flex items-end space-x-2">
                <textarea 
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Draft email response..."
                  className="w-full bg-[#0A0B0E] border border-[#252D3D] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#EAB308] resize-y min-h-[100px]"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!messageInput.trim() || sending}
                  className="p-3 h-[100px] flex items-center justify-center bg-[#EAB308] hover:bg-#EAB308 text-white rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2 px-2">
                <div className="flex space-x-2">
                  <button className="text-gray-400 hover:text-white p-1.5 rounded transition-colors"><Paperclip className="w-4 h-4" /></button>
                  <button className="text-gray-400 hover:text-white p-1.5 rounded transition-colors"><FileText className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 flex-col">
            <Mail className="w-16 h-16 text-[#252D3D] mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Email Inbox</h2>
            <p className="max-w-sm text-center text-sm">Select an email thread from the left to view messages and reply to customers.</p>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN - CRM Panel */}
      {selectedConvId && selectedConv && (
        <div className="w-80 border-l border-[#252D3D] bg-[#11141D] flex flex-col">
          <div className="p-4 border-b border-[#252D3D]">
            <h3 className="text-white font-bold text-sm">Customer Profile</h3>
          </div>
          <div className="p-6">
            <div className="w-20 h-20 bg-[#1A202C] rounded-full mx-auto flex items-center justify-center border border-[#2D3748] mb-4">
              <User className="w-10 h-10 text-gray-400" />
            </div>
            <h4 className="text-center text-white font-bold text-lg mb-1">{selectedConv.contactName}</h4>
            <p className="text-center text-[#EAB308] text-sm mb-6">{selectedConv.emailAddress}</p>
            
            {matchedClient ? (
              <div className="space-y-4">
                <div className="bg-[#1A202C] p-4 rounded-xl border border-[#2D3748]">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-gray-400">CRM Link</span>
                    <span className="text-[10px] bg-yellow-950/30 text-[#EAB308] px-2 py-0.5 rounded uppercase font-bold border border-yellow-800/50">Matched</span>
                  </div>
                  <p className="text-white text-sm font-bold truncate">{matchedClient.companyName}</p>
                  <p className="text-gray-400 text-xs truncate mt-1">{matchedClient.whatsapp}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <button className="bg-[#252D3D] hover:bg-[#2D3748] text-white text-xs py-2 rounded font-bold transition-colors">View Client</button>
                  <button className="bg-[#252D3D] hover:bg-[#2D3748] text-white text-xs py-2 rounded font-bold transition-colors">New Quote</button>
                  <button className="bg-[#252D3D] hover:bg-[#2D3748] text-white text-xs py-2 rounded font-bold transition-colors">New Invoice</button>
                  <button className="bg-[#252D3D] hover:bg-[#2D3748] text-white text-xs py-2 rounded font-bold transition-colors">Add Note</button>
                </div>
              </div>
            ) : (
              <div className="bg-[#1A202C] p-4 rounded-xl border border-yellow-800/50 text-center">
                <ShieldAlert className="w-8 h-8 text-[#EAB308] mx-auto mb-2" />
                <p className="text-[#EAB308] text-sm font-bold mb-1">Not in CRM</p>
                <p className="text-gray-400 text-xs mb-4">This email is not linked to any active client in your database.</p>
                <button className="w-full bg-[#EAB308] hover:bg-#EAB308 text-white text-xs py-2 rounded font-bold transition-colors flex items-center justify-center">
                  <Plus className="w-4 h-4 mr-1" /> Create Client
                </button>
              </div>
            )}
            
            <div className="mt-6 border-t border-[#252D3D] pt-6">
              <h5 className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-3">Conversation Info</h5>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">Status</span>
                  <span className="text-xs text-white">{selectedConv.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">Priority</span>
                  <span className="text-xs text-white">{selectedConv.priority}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">Assigned To</span>
                  <span className="text-xs text-white">{selectedConv.assignedTo || 'Unassigned'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
