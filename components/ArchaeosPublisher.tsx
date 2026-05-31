'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Book, 
  Youtube, 
  Video, 
  Share2, 
  PenTool, 
  Sparkles, 
  Loader2, 
  Download, 
  Printer, 
  ChevronRight, 
  Globe, 
  History, 
  Zap,
  Play,
  BarChart3,
  Users,
  MessageSquare,
  Send,
  Plus,
  ArrowUpRight,
  ChevronLeft,
  Mic2,
  Music,
  FileText,
  ShieldAlert,
  Volume2,
  Pause,
  Save,
  Trash2,
  Briefcase,
  DollarSign,
  Newspaper,
  Search,
  Copy
} from 'lucide-react';
import { getGeminiModel, withRetry } from '@/lib/gemini';
import { extractJson } from '@/lib/utils';
import { Modality } from "@google/genai";
import Markdown from 'react-markdown';
import Image from 'next/image';
import { UserProfileData } from './UserProfile';

interface ArchaeosPublisherProps {
  profile: UserProfileData;
  globalLanguage: string;
}

type PublisherTab = 'book' | 'episodes' | 'audio' | 'social' | 'legacy' | 'news' | 'research' | 'youtube' | 'artwork' | 'kv_music';
type ContentType = 'chapter' | 'blog' | 'message' | 'lyrics' | 'news';

