import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { SparklesIcon } from './Icons';
import { ImageGenerationResult } from '../types';

export const ImageTab: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<ImageGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Using gemini-2.5-flash-image as requested in instructions for standard tasks
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: prompt }
          ]
        }
      });

      let imageUrl = '';
      
      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64 = part.inlineData.data;
            // Assuming PNG based on typical return, but could vary.
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${base64}`;
            break;
          }
        }
      }

      if (imageUrl) {
        setResult({
          url: imageUrl,
          prompt: prompt,
          timestamp: new Date()
        });
      } else {
        setError("No image data returned. The model might have refused the prompt.");
      }

    } catch (err: any) {
      console.error("Image gen error:", err);
      setError(err.message || "Failed to generate image.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full p-6 overflow-y-auto">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Visual Imagination</h2>
        <p className="text-slate-400">Describe what you want to see, and Gemini will create it.</p>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="e.g., A futuristic city with flying cars in cyberpunk style"
            className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <SparklesIcon className="w-5 h-5" />
            )}
            <span>Generate</span>
          </button>
        </div>
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center min-h-[300px] bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-2xl relative overflow-hidden group">
        {result ? (
          <div className="relative w-full h-full flex flex-col items-center">
             <img 
              src={result.url} 
              alt={result.prompt} 
              className="max-w-full max-h-[500px] object-contain rounded-lg shadow-2xl" 
            />
            <div className="mt-4 text-slate-400 text-sm italic">"{result.prompt}"</div>
          </div>
        ) : (
          <div className="text-slate-600 flex flex-col items-center">
            {!isGenerating && (
              <>
                <SparklesIcon className="w-12 h-12 mb-4 opacity-20" />
                <p>Your creation will appear here</p>
              </>
            )}
             {isGenerating && (
               <div className="flex flex-col items-center gap-3">
                 <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                 <p className="text-brand-400 animate-pulse">Dreaming...</p>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};