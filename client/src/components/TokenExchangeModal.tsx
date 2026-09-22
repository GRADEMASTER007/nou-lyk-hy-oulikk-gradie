import React, { useState } from 'react';
import { Clock } from 'lucide-react';

export const TokenExchangeModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');
  const [shortToken, setShortToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultToken, setResultToken] = useState<string | null>(null);

  const handleExchange = async () => {
    if (!appId || !appSecret || !shortToken) {
      setError("All fields are required.");
      return;
    }
    setError(null);
    setLoading(true);
    setResultToken(null);
    
    try {
      const res = await fetch('/api/whatsapp/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, appSecret, shortToken })
      });
      const data = await res.json();
      
      if (res.ok && data.access_token) {
        setResultToken(data.access_token);
      } else {
        setError(data.error?.message || data.error || "Failed to exchange token");
      }
    } catch (e) {
      setError("Network or server error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#11141D] rounded-xl border border-[#252D3D] w-full max-w-xl p-6 text-sm text-gray-300">
        <h2 className="text-white font-bold mb-4 flex items-center"><Clock className="w-5 h-5 mr-2 text-[#EAB308]" /> Generate Permanent Token</h2>
        <div className="space-y-3">
          <input value={appId} onChange={e => setAppId(e.target.value)} className="w-full bg-[#1A202C] border border-[#2D3748] rounded px-3 py-2 text-white" placeholder="App ID" />
          <input type="password" value={appSecret} onChange={e => setAppSecret(e.target.value)} className="w-full bg-[#1A202C] border border-[#2D3748] rounded px-3 py-2 text-white" placeholder="App Secret" />
          <textarea value={shortToken} onChange={e => setShortToken(e.target.value)} className="w-full bg-[#1A202C] border border-[#2D3748] rounded px-3 py-2 text-white" placeholder="Temporary Token" />
          {error && <div className="text-red-400">{error}</div>}
          <button onClick={handleExchange} disabled={loading} className="w-full py-2 bg-[#EAB308] hover:bg-yellow-400 text-white rounded font-bold">
            {loading ? 'Exchanging...' : 'Generate Permanent Token'}
          </button>
          {resultToken && (
            <div className="mt-4 bg-[#0A0B0E] p-4 rounded border border-yellow-800">
              <p className="text-[#EAB308] font-bold mb-2">Success! Token:</p>
              <textarea readOnly value={resultToken} className="w-full bg-[#1A202C] border border-[#2D3748] rounded px-3 py-2 text-[#EAB308] text-xs" />
            </div>
          )}
        </div>
        <button onClick={onClose} className="mt-4 text-gray-500 hover:text-white">Close</button>
      </div>
    </div>
  );
};
