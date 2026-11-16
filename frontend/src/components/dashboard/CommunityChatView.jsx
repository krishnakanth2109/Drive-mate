import React from 'react';
import { 
  MessageSquare, 
  Send, 
  ShieldCheck, 
  Users, 
  Sparkles, 
  Loader2 
} from 'lucide-react';

export function CommunityChatView({ 
  userProfile, 
  connectedUsers = [], 
  activeChatPeer, 
  setActiveChatPeer, 
  messages = [], 
  newMessageText = '', 
  setNewMessageText, 
  handleSendMessage, 
  sendingMessage = false,
  messagesEndRef,
  theme = 'dark'
}) {
  const isDark = theme === 'dark';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#38c6ec]/15 border border-[#38c6ec]/30 text-[#0284c7] dark:text-[#38c6ec] text-xs font-semibold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Real-Time Commuter Messaging
        </div>
        <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Inbox & Community Chat<span className="text-[#38c6ec]">.</span>
        </h1>
        <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Coordinate pickup locations, timings, and ride sharing directly with connected members.
        </p>
      </div>

      {/* Main Chat Box */}
      <div className={`rounded-3xl border backdrop-blur-xl shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-3 h-[600px] ${
        isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white border-slate-200'
      }`}>
        {/* Left Column: Peers List */}
        <div className={`border-r flex flex-col ${isDark ? 'border-white/10 bg-black/20' : 'border-slate-200 bg-slate-50'}`}>
          <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <Users className="w-4 h-4 text-[#38c6ec]" />
              Connected Peers ({connectedUsers.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {connectedUsers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No connected peers yet. Browse "Rides Available" and connect with drivers to start chatting.
              </div>
            ) : (
              connectedUsers.map((peer) => {
                const isSelected = (activeChatPeer?.id || activeChatPeer?._id) === (peer.id || peer._id);
                return (
                  <button
                    key={peer.id || peer._id}
                    onClick={() => setActiveChatPeer(peer)}
                    className={`
                      w-full p-3 rounded-2xl text-left transition-all flex items-center gap-3 cursor-pointer
                      ${isSelected 
                        ? isDark
                          ? 'bg-[#38c6ec]/15 border border-[#38c6ec]/30 text-white' 
                          : 'bg-sky-50 border border-sky-300 text-slate-900 shadow-sm'
                        : isDark
                          ? 'hover:bg-white/5 text-slate-400 border border-transparent'
                          : 'hover:bg-slate-100 text-slate-600 border border-transparent'}
                    `}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#38c6ec] to-blue-500 flex items-center justify-center font-bold text-black text-xs shrink-0">
                      {peer.name ? peer.name.charAt(0) : 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-xs font-bold truncate flex items-center gap-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <span>{peer.name}</span>
                        <ShieldCheck className="w-3 h-3 text-[#38c6ec]" />
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {peer.company || peer.profession || peer.city || 'Commuter'}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right 2 Columns: Chat Area */}
        <div className={`md:col-span-2 flex flex-col justify-between ${isDark ? 'bg-black/40' : 'bg-white'}`}>
          {activeChatPeer ? (
            <>
              {/* Active Peer Header */}
              <div className={`p-4 border-b flex items-center justify-between ${
                isDark ? 'border-white/10 bg-slate-900/50' : 'border-slate-200 bg-slate-50/80'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#38c6ec] to-blue-500 flex items-center justify-center font-bold text-black text-xs">
                    {activeChatPeer.name ? activeChatPeer.name.charAt(0) : 'P'}
                  </div>
                  <div>
                    <div className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      <span>{activeChatPeer.name}</span>
                      <ShieldCheck className="w-3 h-3 text-[#38c6ec]" />
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {activeChatPeer.company || 'Tech Park Hub'} • {activeChatPeer.city || 'Bangalore'}
                    </div>
                  </div>
                </div>

                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                  Active Commuter
                </span>
              </div>

              {/* Message Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-xs text-slate-400 space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-400" />
                    <span>No messages yet. Say hello and confirm pickup spots!</span>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderId === (userProfile?.id || userProfile?._id);
                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`
                            max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed
                            ${isMe 
                              ? 'bg-[#38c6ec] text-black font-semibold rounded-br-none shadow-md' 
                              : isDark
                                ? 'bg-slate-800 text-white rounded-bl-none border border-white/10'
                                : 'bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200'}
                          `}
                        >
                          <p>{msg.text || msg.content}</p>
                          <span className={`text-[9px] block mt-1 text-right ${isMe ? 'text-black/60' : 'text-slate-400'}`}>
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer */}
              <form onSubmit={handleSendMessage} className={`p-3 border-t flex items-center gap-2 ${
                isDark ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-slate-50'
              }`}>
                <input
                  type="text"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder={`Message ${activeChatPeer.name || 'commuter'}...`}
                  className={`flex-1 rounded-2xl px-4 py-3 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#38c6ec]/30 ${
                    isDark 
                      ? 'bg-black/40 border border-white/10 text-white focus:border-[#38c6ec]' 
                      : 'bg-white border border-slate-200 text-slate-900 focus:border-sky-500 shadow-sm'
                  }`}
                />
                <button
                  type="submit"
                  disabled={!newMessageText.trim() || sendingMessage}
                  className="p-3 rounded-2xl bg-[#38c6ec] hover:bg-[#2bb4d8] text-black font-bold transition-all shadow-[0_0_12px_rgba(56,198,236,0.3)] disabled:opacity-50 cursor-pointer"
                >
                  {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <MessageSquare className="w-12 h-12 text-slate-400" />
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Select a Commuter to Chat</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Pick a colleague from the list on the left to coordinate carpool timings and pickup points.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
