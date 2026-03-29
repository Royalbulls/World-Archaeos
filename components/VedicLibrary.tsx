'use client';

import React, { useState } from 'react';
import { BookOpen, Search, Sparkles, Loader2, Book, ScrollText, Library, Send } from 'lucide-react';
import { getGeminiModel, withRetry } from '@/lib/gemini';
import Markdown from 'react-markdown';

export default function VedicLibrary({ globalLanguage }: { globalLanguage: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const categories = [
    { id: 'all', label: 'All Texts' },
    { id: 'veda', label: 'Vedas & Upanishads' },
    { id: 'tantra', label: 'Tantra & Yantra' },
    { id: 'mantra', label: 'Mantra Science' },
    { id: 'magic', label: 'Ancient Magic & Occult' },
    { id: 'granth', label: 'Puranas & Granths' }
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const ai = getGeminiModel();
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a master librarian of ancient world texts, specializing in Vedas, Tantra, Mantra, Granths, and ancient magic/occult books from all cultures (especially Indian/Vedic).
        
        The user is searching for: "${searchQuery}"
        Category filter: ${selectedCategory}
        Language preference: ${globalLanguage}
        
        Provide a comprehensive overview of texts related to this search. Include:
        1. Key books/granths/texts related to the query.
        2. A brief summary of the knowledge contained in them.
        3. Historical context and significance.
        4. Any specific mantras or core principles mentioned in these texts.
        
        Format the response beautifully in Markdown.`,
      }));
      setResults(response.text || "No texts found in the ancient archives.");
    } catch (error) {
      console.error(error);
      setResults("Failed to retrieve ancient texts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;

    const userMsg = { role: 'user' as const, text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const ai = getGeminiModel();
      const historyText = chatHistory.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`).join('\n\n');
      const response = await withRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are an enlightened sage and scholar of all world ancient texts, Tantra, Mantra, Vedas, Granths, and magic books.
        
        Language preference: ${globalLanguage}
        
        Previous conversation:
        ${historyText}
        
        User Question: ${chatInput}
        
        Answer the user's question with deep wisdom, referencing specific ancient texts, shlokas, or mantras where appropriate. Be respectful, educational, and profound.`,
      }));

      const assistantMsg = { role: 'assistant' as const, text: response.text || "The texts are silent on this matter." };
      setChatHistory(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#1a1a1a]/5">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-700">
            <Library className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-serif text-3xl">Vedic & Mystic Library</h2>
            <p className="text-sm text-[#1a1a1a]/60">Explore all world Tantra, Mantra, Magic Books, Granths, and Vedas to expand your knowledge.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#f5f2ed] text-[#1a1a1a]/60 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for texts, mantras, or ancient knowledge..."
                className="w-full bg-[#f5f2ed] border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-30" />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-indigo-600 text-white px-8 rounded-2xl text-sm font-medium hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
              Search Archive
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          {results ? (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#1a1a1a]/5">
              <h3 className="font-serif text-2xl mb-6 flex items-center gap-2">
                <ScrollText className="w-6 h-6 text-indigo-600" />
                Archive Results
              </h3>
              <div className="prose prose-sm max-w-none prose-indigo">
                <Markdown>{results}</Markdown>
              </div>
            </div>
          ) : (
            <div className="bg-[#f5f2ed] rounded-3xl p-12 text-center border-2 border-dashed border-[#1a1a1a]/10 h-full flex flex-col items-center justify-center">
              <Book className="w-16 h-16 opacity-20 mb-4" />
              <h3 className="font-serif text-xl mb-2 opacity-60">The Great Library is Open</h3>
              <p className="text-sm opacity-40 max-w-md">
                Search for ancient texts, specific mantras, or magical grimoires from around the world to reveal their secrets.
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#1a1a1a]/5 h-[600px] flex flex-col">
            <h3 className="font-serif text-xl mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Consult the Sage
            </h3>
            
            <div className="flex-1 bg-[#f5f2ed] rounded-2xl p-4 mb-4 overflow-y-auto space-y-4">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-2">
                  <Sparkles className="w-8 h-8" />
                  <p className="text-xs italic">Ask questions about Tantra, Mantra, Vedas, or any ancient text to gain deeper understanding.</p>
                </div>
              ) : (
                chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-xl text-xs ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white border border-[#1a1a1a]/5 text-[#1a1a1a] rounded-tl-none shadow-sm'
                    }`}>
                      <div className="prose prose-sm max-w-none">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#1a1a1a]/5 p-3 rounded-xl rounded-tl-none shadow-sm">
                    <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                  </div>
                </div>
              )}
            </div>

            <div className="relative mt-auto">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                placeholder="Ask about a specific mantra or text..."
                className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 pl-4 pr-12 text-xs focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <button 
                onClick={handleChat}
                disabled={chatLoading || !chatInput.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
