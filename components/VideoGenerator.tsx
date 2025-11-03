import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tool } from '../types';
import { GoogleGenAI } from '@google/genai';

const loadingMessages = [
  'Warming up the AI circuits...',
  'Teaching pixels to dance...',
  'Gathering stardust for rendering...',
  'Consulting with the digital muses...',
  'Compositing visual elements...',
  'Polishing the final frames...',
  'Finalizing the cinematic masterpiece...'
];

interface VideoGeneratorProps {
  tool: Tool;
  initialPrompt: string;
  onBack: () => void;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

const BackIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ tool, initialPrompt, onBack }) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [image, setImage] = useState<{ base64: string; mimeType: string; previewUrl: string } | null>(null);
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const loadingIntervalRef = useRef<number | null>(null);

  const checkApiKey = useCallback(async () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    setApiKeyReady(!!apiKey);
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  useEffect(() => {
    if (isGenerating) {
      loadingIntervalRef.current = window.setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = loadingMessages.indexOf(prev);
          return loadingMessages[(currentIndex + 1) % loadingMessages.length];
        });
      }, 2500);
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    }
    return () => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    };
  }, [isGenerating]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      const previewUrl = URL.createObjectURL(file);
      setImage({ base64, mimeType: file.type, previewUrl });
    }
  };
  
  const handleSelectKey = async () => {
    // For standalone version, API key is set via environment variables
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (apiKey) {
      setApiKeyReady(true);
    } else {
      setError('Please set GEMINI_API_KEY in your .env file');
    }
  };

  const handleGenerate = async () => {
    if (!prompt && !image) {
      setError('Please provide a prompt or an image to generate a video.');
      return;
    }
    setError(null);
    setVideoUrl(null);
    setIsGenerating(true);
    setLoadingMessage(loadingMessages[0]);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        ...(image && { image: { imageBytes: image.base64, mimeType: image.mimeType } }),
        config: {
          numberOfVideos: 1,
          
          aspectRatio: aspectRatio
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const videoBlob = await videoResponse.blob();
        const url = URL.createObjectURL(videoBlob);
        setVideoUrl(url);
      } else {
        throw new Error('Video generation finished, but no download link was provided.');
      }
    } catch (e: any) {
      console.error(e);
      let errorMessage = e.message || 'An unknown error occurred.';
      if (errorMessage.includes("Requested entity was not found.")) {
          errorMessage = "Your API Key is invalid. Please select a valid key.";
          setApiKeyReady(false); // Reset key state
      }
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 animate-fade-in-scale">
        <button onClick={onBack} className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors mb-4">
            <BackIcon />
            Back to Dashboard
        </button>

      <h2 className="text-3xl font-bold text-center mb-1 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-300">{tool.title}</h2>
      <p className="text-center text-gray-300 mb-8">{tool.description}</p>
      
      {isGenerating ? (
        <div className="flex flex-col items-center justify-center h-96">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-purple-400"></div>
            <p className="mt-4 text-lg text-white">{loadingMessage}</p>
        </div>
      ) : videoUrl ? (
        <div className="flex flex-col items-center">
            <div className="relative">
              <video src={videoUrl} controls autoPlay className="w-full rounded-lg border border-white/20" />
              <img 
                src="/WhatsApp Image 2025-11-03 at 13.16.57.jpeg" 
                alt="Logo"
                className="absolute top-4 right-4 w-16 h-16 opacity-80 pointer-events-none rounded-lg"
              />
            </div>
            <button onClick={() => setVideoUrl(null)} className="mt-6 bg-purple-600/50 hover:bg-purple-500/80 text-white font-bold py-2 px-6 rounded-full transition-colors duration-300 border border-purple-400">
                Create Another Video
            </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A robot holding a red skateboard..."
              className="w-full h-28 p-4 bg-black/20 rounded-lg text-white placeholder-gray-400 border border-transparent focus:border-purple-400 focus:ring-0 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Starting Image (Optional)</label>
            <div className="flex items-center gap-4">
                <input type="file" id="imageUpload" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <label htmlFor="imageUpload" className="cursor-pointer bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                    Upload Image
                </label>
                {image && <img src={image.previewUrl} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-white/20" />}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Resolution</label>
                  <div className="flex gap-2">
                    <button onClick={() => setResolution('720p')} className={`px-4 py-2 rounded-lg transition-colors ${resolution === '720p' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'}`}>720p</button>
                    <button onClick={() => setResolution('1080p')} className={`px-4 py-2 rounded-lg transition-colors ${resolution === '1080p' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'}`}>1080p</button>
                  </div>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                  <div className="flex gap-2">
                    <button onClick={() => setAspectRatio('16:9')} className={`px-4 py-2 rounded-lg transition-colors ${aspectRatio === '16:9' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'}`}>16:9</button>
                    <button onClick={() => setAspectRatio('9:16')} className={`px-4 py-2 rounded-lg transition-colors ${aspectRatio === '9:16' ? 'bg-purple-600' : 'bg-white/10 hover:bg-white/20'}`}>9:16</button>
                  </div>
              </div>
          </div>

          {!apiKeyReady && (
            <div className="p-4 rounded-lg bg-yellow-900/50 border border-yellow-400 text-yellow-200 text-center">
              <p className="mb-2">An API key is required for video generation.</p>
              <button onClick={handleSelectKey} className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Select API Key</button>
              <p className="text-xs mt-2">For more information, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-100">billing documentation</a>.</p>
            </div>
           )}

          {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-lg border border-red-500">{error}</p>}
          
          <button 
            onClick={handleGenerate} 
            disabled={!apiKeyReady || (!prompt && !image)}
            className="w-full bg-purple-600/80 hover:bg-purple-500/80 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 border border-purple-400 transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:transform-none disabled:opacity-50"
          >
            Generate Video
          </button>
        </div>
      )}
      <style>{`
        @keyframes fade-in-scale {
          0% { transform: scale(0.98); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in-scale {
            animation: fade-in-scale 0.4s forwards ease-out;
        }
      `}</style>
    </div>
  );
};

export default VideoGenerator;