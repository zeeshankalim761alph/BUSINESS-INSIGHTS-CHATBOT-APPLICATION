import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, AlertCircle } from 'lucide-react';
import { Message, Role, SUGGESTED_PROMPTS } from './types';
import { sendMessageStream, resetChat, initializeChat } from './services/geminiService';
import MessageBubble from './components/MessageBubble';
import TypingIndicator from './components/TypingIndicator';
import Header from './components/Header';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize chat on mount
  useEffect(() => {
    try {
      initializeChat();
      // Add initial greeting
      setMessages([
        {
          id: 'init-1',
          role: Role.MODEL,
          text: "Hello! I'm BizInsight, your strategic business advisor. I can help with market analysis, financial planning, startup ideas, and more. How can I assist you today?",
          timestamp: new Date(),
        },
      ]);
    } catch (e) {
      console.error("Failed to init chat", e);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleClearChat = useCallback(() => {
    if (window.confirm("Are you sure you want to clear the current conversation context?")) {
      resetChat();
      setMessages([
        {
          id: Date.now().toString(),
          role: Role.MODEL,
          text: "Conversation cleared. I'm ready for a new topic. What's on your mind?",
          timestamp: new Date(),
        },
      ]);
    }
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Create a placeholder for the bot response
    const botMessageId = (Date.now() + 1).toString();
    const botMessagePlaceholder: Message = {
      id: botMessageId,
      role: Role.MODEL,
      text: '',
      timestamp: new Date(),
    };
    
    // We don't add the empty placeholder to the list immediately if we want to show the specific typing indicator component.
    // However, for streaming, we usually want to start showing text as soon as it arrives.
    // Let's keep the dedicated TypingIndicator component visible until the first chunk arrives.

    try {
      let fullResponseText = '';
      let isFirstChunk = true;

      const stream = sendMessageStream(userMessage.text);

      for await (const chunk of stream) {
        fullResponseText += chunk;
        
        if (isFirstChunk) {
          isFirstChunk = false;
          // Add the bot message to state once we have data
          setMessages((prev) => [
            ...prev,
            { ...botMessagePlaceholder, text: fullResponseText }
          ]);
        } else {
          // Update the existing bot message
          setMessages((prev) => 
            prev.map(msg => 
              msg.id === botMessageId ? { ...msg, text: fullResponseText } : msg
            )
          );
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: Role.MODEL,
          text: "I apologize, but I encountered an error connecting to the business intelligence service. Please check your connection and try again.",
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsTyping(false);
      // Focus back on input after sending (desktop only ideally, but generally good UX)
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <Header onClearChat={handleClearChat} />

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 scroll-smooth">
        <div className="max-w-4xl mx-auto flex flex-col min-h-full">
          
          {/* Messages */}
          <div className="flex-1 pb-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            
            {isTyping && messages[messages.length - 1]?.role === Role.USER && (
               <div className="flex w-full justify-start mb-6">
                 <div className="flex max-w-[75%] flex-row gap-3 items-start">
                    <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-sm bg-emerald-600 text-white">
                      <Sparkles size={18} />
                    </div>
                    <TypingIndicator />
                 </div>
               </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts (Only show if chat is empty or short) */}
          {messages.length < 3 && !isTyping && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 animate-fade-in-up">
              {SUGGESTED_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(prompt)}
                  className="text-left p-3 text-sm bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all duration-200 shadow-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-20">
        <div className="max-w-4xl mx-auto relative">
          <div className="relative flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about business strategy, marketing, or finance..."
              disabled={isTyping}
              className="w-full pl-5 pr-14 py-4 bg-gray-50 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm text-gray-800 placeholder-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isTyping}
              className="absolute right-2 p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-md flex items-center justify-center"
              aria-label="Send message"
            >
              <Send size={20} />
            </button>
          </div>
          <div className="text-center mt-2">
            <p className="text-[10px] text-gray-400">
              AI can make mistakes. Please verify important financial and legal information.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;