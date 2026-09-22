import React from 'react';

export const QUICK_REPLIES = [
  { shortcut: '/greeting', text: 'Hi, thank you for contacting ProAgriSA. How can I assist you today?' },
  { shortcut: '/shipping', text: 'Our shipping costs depend on the destination and quantity. Please provide your exact location.' },
  { shortcut: '/thanks', text: 'Thank you for your business. Have a great day!' },
];

export const QuickRepliesDropdown: React.FC<{ onSelect: (text: string) => void }> = ({ onSelect }) => {
  return (
    <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#1A202C] border border-[#2D3748] rounded-lg shadow-xl overflow-hidden z-50">
      {QUICK_REPLIES.map((qr) => (
        <button 
          key={qr.shortcut}
          onClick={() => onSelect(qr.text)}
          className="w-full text-left px-4 py-2 hover:bg-[#2D3748] transition-colors border-b border-[#252D3D] last:border-0"
        >
          <div className="text-[#EAB308] font-bold text-xs mb-0.5">{qr.shortcut}</div>
          <div className="text-gray-300 text-xs truncate">{qr.text}</div>
        </button>
      ))}
    </div>
  );
};
