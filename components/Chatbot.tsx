import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, User, Bot, Loader2, Wrench } from 'lucide-react';
import { Product, Message } from '../types';
import { createChatSession, executeCRMTool } from '../services/geminiService';
import { GenerateContentResponse, Chat } from '@google/genai';

interface ChatbotProps {
  products: Product[];
}

export const Chatbot: React.FC<ChatbotProps> = ({ products }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      text: "Hi! I'm Nova, your personal TechNova assistant. I can help with product recommendations, order tracking (try 'Check order ORD-123'), or support issues.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [toolAction, setToolAction] = useState<string | null>(null);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatSessionRef.current) {
      chatSessionRef.current = createChatSession(products);
    }
  }, [products]);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, toolAction]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const chat = chatSessionRef.current;
      if (!chat) throw new Error("Chat session not initialized");

      // Send message to Gemini
      let result = await chat.sendMessage({ message: userMsg.text });
      
      // Check for Function Calls
      // The API might return multiple parts, some text, some function calls.
      // We iterate to find function calls.
      let functionCallParts = result.candidates?.[0]?.content?.parts?.filter(p => p.functionCall);
      
      while (functionCallParts && functionCallParts.length > 0) {
        // Execute tools
        setToolAction("Processing request...");
        const functionResponses = [];
        
        for (const part of functionCallParts) {
          const call = part.functionCall;
          if (call && call.name && call.args) {
            setToolAction(`Accessing CRM System: ${call.name}...`);
            const apiResponse = await executeCRMTool(call.name, call.args);
            
            functionResponses.push({
              name: call.name,
              response: { result: apiResponse },
              id: call.id
            });
          }
        }

        // Send tool results back to Gemini
        setToolAction("Analyzing data...");
        result = await chat.sendMessage(functionResponses);
        
        // Check if Gemini wants to call more tools or if it's done
        functionCallParts = result.candidates?.[0]?.content?.parts?.filter(p => p.functionCall);
      }

      // Final Text Response
      setToolAction(null);
      const text = result.text;
      
      if (text) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: text,
          timestamp: new Date()
        }]);
      }

    } catch (error) {
      console.error("Chat error:", error);
      setToolAction(null);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I apologize, but I'm having trouble accessing the system right now. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 md:bottom-6 md:right-6 h-14 w-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all transform hover:scale-110 z-40"
        >
          <div className="relative">
             <MessageCircle className="h-7 w-7" />
             <span className="absolute -top-1 -right-1 flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
             </span>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 w-[calc(100vw-2rem)] md:w-96 h-[600px] max-h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 z-50 animate-fade-in-up">
          {/* Header */}
          <div className="bg-gray-900 p-4 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Nova Assistant</h3>
                <p className="text-xs text-gray-300 flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
                  Connected to CRM
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors bg-gray-800 p-1.5 rounded-full"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-sm shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
            
            {/* Tool Action Indicator */}
            {toolAction && (
               <div className="flex justify-start">
                 <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center space-x-3 animate-pulse">
                   <Wrench className="h-4 w-4 text-indigo-600" />
                   <span className="text-xs font-medium text-indigo-700">{toolAction}</span>
                 </div>
               </div>
            )}

            {isTyping && !toolAction && (
              <div className="flex justify-start">
                 <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center space-x-2">
                   <div className="flex space-x-1">
                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                     <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                   </div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100 shrink-0">
            <div className="flex items-center bg-gray-100 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about products or orders..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-900 placeholder-gray-500 outline-none"
                disabled={isTyping}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className={`ml-3 p-2 rounded-lg transition-all duration-200 ${
                  input.trim() 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md transform hover:scale-105' 
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="text-center mt-2 flex justify-center items-center space-x-2">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
               <span className="text-[10px] text-gray-400 font-medium">System Operational</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};