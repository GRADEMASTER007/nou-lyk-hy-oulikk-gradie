import React, { useState, useEffect } from 'react';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { WhatsAppTemplate } from '../types';

export const WhatsAppTemplateModal: React.FC<{ onClose: () => void, onSend: (template: WhatsAppTemplate) => void }> = ({ onClose, onSend }) => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  
  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/whatsapp/templates');
      const data = await res.json();
      setTemplates(data);
    } catch(e) { console.error(e); }
  };

  useEffect(() => { fetchTemplates(); }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#11141D] rounded-xl border border-[#252D3D] w-full max-w-2xl p-6 text-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white font-bold flex items-center"><MessageSquare className="w-5 h-5 mr-2 text-[#EAB308]" /> WhatsApp Templates</h2>
          <button onClick={fetchTemplates} className="text-gray-400 hover:text-white"><RefreshCw className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {templates.map(t => (
            <div key={t.id} className="bg-[#1A202C] border border-[#2D3748] p-4 rounded-lg flex justify-between items-center">
               <div>
                  <h4 className="text-white font-bold">{t.name} <span className="text-[10px] text-gray-500 bg-[#0A0B0E] px-2 py-1 rounded ml-2">{t.status}</span></h4>
                  <p className="text-xs text-gray-400 mt-1">{t.category} • {t.language}</p>
               </div>
               <button onClick={() => onSend(t)} className="bg-[#EAB308] hover:bg-yellow-400 text-white px-4 py-1.5 rounded font-bold text-xs">Send</button>
            </div>
          ))}
          {templates.length === 0 && <p className="text-gray-500 text-center py-4">No templates found.</p>}
        </div>
        <button onClick={onClose} className="mt-4 text-gray-500 hover:text-white">Close</button>
      </div>
    </div>
  );
};