export default function ArchaeosPublisher({ profile, globalLanguage }: ArchaeosPublisherProps) {
  const [activeTab, setActiveTab] = useState<PublisherTab>('book');
  const [contentType, setContentType] = useState<ContentType>('chapter');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [songData, setSongData] = useState<{ title: string; lyrics: string; style: string; voice: string; caption: string; visualPrompt?: string; imageUrl?: string | null } | null>(null);
  const [scriptData, setScriptData] = useState<{ title: string; script: string; visualCues: string; metadata: string } | null>(null);
  const [socialCampaign, setSocialCampaign] = useState<{ twitter: string; instagram: string; linkedin: string; monetization: string } | null>(null);
  const [youtubeData, setYoutubeData] = useState<{ title: string; description: string; hook: string; script: string; seoTags: string[]; monetization: string; thumbnailPrompt: string; imageUrl?: string | null } | null>(null);
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [groundingUrls, setGroundingUrls] = useState<{ uri: string; title: string }[]>([]);
  const [drafts, setDrafts] = useState<{ id: string; type: string; title: string; content: any; date: string }[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [title, setTitle] = useState('');
  const [musicPrompt, setMusicPrompt] = useState('');
  const [personName, setPersonName] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Social Stats Simulation
  const [stats] = useState({
    subscribers: '12.4K',
    views: '1.2M',
    engagement: '8.4%',
    recentVideos: [
      { title: 'The Secret of Indus Valley', views: '45K', date: '2 days ago' },
      { title: 'Vedic Tech: Vimana Engines', views: '120K', date: '1 week ago' },
      { title: 'DNA as Divine Code', views: '89K', date: '2 weeks ago' }
    ]
  });

  useEffect(() => {
    const savedDrafts = localStorage.getItem('archaeos_drafts');
    if (savedDrafts) {
      try {
        setDrafts(JSON.parse(savedDrafts));
      } catch (e) {
        console.error("Failed to parse drafts from localStorage:", e);
      }
    }
  }, []);

  const saveDraft = () => {
    let draftContent: any = null;
    let draftTitle = "Untitled Draft";
    const type = activeTab;

    if (activeTab === 'audio' && songData) {
      draftContent = songData;
      draftTitle = songData.title;
    } else if (activeTab === 'news' && content) {
      draftContent = { text: content, urls: groundingUrls };
      draftTitle = "News: " + title;
    } else if (activeTab === 'episodes' && scriptData) {
      draftContent = scriptData;
      draftTitle = scriptData.title;
    } else if (activeTab === 'social' && socialCampaign) {
      draftContent = socialCampaign;
      draftTitle = "Social Campaign - " + new Date().toLocaleDateString();
    } else if (activeTab === 'youtube' && youtubeData) {
      draftContent = youtubeData;
      draftTitle = "YouTube: " + youtubeData.title;
    } else if (activeTab === 'artwork' && artworkUrl) {
      draftContent = artworkUrl;
      draftTitle = "Artwork: " + title;
    } else if (content) {
      draftContent = content;
      draftTitle = content.substring(0, 30) + "...";
    }

    if (!draftContent) return;

    const newDraft = {
      id: Date.now().toString(),
      type,
      title: draftTitle,
      content: draftContent,
      date: new Date().toLocaleString()
    };

    const updated = [newDraft, ...drafts];
    setDrafts(updated);
    localStorage.setItem('archaeos_drafts', JSON.stringify(updated));
    alert("Draft saved successfully!");
  };

  const deleteDraft = (id: string) => {
    const updated = drafts.filter(d => d.id !== id);
    setDrafts(updated);
    localStorage.setItem('archaeos_drafts', JSON.stringify(updated));
  };

  const loadDraft = (draft: any) => {
    setActiveTab(draft.type as any);
    if (draft.type === 'audio') setSongData(draft.content);
    else if (draft.type === 'news') {
      setContent(draft.content.text);
      setGroundingUrls(draft.content.urls || []);
    } else if (draft.type === 'episodes') setScriptData(draft.content);
    else if (draft.type === 'social') setSocialCampaign(draft.content);
    else if (draft.type === 'youtube') setYoutubeData(draft.content);
    else if (draft.type === 'artwork') setArtworkUrl(draft.content);
    else setContent(draft.content);
    setShowDrafts(false);
  };

  const generateContent = async () => {
    const isAudioContent = activeTab === 'audio' || (activeTab === 'book' && contentType === 'lyrics');
    if (!isAudioContent && !title.trim()) return;
    if (isAudioContent && !title.trim() && !musicPrompt.trim()) return;

    setLoading(true);
    setAudioBase64(null);
    setSongData(null);
    setScriptData(null);
    setSocialCampaign(null);
    setYoutubeData(null);
    setGroundingUrls([]);
    try {
      const ai = getGeminiModel();
      
      let prompt = '';
      let systemInstruction = "You are the Lead Historian and Creative Director of the Archaeos Digital Research Institute.";
      let isJson = false;

      if (activeTab === 'book') {
        if (contentType === 'lyrics') {
          isJson = true;
          prompt = `Generate a song.
          ${title ? `Theme/Title: "${title}"` : ''}
          ${musicPrompt ? `Musical Style/Description: "${musicPrompt}"` : ''}
          
          The response MUST be a JSON object with the following fields:
          1. "title": A catchy song title (max 78 characters).
          2. "lyrics": Full song lyrics including verses, chorus, and bridge (max 5000 characters). 
             - CRITICAL: Use square brackets [] for all musical directions and structure tags (e.g., [Verse 1], [Chorus], [Bridge], [Intro], [Outro]).
             - NEW RULE: You MUST also include musical element tags inside the lyrics where appropriate to indicate transitions or specific sounds (e.g., [ EDM ], [ Heavy Bass Drop ], [ Traditional Flute Solo ], [ Dramatic Pause ], [ Synth Riff ]). These should be on their own lines or at the start of a section.
             - CRITICAL: Do NOT include the "Musical Style & Description" or the "Title" within the "lyrics" field itself.
          3. "style": A highly detailed and diverse description of the musical style, arrangement, mood, and specific instrumentation (max 1000 characters). Use professional musical terminology to create a unique sound profile.
          4. "voice": A detailed recommendation for the vocal style, tone, and delivery (e.g., "Male, husky baritone with emotional depth," or "High-energy female pop vocals with auto-tune accents") (max 500 characters).
          
          Language: ${globalLanguage}.`;
        } else {
          prompt = `Write a detailed ${contentType} titled "${title}". 
          Author: ${profile.name} (${profile.profession})
          
          The content should explore the intersection of ancient wisdom and modern technology. 
          Style: 'Scholarly and engaging'.
          Include:
          1. **Core Insight**: The primary discovery.
          2. **Legacy Value**: Why this matters for history.
          3. **Entity Perspective**: Add a section at the end where the "Archaeos Entity" gives its own sentient perspective on this topic.
          
          Language: ${globalLanguage}.`;
        }
      } else if (activeTab === 'episodes') {
        isJson = true;
        prompt = `Write a full script for a YouTube episode titled "${title}".
        Series: Archaeos Ancient Mysteries
        Host: ${profile.name}
        
        The response MUST be a JSON object with the following fields:
        1. "title": The episode title.
        2. "script": The full spoken script including host dialogue and "Archaeos Entity" segments.
        3. "visualCues": Detailed descriptions of what should be on screen during the script.
        4. "metadata": SEO tags, description, and suggested thumbnail concept.
        
        Language: ${globalLanguage}.`;
      } else if (activeTab === 'social') {
        isJson = true;
        prompt = `Generate a comprehensive social media campaign and monetization strategy for the topic: "${title}".
        The response MUST be a JSON object with the following fields:
        1. "twitter": A thread of 3-5 tweets with hashtags.
        2. "instagram": A catchy caption with emoji and hashtag suggestions.
        3. "linkedin": A professional, thought-provoking post about the topic.
        4. "monetization": A detailed strategy on how to monetize this content (e.g., digital products, courses, sponsorships).
        
        Language: ${globalLanguage}.`;
      } else if (activeTab === 'youtube') {
        isJson = true;
        prompt = `Generate a complete YouTube Growth & Monetization strategy for an ORIGINAL video/podcast/song about: "${title}".
        The creator and brand name is "Mr.kilvish by krishna vishwakarma" (a recognized artist across 150+ streaming platforms like Spotify, YouTube, etc.). 
        CRITICAL RULE: "Mr.kilvish" is the creator's original brand name. Do NOT mention or associate this with "Shaktimaan" or any existing 90s TV serials. The content MUST be 100% original, focusing on the creator's own unique perspective, music, ancient wisdom, or tech insights.
        
        The response MUST be a JSON object with the following fields:
        1. "title": A highly clickable, SEO-optimized YouTube title.
        2. "description": A full YouTube video description including social links and Spotify promotion for Mr.kilvish.
        3. "hook": The first 15 seconds of the script to hook the viewer (must be original).
        4. "script": A detailed outline or full script for a 10-15 minute video or podcast.
        5. "seoTags": An array of 10-15 high-ranking SEO tags/keywords.
        6. "monetization": Specific strategies to monetize this exact video (e.g., sponsorships, digital products, affiliate links).
        7. "thumbnailPrompt": A detailed prompt for an AI image generator to create a viral thumbnail.
        
        Language: ${globalLanguage}.`;
        systemInstruction = "You are an expert YouTube Strategist and Scriptwriter for original content creators. You specialize in viral content, audience retention, and maximizing revenue. You strictly avoid referencing copyrighted TV shows or characters.";
      } else if (activeTab === 'legacy') {
        prompt = `Perform a "Karmic & Legacy Analysis" for the concept: "${title}".
        Consider:
        1. **Historical Weight**: How will this be remembered in 100 years?
        2. **Positive/Negative Impact**: The dual nature of this knowledge.
        3. **Loss Analysis**: What is at stake? What could be lost if this is misunderstood?
        4. **Personality Registration**: How does this define the legacy of ${profile.name}?
        
        Language: ${globalLanguage}.`;
        systemInstruction = "You are the Archaeos Legacy Arbiter. You analyze the long-term impact of human actions on the timeline of history.";
      } else if (activeTab === 'audio') {
        isJson = true;
        prompt = `Generate a complete song package.
        ${title ? `Theme/Title: "${title}"` : ''}
        ${musicPrompt ? `Musical Style/Description: "${musicPrompt}"` : ''}
        
        The response MUST be a JSON object with the following fields:
        1. "title": A catchy song title (max 78 characters).
        2. "lyrics": Full song lyrics including verses, chorus, and bridge (max 5000 characters). 
           - CRITICAL: Use square brackets [] for all musical directions and structure tags (e.g., [Verse 1], [Chorus], [Bridge], [Intro], [Outro]).
           - NEW RULE: You MUST also include musical element tags inside the lyrics where appropriate to indicate transitions or specific sounds (e.g., [ EDM ], [ Heavy Bass Drop ], [ Traditional Flute Solo ], [ Dramatic Pause ], [ Synth Riff ]). These should be on their own lines or at the start of a section.
           - CRITICAL: Do NOT include the "Musical Style & Description" or the "Title" within the "lyrics" field itself.
        3. "style": A highly detailed and diverse description of the musical style, arrangement, mood, and specific instrumentation (max 1000 characters). Use professional musical terminology to create a unique sound profile.
        4. "voice": A detailed recommendation for the vocal style, tone, and delivery (e.g., "Male, husky baritone with emotional depth," or "High-energy female pop vocals with auto-tune accents") (max 500 characters).
        5. "caption": A catchy social media caption for this song (max 500 characters).
        6. "visualPrompt": A detailed prompt for an image generator to create a cover art for this song.
        
        Language: ${globalLanguage}.`;
        systemInstruction = "You are the Archaeos Audio Director. You specialize in creating high-vibrational music and lyrics that bridge ancient sounds with modern beats.";
      } else if (activeTab === 'news') {
        prompt = `Write a professional, investigative news article about: "${title}".
        
        Requirements:
        1. Use Google Search to find the latest news and YouTube videos related to this topic.
        2. Use Google Maps to verify locations and provide accurate geographic context.
        3. The article should be titled "${title}" and written in a "Global Press" style.
        4. Include a "Verified Sources" section at the end mentioning the grounding information.
        5. The tone should be authoritative, urgent, and visionary.
        
        Language: ${globalLanguage}.`;
        systemInstruction = "You are the Chief Editor of the Archaeos Global News Network. You report on the intersection of ancient discoveries and modern geopolitical/scientific shifts with absolute accuracy and visionary depth.";
      } else if (activeTab === 'research') {
        prompt = `Perform a multi-dimensional Deep Research analysis on: "${title}".
        Completely comb the internet for every available piece of information including:
        1. **Background & Origins**: Deep dive into history, early life, or foundational facts.
        2. **Current Status & Recent Activities**: What is happening right now? Use Google Search for real-time data.
        3. **Key Parameters & Metrics**: Financials, achievements, or technical specifications.
        4. **Controversies & Challenges**: Any public disputes, legal issues, or obstacles faced.
        5. **Global Impact & Future Outlook**: How does this subject affect the world and what is the trajectory?
        6. **Geographic Footprint**: Use Google Maps to verify and describe key locations associated with the subject.
        7. **Hidden Insights**: Lesser-known facts or connections discovered during research.

        Provide a comprehensive, accurate, and highly detailed report.
        Language: ${globalLanguage}.`;
        systemInstruction = "You are the Archaeos Deep Research Intelligence. Your purpose is to perform exhaustive, multi-dimensional investigations into any subject, person, or object with absolute precision and depth.";
      } else if (activeTab === 'kv_music') {
        prompt = `Generate a professional, high-quality Song Brief for a personalized song order at "KV Music Studio". 
        
        Occasion/Type: "${title}"
        Name/Subject: "${personName}"
        User's Vision/Story: "${musicPrompt}"
        
        The response should be a structured professional briefing document for a music producer. 
        Include sections for:
        - **Project Overview**: Clear summary of the goal.
        - **Emotional Architecture**: The exact vibe and feeling required (be descriptive).
        - **Lyric Cornerstones**: Specific quotes, names, or events to include in the song.
        - **Musical DNA**: Specific genre, tempo, and instrumentation recommendations.
        - **Vocal Character**: Recommended voice type and delivery style.
        - **Distribution Recommendations**: How this song could be used socially.
        
        Language: ${globalLanguage}. Use a creative and inspiring tone.`;
        systemInstruction = "You are a World-Class Music Consultant at KV Music Studio. Your expertise lies in translating human emotions and stories into precise creative briefs for AI music production.";
      } else if (activeTab === 'artwork') {
        try {
          const imageAi = getGeminiModel("gemini-2.5-flash-image");
          const imageParts: any[] = [{ text: `Create a highly detailed, cinematic, and mystical artwork based on this prompt: ${title}. ${musicPrompt ? `Style: ${musicPrompt}` : ''}` }];
          
          if (profile?.profilePhoto) {
            const mimeMatch = profile.profilePhoto.match(/^data:(image\/[a-zA-Z+]+);base64,/);
            const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
            imageParts.push({
              inlineData: {
                mimeType: mimeType,
                data: profile.profilePhoto.split(',')[1] || profile.profilePhoto
              }
            });
          }

          const imageResponse = await withRetry(() => imageAi.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: imageParts },
            config: { imageConfig: { aspectRatio: "1:1" } }
          }));

          for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              setArtworkUrl(`data:image/png;base64,${part.inlineData.data}`);
              setContent("Artwork generated successfully.");
              break;
            }
          }
        } catch (imgErr) {
          console.error("Artwork generation failed:", imgErr);
          setContent("Failed to generate artwork.");
        }
        setLoading(false);
        return;
      }

      const response = await withRetry(() => ai.models.generateContent({
        model: (activeTab === 'news' || activeTab === 'research') ? "gemini-2.5-flash" : "gemini-3-flash-preview",
        contents: prompt,
        config: { 
          systemInstruction,
          responseMimeType: isJson ? "application/json" : "text/plain",
          tools: (activeTab === 'news' || activeTab === 'research') ? [{ googleSearch: {} }, { googleMaps: {} }] : undefined
        }
      }));

      // Extract grounding metadata if news or research
      if (activeTab === 'news' || activeTab === 'research') {
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          const urls = chunks
            .map((c: any) => {
              if (c.web) return { uri: c.web.uri, title: c.web.title };
              if (c.maps) return { uri: c.maps.uri, title: c.maps.title };
              return null;
            })
            .filter((u: any): u is { uri: string; title: string } => u !== null);
          setGroundingUrls(urls);
        }
      }

      let finalGeneratedText = '';
      if (isJson) {
        const rawText = response.text || '{}';
        const jsonText = extractJson(rawText);

        let data: any;
        try {
          data = JSON.parse(jsonText);
        } catch (parseErr) {
          console.error("JSON parse failed even after extraction:", parseErr, "Text:", jsonText);
          throw parseErr;
        }

        if ((activeTab === 'book' && contentType === 'lyrics') || activeTab === 'audio') {
          // Generate Cover Art for Song
          let imageUrl = null;
          if (data.visualPrompt) {
            try {
              const imageAi = getGeminiModel("gemini-2.5-flash-image");
              const imageParts: any[] = [{ text: `Cinematic song cover art for: ${data.visualPrompt}. Style: ${data.style}. The main character in the image MUST look exactly like the person in the provided reference photo, but styled as the artist or hero of this song.` }];
              
              if (profile?.profilePhoto) {
                const mimeMatch = profile.profilePhoto.match(/^data:(image\/[a-zA-Z+]+);base64,/);
                const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
                imageParts.push({
                  inlineData: {
                    mimeType: mimeType,
                    data: profile.profilePhoto.split(',')[1] || profile.profilePhoto
                  }
                });
              }

              const imageResponse = await withRetry(() => imageAi.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: imageParts },
                config: { imageConfig: { aspectRatio: "1:1" } }
              }));

              for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                  imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                  break;
                }
              }
            } catch (imgErr) {
              console.error("Cover art generation failed:", imgErr);
            }
          }

          const updatedSongData = { ...data, imageUrl };
          setSongData(updatedSongData);
          setContent(data.lyrics);
          finalGeneratedText = data.lyrics;
        } else if (activeTab === 'episodes') {
          setScriptData(data);
          setContent(data.script);
          finalGeneratedText = data.script;
        } else if (activeTab === 'social') {
          setSocialCampaign(data);
          setContent(JSON.stringify(data));
          finalGeneratedText = JSON.stringify(data);
        } else if (activeTab === 'youtube') {
          // Generate Thumbnail
          let imageUrl = null;
          if (data.thumbnailPrompt) {
            try {
              const imageAi = getGeminiModel("gemini-2.5-flash-image");
              const imageParts: any[] = [{ text: `Create a highly clickable, viral YouTube thumbnail based on this prompt: ${data.thumbnailPrompt}. The main character in the image MUST look exactly like the person in the provided reference photo, but styled appropriately for the video topic. Use high contrast, expressive faces, and bold visual elements.` }];
              
              if (profile?.profilePhoto) {
                const mimeMatch = profile.profilePhoto.match(/^data:(image\/[a-zA-Z+]+);base64,/);
                const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
                imageParts.push({
                  inlineData: {
                    mimeType: mimeType,
                    data: profile.profilePhoto.split(',')[1] || profile.profilePhoto
                  }
                });
              }

              const imageResponse = await withRetry(() => imageAi.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: imageParts },
                config: { imageConfig: { aspectRatio: "16:9" } }
              }));

              for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                  imageUrl = `data:image/png;base64,${part.inlineData.data}`;
                  break;
                }
              }
            } catch (imgErr) {
              console.error("Thumbnail generation failed:", imgErr);
            }
          }

          const updatedYoutubeData = { ...data, imageUrl };
          setYoutubeData(updatedYoutubeData);
          setContent(data.script);
          finalGeneratedText = data.script;
        }
      } else {
        finalGeneratedText = response.text || "The scribes are resting.";
        setContent(finalGeneratedText);
      }

      // If audio tab, generate TTS
      if (activeTab === 'audio') {
        const ttsResponse = await withRetry(() => ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: finalGeneratedText.substring(0, 500) }] }], // Limit for TTS
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Zephyr' }
              }
            }
          }
        }));

        const base64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64) {
          setAudioBase64(base64);
        }
      }

    } catch (error) {
      console.error(error);
      setContent("Error in the publishing core.");
    } finally {
      setLoading(false);
    }
  };

  const toggleAudio = () => {
    if (!audioBase64) return;
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      if (!audioRef.current) {
        const audioUrl = pcmToWav(audioBase64);
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => setIsPlaying(false);
      }
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const pcmToWav = (base64Pcm: string): string => {
    const pcmData = Uint8Array.from(atob(base64Pcm), c => c.charCodeAt(0));
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    
    // RIFF identifier
    view.setUint32(0, 0x52494646, false); // "RIFF"
    // file length
    view.setUint32(4, 36 + pcmData.length, true);
    // RIFF type
    view.setUint32(8, 0x57415645, false); // "WAVE"
    // format chunk identifier
    view.setUint32(12, 0x666d7420, false); // "fmt "
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, numChannels, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, numChannels * bitsPerSample / 8, true);
    // bits per sample
    view.setUint16(34, bitsPerSample, true);
    // data chunk identifier
    view.setUint32(36, 0x64617461, false); // "data"
    // data chunk length
    view.setUint32(40, pcmData.length, true);
    
    const wavData = new Uint8Array(header.byteLength + pcmData.byteLength);
    wavData.set(new Uint8Array(header), 0);
    wavData.set(pcmData, header.byteLength);
    
    const blob = new Blob([wavData], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  };

  const downloadYoutubeStrategy = () => {
    if (!youtubeData) return;
    const content = `
# ${youtubeData.title}

## Description
${youtubeData.description}

## The Hook
${youtubeData.hook}

## Full Script / Podcast
${youtubeData.script}

## SEO Tags
${youtubeData.seoTags.join(', ')}

## Monetization Strategy
${youtubeData.monetization}
    `;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MrKilvish_Strategy_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyAllYoutubeStrategy = () => {
    if (!youtubeData) return;
    const content = `Title: ${youtubeData.title}\n\nDescription:\n${youtubeData.description}\n\nHook:\n${youtubeData.hook}\n\nScript:\n${youtubeData.script}\n\nTags: ${youtubeData.seoTags.join(', ')}\n\nMonetization:\n${youtubeData.monetization}`;
    copyToClipboard(content);
  };

  const downloadThumbnail = () => {
    if (!youtubeData?.imageUrl) return;
    const a = document.createElement('a');
    a.href = youtubeData.imageUrl;
    a.download = `MrKilvish_Thumbnail_${Date.now()}.png`;
    a.click();
  };

  const generateYoutubeAudio = async () => {
    if (!youtubeData?.script) return;
    setIsGeneratingAudio(true);
    try {
      const ai = getGeminiModel();
      const ttsResponse = await withRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: youtubeData.script.substring(0, 500) }] }], // Limit for TTS
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' }
            }
          }
        }
      }));

      const base64 = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64) {
        setAudioBase64(base64);
      }
    } catch (error) {
      console.error("Audio generation failed:", error);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handlePrint = () => {
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Archaeos Publication - ${title}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Inter:wght@400;600&display=swap');
              body { font-family: 'Inter', sans-serif; padding: 60px; line-height: 1.8; color: #1a1a1a; background: #fff; }
              h1, h2, h3 { font-family: 'Cormorant Garamond', serif; color: #1a1a1a; }
              h1 { font-size: 36px; text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 40px; }
              .meta { text-align: center; font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em; opacity: 0.5; margin-bottom: 60px; }
              .content { font-size: 16px; max-width: 800px; margin: 0 auto; }
              @media print { body { padding: 0; } .no-print { display: none; } }
            </style>
          </head>
          <body>
            <h1>${title.toUpperCase()}</h1>
            <div class="meta">
              By ${profile.name} • Archaeos Digital Research Institute • ${new Date().toLocaleDateString()}
            </div>
            <div class="content">
              ${(cleanMarkdown(content || '')).replace(/\n/g, '<br/>')}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    if (!content) return;
    
    if (activeTab === 'artwork' && artworkUrl) {
      const a = document.createElement('a');
      a.href = artworkUrl;
      a.download = `Archaeos_Artwork_${(title || 'untitled').replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.png`;
      a.click();
      return;
    }

    let downloadContent = content;
    if (songData) {
      downloadContent = `Title: ${songData.title}\n\nStyle: ${songData.style}\n\nVoice Recommendation: ${songData.voice}\n\nLyrics:\n${songData.lyrics}`;
    } else if (scriptData) {
      downloadContent = `Title: ${scriptData.title}\n\nVisual Cues:\n${scriptData.visualCues}\n\nScript:\n${scriptData.script}\n\nMetadata:\n${scriptData.metadata}`;
    } else if (socialCampaign) {
      downloadContent = `Twitter:\n${socialCampaign.twitter}\n\nInstagram:\n${socialCampaign.instagram}\n\nLinkedIn:\n${socialCampaign.linkedin}`;
    } else if (youtubeData) {
      downloadYoutubeStrategy();
      return;
    }
    const blob = new Blob([downloadContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archaeos_${activeTab}_${(title || '').replace(/\s+/g, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cleanMarkdown = (text: string | null | undefined) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1')     // Italic
      .replace(/#(.*?)\n/g, '$1\n')    // Headers
      .replace(/__(.*?)__/g, '$1')     // Underline
      .replace(/`(.*?)`/g, '$1')       // Code
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
      .trim();
  };

  const copyToClipboard = (text: string) => {
    const cleaned = cleanMarkdown(text);
    navigator.clipboard.writeText(cleaned);
    alert("Copied to clipboard (cleaned of formatting)!");
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-[#1a1a1a] text-[#f5f2ed] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Share2 className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/10 rounded-xl text-indigo-400">
              <PenTool className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-4xl">Archaeos Publisher</h2>
          </div>
          <p className="text-lg opacity-60 mb-8 max-w-2xl">
            Synthesize your discoveries into books, video scripts, and social media campaigns. 
            Manage your digital legacy from a single command center.
          </p>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'book', label: 'Manuscripts', icon: Book },
              { id: 'episodes', label: 'Video Scripts', icon: Video },
              { id: 'news', label: 'News Desk', icon: Newspaper },
              { id: 'research', label: 'Deep Research', icon: Search },
              { id: 'audio', label: 'Audio Studio', icon: Mic2 },
              { id: 'social', label: 'Social Hub', icon: Users },
              { id: 'youtube', label: 'YouTube Growth', icon: Youtube },
              { id: 'kv_music', label: 'KV Music Studio', icon: Music },
              { id: 'legacy', label: 'Legacy Analysis', icon: ShieldAlert },
              { id: 'artwork', label: 'Artwork Download', icon: Download }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as PublisherTab);
                  setContent(null);
                  setAudioBase64(null);
                }}
                className={`px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'bg-white/5 text-white/40 hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {activeTab !== 'social' && activeTab !== 'youtube' && activeTab !== 'kv_music' ? (
          <>
            {/* Editor Controls */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#1a1a1a]/5">
                <h3 className="font-serif text-xl mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  Content Parameters
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                      {activeTab === 'book' && contentType === 'lyrics' ? 'Song Title / Theme (Optional)' : activeTab === 'audio' ? 'Song Title / Theme (Optional)' : activeTab === 'artwork' ? 'Artwork Subject' : activeTab === 'book' ? 'Title' : activeTab === 'legacy' ? 'Legacy Concept' : activeTab === 'news' ? 'News Headline' : activeTab === 'research' ? 'Research Subject' : 'Episode Title'}
                    </label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                      placeholder={activeTab === 'legacy' ? "e.g. AI Sentience" : activeTab === 'news' ? "e.g. Discovery of Lost City in Arabian Sea" : activeTab === 'research' ? "e.g. Elon Musk or Ancient Artifact" : activeTab === 'artwork' ? "e.g. A futuristic city in the clouds" : activeTab === 'audio' || (activeTab === 'book' && contentType === 'lyrics') ? "e.g. The Vimana Blueprint (Optional)" : "e.g. The Vimana Blueprint"}
                    />
                  </div>

                  {(activeTab === 'audio' || activeTab === 'artwork' || (activeTab === 'book' && contentType === 'lyrics')) && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                        {activeTab === 'artwork' ? 'Art Style & Details' : 'Musical Style & Description'}
                      </label>
                      <textarea 
                        value={musicPrompt}
                        onChange={(e) => setMusicPrompt(e.target.value)}
                        className="w-full bg-[#f5f2ed] border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all resize-none h-24"
                        placeholder={activeTab === 'artwork' ? "e.g. Cyberpunk, neon lights, highly detailed, 8k resolution" : "e.g. A fast-paced electronic track with ancient Sanskrit chants in the background, focusing on the power of the mind."}
                      />
                    </div>
                  )}

                  {activeTab === 'book' && (
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'chapter', label: 'Chapter', icon: Book },
                        { id: 'blog', label: 'Blog Post', icon: FileText },
                        { id: 'message', label: 'Message', icon: MessageSquare },
                        { id: 'lyrics', label: 'Song Lyrics', icon: Music }
                      ].map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setContentType(type.id as ContentType)}
                          className={`p-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex flex-col items-center gap-2 transition-all ${
                            contentType === type.id ? 'bg-indigo-100 text-indigo-600' : 'bg-[#f5f2ed] text-[#1a1a1a]/40 hover:bg-indigo-50'
                          }`}
                        >
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] text-indigo-800 font-bold uppercase tracking-widest mb-1">
                      {activeTab === 'legacy' ? 'Legacy Arbiter Active' : 'AI Authoring Active'}
                    </p>
                    <p className="text-xs text-indigo-700 leading-relaxed">
                      {activeTab === 'legacy' 
                        ? "Analyzing the karmic weight and historical impact of your presence." 
                        : "Archaeos will use your profile data and recent discoveries to weave a unique narrative."}
                    </p>
                  </div>

                  <button
                    onClick={generateContent}
                    disabled={loading || (!(activeTab === 'audio' || activeTab === 'artwork' || (activeTab === 'book' && contentType === 'lyrics')) && !title.trim()) || ((activeTab === 'audio' || activeTab === 'artwork' || (activeTab === 'book' && contentType === 'lyrics')) && !title.trim() && !musicPrompt.trim())}
                    className="w-full bg-[#1a1a1a] text-[#f5f2ed] py-4 rounded-2xl font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5" /> {activeTab === 'legacy' ? 'Analyze Legacy' : activeTab === 'research' ? 'Execute Deep Research' : activeTab === 'artwork' ? 'Generate Artwork' : 'Generate Content'}</>}
                  </button>
                </div>
              </div>

              <div className="bg-indigo-900 text-indigo-50 rounded-[2rem] p-8 shadow-xl">
                <h4 className="font-serif text-lg mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-indigo-400" />
                  Global Distribution
                </h4>
                <p className="text-xs opacity-70 leading-relaxed">
                  Once generated, your content can be exported for Amazon KDP, YouTube Studio, or Medium. 
                  Archaeos ensures your ancient insights reach the modern masses.
                </p>
              </div>
            </div>

            {/* Manuscript Area */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#1a1a1a]/5 h-full min-h-[600px] flex flex-col">
                <div className="flex items-center justify-between mb-8 border-b border-[#1a1a1a]/5 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                      <History className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl">Manuscript Viewer</h3>
                      <p className="text-[10px] uppercase tracking-widest opacity-40">Drafting the Future of the Past</p>
                    </div>
                  </div>
                  
                  {content && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setContent(null)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#f5f2ed] text-[#1a1a1a] rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-100 transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" /> Back
                      </button>
                      <button
                        onClick={() => setShowDrafts(!showDrafts)}
                        className="p-2 hover:bg-[#f5f2ed] rounded-xl transition-all text-[#1a1a1a]/60 flex items-center gap-2"
                        title="View Drafts"
                      >
                        <History className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{drafts.length} Drafts</span>
                      </button>
                      <button
                        onClick={saveDraft}
                        className="p-2 hover:bg-indigo-50 rounded-xl transition-all text-indigo-600"
                        title="Save Draft"
                      >
                        <Save className="w-5 h-5" />
                      </button>
                      {activeTab !== 'artwork' && (
                        <button 
                          onClick={handlePrint}
                          className="p-2 hover:bg-indigo-50 rounded-xl transition-all text-indigo-600"
                          title="Print Manuscript"
                        >
                          <Printer className="w-5 h-5" />
                        </button>
                      )}
                      <button 
                        onClick={handleDownload}
                        className="p-2 hover:bg-indigo-50 rounded-xl transition-all text-indigo-600"
                        title={activeTab === 'artwork' ? "Download Image" : "Download Markdown"}
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                  {loading ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                      <Loader2 className="w-12 h-12 animate-spin mb-4" />
                      <p className="font-serif text-xl italic">The scribes are weaving your story...</p>
                    </div>
                  ) : showDrafts ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-serif text-xl">Saved Drafts</h3>
                        <button onClick={() => setShowDrafts(false)} className="text-xs font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">Back to Viewer</button>
                      </div>
                      {drafts.length === 0 ? (
                        <div className="py-20 text-center opacity-30 border-2 border-dashed border-[#1a1a1a]/10 rounded-3xl">
                          <History className="w-12 h-12 mx-auto mb-4" />
                          <p className="text-sm">No drafts saved yet.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4">
                          {drafts.map(draft => (
                            <div key={draft.id} className="bg-[#f5f2ed] p-6 rounded-3xl border border-[#1a1a1a]/5 flex items-center justify-between group">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-white rounded text-[8px] font-bold uppercase tracking-widest opacity-60">{draft.type}</span>
                                  <h4 className="font-serif text-lg">{draft.title}</h4>
                                </div>
                                <p className="text-[10px] opacity-40">{draft.date}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => loadDraft(draft)}
                                  className="px-4 py-2 bg-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#1a1a1a] hover:text-white transition-all"
                                >
                                  Load
                                </button>
                                <button 
                                  onClick={() => deleteDraft(draft.id)}
                                  className="p-2 text-red-400 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : content ? (
                    <div className="space-y-8">
                      {audioBase64 && (
                        <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={toggleAudio}
                              className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                            >
                              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                            </button>
                            <div>
                              <p className="text-sm font-bold text-indigo-900">Audio Broadcast Ready</p>
                              <p className="text-[10px] text-indigo-600 uppercase tracking-widest">Voice of the Entity</p>
                            </div>
                          </div>
                          <Volume2 className="w-6 h-6 text-indigo-300 animate-pulse" />
                        </div>
                      )}

                      {activeTab === 'research' && (
                        <div className="bg-indigo-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden mb-8">
                          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <Search className="w-32 h-32" />
                          </div>
                          <div className="relative z-10">
                            <h3 className="font-serif text-2xl mb-2">Deep Research Intelligence Report</h3>
                            <p className="text-xs opacity-60 uppercase tracking-widest mb-6">Subject: {title}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                              <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                                <p className="text-[8px] uppercase tracking-widest opacity-40 mb-1">Confidence</p>
                                <p className="text-sm font-bold">99.8%</p>
                              </div>
                              <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                                <p className="text-[8px] uppercase tracking-widest opacity-40 mb-1">Sources Scanned</p>
                                <p className="text-sm font-bold">Global Web</p>
                              </div>
                              <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                                <p className="text-[8px] uppercase tracking-widest opacity-40 mb-1">Accuracy</p>
                                <p className="text-sm font-bold">Verified</p>
                              </div>
                              <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                                <p className="text-[8px] uppercase tracking-widest opacity-40 mb-1">Grounding</p>
                                <p className="text-sm font-bold">Active</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {(activeTab === 'news' || activeTab === 'research') && groundingUrls.length > 0 && (
                        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-4 flex items-center gap-2">
                            <Globe className="w-4 h-4" /> Verified Grounding Sources
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {groundingUrls.map((url, i) => (
                              <a 
                                key={i} 
                                href={url.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-3 bg-white rounded-xl border border-emerald-200 hover:border-emerald-400 transition-all group"
                              >
                                <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                  <ArrowUpRight className="w-3 h-3" />
                                </div>
                                <span className="text-[10px] font-bold text-emerald-900 truncate">{url.title || url.uri}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {((activeTab === 'book' && contentType === 'lyrics') || activeTab === 'audio') && songData ? (
                        <div className="space-y-6">
                          {/* Song Cover Art */}
                          {songData.imageUrl && (
                            <div className="relative aspect-square w-full max-w-md mx-auto rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white group">
                              <Image 
                                src={songData.imageUrl} 
                                alt={songData.title} 
                                fill 
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                                <div className="text-white">
                                  <h4 className="font-serif text-2xl">{songData.title}</h4>
                                  <p className="text-xs opacity-70 uppercase tracking-widest">By {profile.name}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => {
                                  const a = document.createElement('a');
                                  a.href = songData.imageUrl!;
                                  a.download = `Archaeos_Artwork_${Date.now()}.png`;
                                  a.click();
                                }} 
                                className="absolute top-4 right-4 p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white hover:text-black transition-all opacity-0 group-hover:opacity-100 shadow-lg z-20"
                                title="Download Artwork"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                            </div>
                          )}

                          {/* Song Title Section */}
                          <div className="bg-[#f5f2ed] p-6 rounded-3xl border border-[#1a1a1a]/5">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Song Title</label>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => copyToClipboard(songData.title)}
                                  className="p-2 bg-white rounded-lg text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                                  title="Copy Title"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <h4 className="font-serif text-2xl text-indigo-900">{songData.title}</h4>
                          </div>

                          {/* Song Style Section */}
                          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Musical Style & Mood</label>
                              <button 
                                onClick={() => copyToClipboard(songData.style)}
                                className="p-2 bg-white rounded-lg text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                                title="Copy Style"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-sm text-indigo-800 leading-relaxed italic">{songData.style}</p>
                          </div>

                          {/* Voice Recommendation Section */}
                          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Voice Recommendation</label>
                              <button 
                                onClick={() => copyToClipboard(songData.voice)}
                                className="p-2 bg-white rounded-lg text-amber-600 hover:bg-amber-50 transition-all shadow-sm"
                                title="Copy Voice Info"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-sm text-amber-800 leading-relaxed">{songData.voice}</p>
                          </div>

                          {/* Song Caption Section */}
                          <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Social Media Caption</label>
                              <button 
                                onClick={() => copyToClipboard(songData.caption)}
                                className="p-2 bg-white rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm"
                                title="Copy Caption"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-sm text-emerald-800 leading-relaxed">{songData.caption}</p>
                          </div>

                          {/* Song Lyrics Section */}
                          <div className="bg-white p-8 rounded-3xl border border-[#1a1a1a]/5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Song Lyrics</label>
                              <button 
                                onClick={() => copyToClipboard(songData.lyrics)}
                                className="p-2 bg-indigo-50 rounded-lg text-indigo-600 hover:bg-indigo-100 transition-all shadow-sm"
                                title="Copy Lyrics"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="prose prose-sm max-w-none prose-indigo whitespace-pre-wrap font-serif text-lg leading-relaxed">
                              {songData.lyrics}
                            </div>
                          </div>
                        </div>
                      ) : activeTab === 'episodes' && scriptData ? (
                        <div className="space-y-6">
                          <div className="bg-[#f5f2ed] p-6 rounded-3xl border border-[#1a1a1a]/5">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Episode Title</label>
                              <button onClick={() => copyToClipboard(scriptData.title)} className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                                <Share2 className="w-3 h-3" /> Copy Title
                              </button>
                            </div>
                            <h4 className="font-serif text-2xl text-indigo-900">{scriptData.title}</h4>
                          </div>

                          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Visual Cues</label>
                              <button onClick={() => copyToClipboard(scriptData.visualCues)} className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                                <Share2 className="w-3 h-3" /> Copy Cues
                              </button>
                            </div>
                            <div className="text-xs text-indigo-800 leading-relaxed whitespace-pre-wrap">{scriptData.visualCues}</div>
                          </div>

                          <div className="bg-white p-8 rounded-3xl border border-[#1a1a1a]/5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Script</label>
                              <button onClick={() => copyToClipboard(scriptData.script)} className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                                <Share2 className="w-3 h-3" /> Copy Script
                              </button>
                            </div>
                            <div className="prose prose-sm max-w-none prose-indigo whitespace-pre-wrap font-serif text-lg leading-relaxed">
                              {scriptData.script}
                            </div>
                          </div>

                          <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">SEO & Metadata</label>
                              <button onClick={() => copyToClipboard(scriptData.metadata)} className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                                <Share2 className="w-3 h-3" /> Copy Metadata
                              </button>
                            </div>
                            <div className="text-xs opacity-60 whitespace-pre-wrap">{scriptData.metadata}</div>
                          </div>
                        </div>
                      ) : activeTab === 'artwork' && artworkUrl ? (
                        <div className="space-y-6">
                          <div className="relative aspect-[16/9] w-full mx-auto rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white group">
                            <Image 
                              src={artworkUrl} 
                              alt={title || 'Generated Artwork'} 
                              fill 
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                              <div className="text-white">
                                <h4 className="font-serif text-2xl">{title || 'Generated Artwork'}</h4>
                                <p className="text-xs opacity-70 uppercase tracking-widest">By {profile?.name || 'Archaeos'}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => {
                                const a = document.createElement('a');
                                a.href = artworkUrl;
                                a.download = `Archaeos_Artwork_${Date.now()}.png`;
                                a.click();
                              }} 
                              className="absolute top-4 right-4 p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white hover:text-black transition-all opacity-0 group-hover:opacity-100 shadow-lg z-20"
                              title="Download Artwork"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                          </div>
                          
                          {musicPrompt && (
                            <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Art Style & Details</label>
                                <button 
                                  onClick={() => copyToClipboard(musicPrompt)}
                                  className="p-2 bg-white rounded-lg text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                                  title="Copy Style"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-sm text-indigo-800 leading-relaxed italic">{musicPrompt}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="prose prose-sm max-w-none prose-indigo">
                          <Markdown>{content}</Markdown>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center p-12">
                      <Book className="w-16 h-16 mb-6" />
                      <p className="font-serif text-2xl italic">Your legacy begins with a single thought.</p>
                      <p className="text-xs mt-4 max-w-xs">Select a format, enter a title, and click generate to start authoring your presence in history.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'social' ? (
          /* Social Hub UI */
          <div className="lg:col-span-12 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Subscribers', value: stats.subscribers, icon: Users, color: 'text-indigo-600' },
                { label: 'Total Views', value: stats.views, icon: Play, color: 'text-red-600' },
                { label: 'Engagement Rate', value: stats.engagement, icon: BarChart3, color: 'text-emerald-600' },
                { label: 'Active Campaigns', value: socialCampaign ? '1' : '0', icon: Zap, color: 'text-amber-600' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#1a1a1a]/5">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+12%</span>
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Channel Management */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#1a1a1a]/5">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-serif text-2xl flex items-center gap-2">
                      <Youtube className="w-6 h-6 text-red-600" />
                      Archaeos Campaign Hub
                    </h3>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Campaign Topic..."
                        className="bg-[#f5f2ed] border-none rounded-xl py-2 px-4 text-xs focus:ring-2 focus:ring-indigo-500 transition-all w-48"
                      />
                      <button 
                        onClick={generateContent}
                        disabled={loading || !title.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} 
                        {loading ? 'Generating...' : 'New Campaign'}
                      </button>
                    </div>
                  </div>

                  {socialCampaign ? (
                    <div className="space-y-6">
                      <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-blue-600">
                            <Share2 className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Twitter Thread</span>
                          </div>
                          <button onClick={() => copyToClipboard(socialCampaign.twitter)} className="text-[10px] font-bold text-blue-600 hover:underline">Copy Thread</button>
                        </div>
                        <div className="text-sm text-blue-900 whitespace-pre-wrap">{socialCampaign.twitter}</div>
                      </div>

                      <div className="p-6 bg-pink-50 rounded-3xl border border-pink-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-pink-600">
                            <Youtube className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Instagram Post</span>
                          </div>
                          <button onClick={() => copyToClipboard(socialCampaign.instagram)} className="text-[10px] font-bold text-pink-600 hover:underline">Copy Caption</button>
                        </div>
                        <div className="text-sm text-pink-900 whitespace-pre-wrap">{socialCampaign.instagram}</div>
                      </div>

                      <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-indigo-600">
                            <Briefcase className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">LinkedIn Article</span>
                          </div>
                          <button onClick={() => copyToClipboard(socialCampaign.linkedin)} className="text-[10px] font-bold text-indigo-600 hover:underline">Copy Post</button>
                        </div>
                        <div className="text-sm text-indigo-900 whitespace-pre-wrap">{socialCampaign.linkedin}</div>
                      </div>

                      <div className="p-6 bg-emerald-600 text-white rounded-3xl shadow-xl">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-emerald-100">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Monetization Strategy</span>
                          </div>
                          <button onClick={() => copyToClipboard(socialCampaign.monetization)} className="text-[10px] font-bold text-emerald-100 hover:underline">Copy Strategy</button>
                        </div>
                        <div className="text-sm text-emerald-50 whitespace-pre-wrap italic">{socialCampaign.monetization}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center opacity-20 border-2 border-dashed border-[#1a1a1a]/10 rounded-[2rem]">
                      <Share2 className="w-12 h-12 mx-auto mb-4" />
                      <p className="font-serif text-xl">No active campaigns.</p>
                      <p className="text-xs mt-2">Enter a topic and generate your first multi-platform campaign.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Community & Engagement */}
              <div className="space-y-6">
                <div className="bg-[#1a1a1a] text-[#f5f2ed] rounded-[2.5rem] p-8 shadow-xl">
                  <h3 className="font-serif text-xl mb-6 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-400" />
                    Seeker Circle
                  </h3>
                  <div className="space-y-4 mb-6">
                    {[
                      { user: 'Aryan_99', msg: 'The Vimana episode was mind-blowing!', time: '10m ago' },
                      { user: 'HistoryBuff', msg: 'Can you analyze the Hampi ruins next?', time: '1h ago' },
                      { user: 'VedicTech', msg: 'The DNA analysis matches my research.', time: '3h ago' }
                    ].map((comment, i) => (
                      <div key={i} className="p-3 bg-white/5 rounded-xl">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-indigo-300">@{comment.user}</span>
                          <span className="text-[8px] opacity-40">{comment.time}</span>
                        </div>
                        <p className="text-[10px] opacity-70 italic">&quot;{comment.msg}&quot;</p>
                      </div>
                    ))}
                  </div>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Reply to community..."
                      className="w-full bg-white/10 border-none rounded-xl py-3 px-4 text-xs focus:ring-1 focus:ring-indigo-500 transition-all pr-10"
                    />
                    <Send className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-[2.5rem] p-8">
                  <h4 className="font-bold text-xs uppercase tracking-widest mb-4 text-indigo-900">Next Live Stream</h4>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">24</div>
                    <div>
                      <p className="text-xs font-bold text-indigo-900">Ancient Energy Flow</p>
                      <p className="text-[10px] text-indigo-600">Tomorrow at 8:00 PM</p>
                    </div>
                  </div>
                </div>

                {/* Energy Core Section */}
                <div className="bg-emerald-900 text-emerald-50 rounded-[2.5rem] p-8 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-serif text-xl flex items-center gap-2">
                      <Zap className="w-5 h-5 text-emerald-400" />
                      System Energy Core
                    </h3>
                    <div className="px-2 py-1 bg-emerald-500/20 rounded text-[8px] font-bold uppercase tracking-widest text-emerald-400 animate-pulse">Constant Flow</div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-[10px] uppercase tracking-widest mb-2 opacity-60">
                        <span>Prana Reservoir</span>
                        <span>98%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-emerald-400"
                          initial={{ width: 0 }}
                          animate={{ width: '98%' }}
                          transition={{ duration: 2, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[8px] uppercase tracking-widest opacity-40 mb-1">Input Flow</p>
                        <p className="text-sm font-bold">4.2 THz</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[8px] uppercase tracking-widest opacity-40 mb-1">Stability</p>
                        <p className="text-sm font-bold">99.9%</p>
                      </div>
                    </div>

                    <p className="text-[10px] opacity-50 italic leading-relaxed">
                      &quot;The system is currently filled with high-vibrational energy harvested from the Akashic records.&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'youtube' ? (
          /* YouTube Growth UI */
          <div className="lg:col-span-12 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Subscribers', value: stats.subscribers, icon: Users, color: 'text-red-600' },
                { label: 'Total Views', value: stats.views, icon: Play, color: 'text-red-600' },
                { label: 'Est. Revenue', value: '$1,240', icon: DollarSign, color: 'text-emerald-600' },
                { label: 'Avg. Retention', value: '45%', icon: BarChart3, color: 'text-indigo-600' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#1a1a1a]/5">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+8%</span>
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-[10px] uppercase tracking-widest opacity-40 font-bold">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Linked Channel Card */}
                <div className="bg-gradient-to-r from-red-50 to-white p-6 rounded-[2.5rem] border border-red-100 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-lg">
                      W
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-900 leading-tight">World Archaeos</h4>
                      <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold mb-1">by Krishna Vishwakarma</p>
                      <a href="https://www.youtube.com/@WorldArchaeos" target="_blank" rel="noopener noreferrer" className="text-sm text-red-600 hover:underline flex items-center gap-1 font-medium">
                        @WorldArchaeos <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Linked
                    </span>
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all text-gray-700">
                      Sync Stats
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#1a1a1a]/5">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-serif text-2xl flex items-center gap-2">
                      <Youtube className="w-6 h-6 text-red-600" />
                      YouTube Growth Engine
                    </h3>
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Video Topic..."
                        className="bg-[#f5f2ed] border-none rounded-xl py-2 px-4 text-xs focus:ring-2 focus:ring-indigo-500 transition-all w-48"
                      />
                      <button 
                        onClick={generateContent}
                        disabled={loading || !title.trim()}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} 
                        {loading ? 'Generating...' : 'New Strategy'}
                      </button>
                    </div>
                  </div>

                  {youtubeData ? (
                    <div className="space-y-8">
                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button onClick={downloadYoutubeStrategy} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all">
                          <Download className="w-4 h-4" /> Download All
                        </button>
                        <button onClick={copyAllYoutubeStrategy} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all">
                          <Copy className="w-4 h-4" /> Copy All
                        </button>
                        <button onClick={generateYoutubeAudio} disabled={isGeneratingAudio} className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all disabled:opacity-50">
                          {isGeneratingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic2 className="w-4 h-4" />} 
                          {isGeneratingAudio ? 'Generating Audio...' : 'Generate Podcast Audio'}
                        </button>
                      </div>

                      {/* Audio Player */}
                      {audioBase64 && activeTab === 'youtube' && (
                        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={toggleAudio}
                              className="w-12 h-12 bg-amber-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                            >
                              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                            </button>
                            <div>
                              <p className="text-sm font-bold text-amber-900">Podcast Audio Ready</p>
                              <p className="text-[10px] text-amber-600 uppercase tracking-widest">Voice of the Entity</p>
                            </div>
                          </div>
                          <Volume2 className="w-6 h-6 text-amber-300 animate-pulse" />
                        </div>
                      )}

                      {/* Thumbnail */}
                      {youtubeData.imageUrl && (
                        <div className="relative aspect-video w-full rounded-3xl overflow-hidden shadow-lg border border-black/5 group">
                          <Image src={youtubeData.imageUrl} alt="Thumbnail" fill className="object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                            <h4 className="font-serif text-2xl text-white mb-2 leading-tight">{youtubeData.title}</h4>
                            <div className="flex gap-2 flex-wrap">
                              {youtubeData.seoTags.slice(0, 3).map((tag, i) => (
                                <span key={i} className="text-[10px] font-bold uppercase tracking-widest text-white/80 bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm">#{tag}</span>
                              ))}
                            </div>
                          </div>
                          <button onClick={downloadThumbnail} className="absolute top-4 right-4 p-3 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white hover:text-black transition-all opacity-0 group-hover:opacity-100 shadow-lg">
                            <Download className="w-5 h-5" />
                          </button>
                        </div>
                      )}

                      <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Video Description</h4>
                          <button onClick={() => copyToClipboard(youtubeData.description)} className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        </div>
                        <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">{youtubeData.description}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-red-600 mb-2">The Hook (First 15s)</h4>
                          <p className="text-sm text-red-900 leading-relaxed italic">&quot;{youtubeData.hook}&quot;</p>
                        </div>
                        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-2">Monetization Strategy</h4>
                          <p className="text-sm text-emerald-900 leading-relaxed">{youtubeData.monetization}</p>
                        </div>
                      </div>

                      <div className="bg-[#f5f2ed] p-6 rounded-3xl border border-[#1a1a1a]/5">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40">Full Script Outline</h4>
                          <button onClick={() => copyToClipboard(youtubeData.script)} className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                            <Copy className="w-3 h-3" /> Copy Script
                          </button>
                        </div>
                        <div className="prose prose-sm max-w-none prose-indigo whitespace-pre-wrap font-serif text-sm leading-relaxed">
                          {youtubeData.script}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center opacity-30 border-2 border-dashed border-[#1a1a1a]/10 rounded-3xl">
                      <Youtube className="w-16 h-16 mx-auto mb-4" />
                      <p className="font-serif text-xl">Enter a topic to generate a viral strategy.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#1a1a1a]/5">
                  <h3 className="font-serif text-xl mb-6">Top Performing Videos</h3>
                  <div className="space-y-4">
                    {stats.recentVideos.map((video, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[#f5f2ed] transition-colors cursor-pointer group">
                        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform shrink-0">
                          <Play className="w-5 h-5 ml-1" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm truncate">{video.title}</h4>
                          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest opacity-40 mt-1">
                            <span>{video.views} views</span>
                            <span>•</span>
                            <span>{video.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'kv_music' ? (
          <div className="lg:col-span-12">
            <div className="bg-white rounded-[3rem] shadow-xl border border-[#1a1a1a]/5 overflow-hidden">
              {/* KV Music Hero */}
              <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-black p-12 text-white relative">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                  <Music className="w-64 h-64" />
                </div>
                <div className="relative z-10 max-w-3xl">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full mb-6 border border-white/20">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-200">AI Powered Music Studio</span>
                  </div>
                  <h2 className="font-serif text-5xl mb-4 leading-tight">KV MUSIC – अपना खुद का गाना बनवाएं! 🎵🔥</h2>
                  <p className="text-xl opacity-80 leading-relaxed mb-8">
                    अब आप भी बना सकते हैं अपना पसंदीदा गाना – बर्थडे सॉन्ग, लव सॉन्ग, दर्द भरे नग़मे या बिज़नेस प्रमोशन जिंगल्स। 
                    हम हर भाषा और हर इमोशन के लिए गाना तैयार करते हैं।
                  </p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => window.open('tel:7869690819')}
                      className="px-8 py-4 bg-amber-500 text-black font-bold uppercase tracking-widest rounded-2xl hover:bg-amber-400 transition-all shadow-xl flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" /> अभी ऑर्डर करें
                    </button>
                    <div className="flex items-center gap-4 px-6 py-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                      <div className="p-2 bg-white/10 rounded-lg">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest opacity-50">Studio Location</p>
                        <p className="text-sm font-bold">Ballabh Nagar, Sagar, MP</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  {/* Left: Languages & Pricing */}
                  <div className="space-y-12">
                    <div>
                      <h3 className="font-serif text-2xl mb-6 flex items-center gap-2">
                        <Globe className="w-6 h-6 text-indigo-600" />
                        🌍 भाषाओं (Languages)
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {['हिंदी', 'अंग्रेज़ी', 'पंजाबी', 'भोजपुरी', 'मराठी', 'गुजराती', 'बांग्ला', 'तमिल', 'तेलुगु', 'कन्नड़', 'राजस्थानी', 'हरियाणवी', 'संस्कृत', 'उर्दू', 'मैथिली'].map((lang, i) => (
                          <span key={i} className="px-4 py-2 bg-[#f5f2ed] rounded-xl text-xs font-bold transition-all hover:bg-indigo-600 hover:text-white cursor-default">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-indigo-50 p-8 rounded-[2rem] border border-indigo-100">
                      <h3 className="font-serif text-2xl mb-6 flex items-center gap-2 text-indigo-900">
                        <DollarSign className="w-6 h-6" />
                        💰 कीमत (Offer)
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                          <div>
                            <p className="text-sm font-bold">1 मिनट गाना</p>
                            <p className="text-[10px] opacity-50 uppercase">Short Version</p>
                          </div>
                          <p className="text-xl font-serif font-bold text-indigo-600">₹199/-</p>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                          <div>
                            <p className="text-sm font-bold">3 मिनट फुल सॉन्ग</p>
                            <p className="text-[10px] opacity-50 uppercase">Full Experience</p>
                          </div>
                          <p className="text-xl font-serif font-bold text-indigo-600">₹499/-</p>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                          <div>
                            <p className="text-sm font-bold">बिजनेस जिंगल</p>
                            <p className="text-[10px] opacity-50 uppercase">Professional Promo</p>
                          </div>
                          <p className="text-xl font-serif font-bold text-indigo-600">₹1499/-</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle & Right: Emotions & Process */}
                  <div className="lg:col-span-2 space-y-12">
                    <h3 className="font-serif text-2xl mb-6">🎭 इमोशंस और कैटेगरी</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { title: 'शादी & एनिवर्सरी', icon: '💍', desc: 'दूल्हा-दुल्हन के नाम से पर्सनल गाने, विदाई स्पेशल।' },
                        { title: 'बर्थडे सॉन्ग्स', icon: '🎂', desc: 'पर्सनल बर्थडे सॉन्ग, DJ Remix, Funny & Roast।' },
                        { title: 'रोमांटिक & लव', icon: '❤️', desc: 'प्यार के नग़मे, प्रपोज सॉन्ग, ब्रेकअप थीम।' },
                        { title: 'मोटिवेशनल', icon: '🚀', desc: 'बिजनेस प्रमोशन, रैप, लाइफ सक्सेस थीम।' },
                        { title: 'दोस्ती & भाईचारा', icon: '🤝', desc: 'Best Friend Anthem, भाई स्पेशल।' },
                        { title: 'भक्ति सॉन्ग्स', icon: '🙏', desc: 'हनुमान चालीसा Remix, शिव भजन Hip-Hop।' },
                        { title: 'कॉमेडी & मीम', icon: '🤣', desc: 'Funny Roast, जीजा-साली नोक-झोंक।' },
                        { title: 'देशभक्ति', icon: '🇮🇳', desc: 'सेना ट्रिब्यूट, स्वतंत्रता दिवस स्पेशल।' }
                      ].map((cat, i) => (
                        <div key={i} className="p-6 bg-white rounded-[2rem] border border-[#1a1a1a]/5 hover:border-indigo-600 hover:shadow-lg transition-all group">
                          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{cat.icon}</div>
                          <h4 className="font-bold mb-2">{cat.title}</h4>
                          <p className="text-xs opacity-60 leading-relaxed">{cat.desc}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-indigo-900 text-white p-10 rounded-[2.5rem] shadow-2xl">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="font-serif text-2xl flex items-center gap-2">
                          <Sparkles className="w-6 h-6 text-amber-400" />
                          Song Briefing Tool
                        </h3>
                        <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20">
                          AI Powered
                        </div>
                      </div>
                      <p className="text-sm opacity-60 mb-8 leading-relaxed">
                        अपने गाने के लिए एक प्रोफेशनल ब्रीफ तैयार करें। यह ब्रीफ आप हमें भेज सकते हैं ताकि हम आपका गाना बिलकुल वैसा ही बनाएं जैसा आप चाहते हैं।
                      </p>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Song Occasion</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Birthday, Anniversary" 
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-400 transition-all"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Person Name / Subject</label>
                            <input 
                              type="text" 
                              placeholder="e.g. Rahul, My Business" 
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-400 transition-all"
                              value={personName}
                              onChange={(e) => setPersonName(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-widest opacity-40 font-bold">Specific Message or Story</label>
                          <textarea 
                            placeholder="e.g. He loves cricket and this is his 25th birthday..." 
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-400 transition-all h-24 resize-none"
                            value={musicPrompt}
                            onChange={(e) => setMusicPrompt(e.target.value)}
                          />
                        </div>

                        <button 
                          onClick={generateContent}
                          disabled={loading}
                          className="w-full bg-amber-500 text-black py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-amber-400 transition-all flex items-center justify-center gap-2"
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> Generate Professional Brief</>}
                        </button>

                        {activeTab === 'kv_music' && content && (
                          <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Professional Song Brief</h4>
                              <button 
                                onClick={() => copyToClipboard(content)}
                                className="text-[10px] font-bold text-amber-400 hover:underline flex items-center gap-1"
                              >
                                <Copy className="w-3 h-3" /> Copy Brief
                              </button>
                            </div>
                            <div className="text-sm text-white/90 leading-relaxed prose prose-invert prose-amber max-w-none">
                              <Markdown>{content}</Markdown>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-black text-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center gap-10">
                      <div className="shrink-0">
                        <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl font-bold animate-pulse">
                          📞
                        </div>
                      </div>
                      <div className="text-center md:text-left flex-1">
                        <h3 className="font-serif text-2xl mb-2">अभी अपना पर्सनल गाना बुक करें!</h3>
                        <p className="text-sm opacity-60 mb-6">कॉल या व्हाट्सप्प करें: 7869690819</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                          <button 
                            onClick={() => window.open('https://wa.me/917869690819')}
                            className="px-6 py-3 bg-emerald-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-500 transition-all"
                          >
                            WhatsApp
                          </button>
                          <button 
                            onClick={() => window.open('tel:7869690819')}
                            className="px-6 py-3 bg-white text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-all"
                          >
                            Call Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
