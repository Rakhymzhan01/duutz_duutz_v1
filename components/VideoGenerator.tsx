import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tool } from '../types';
import { useAuth } from '../contexts/AuthContext';

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
  const { user, tokens, isAuthenticated } = useAuth();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [image, setImage] = useState<{ base64: string; mimeType: string; previewUrl: string } | null>(null);
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [duration, setDuration] = useState(5);
  const [model, setModel] = useState('sora-1.0-turbo');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
  const [videoMetadata, setVideoMetadata] = useState<any>(null);
  
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const loadingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Use the auth context to check authentication status
    console.log('Auth status - isAuthenticated:', isAuthenticated);
    console.log('User:', user);
    console.log('Tokens:', tokens);
    setApiKeyReady(isAuthenticated && !!tokens?.access_token);
  }, [isAuthenticated, user, tokens]);

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
  
  const handleLogin = async () => {
    // Redirect to login or show login modal
    // For now, just refresh the page to re-check auth context
    window.location.reload();
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
      // Get access token from auth context
      if (!tokens?.access_token) {
        throw new Error('Please log in to generate videos');
      }
      
      const accessToken = tokens.access_token;
      console.log('Using access token:', accessToken ? 'Token found' : 'No token');

      // Upload image if provided
      let imageId = null;
      if (image) {
        const formData = new FormData();
        const imageBlob = new Blob([Uint8Array.from(atob(image.base64), c => c.charCodeAt(0))], { type: image.mimeType });
        formData.append('file', imageBlob, 'image.' + image.mimeType.split('/')[1]);
        
        const uploadResponse = await fetch('http://localhost:8000/api/v1/images/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }
        
        const uploadResult = await uploadResponse.json();
        imageId = uploadResult.id;
      }

      // Convert resolution settings to actual dimensions
      let width, height;
      if (resolution === '720p') {
        if (aspectRatio === '16:9') {
          width = 1280;
          height = 720;
        } else { // 9:16
          width = 720;
          height = 1280;
        }
      } else { // 1080p
        if (aspectRatio === '16:9') {
          width = 1920;
          height = 1080;
        } else { // 9:16
          width = 1080;
          height = 1920;
        }
      }

      // Start video generation
      const generateResponse = await fetch('http://localhost:8000/api/v1/videos/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          prompt: prompt,
          duration_seconds: duration,
          resolution_width: width,
          resolution_height: height,
          fps: 24,
          provider: model.includes('sora') ? 'SORA2' : model.includes('wan') ? 'WAN' : 'VEO3',
          image_id: imageId,
          provider_specific_params: {
            model: model
          }
        }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.detail || 'Failed to start video generation');
      }

      const generateResult = await generateResponse.json();
      const videoId = generateResult.id;

      // Poll for completion
      let completed = false;
      let attempts = 0;
      const maxAttempts = 120; // 10 minutes

      while (!completed && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;

        const statusResponse = await fetch(`http://localhost:8000/api/v1/videos/${videoId}/status`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!statusResponse.ok) {
          throw new Error('Failed to check video status');
        }

        const statusResult = await statusResponse.json();
        
        // Update loading message based on progress
        if (statusResult.progress_percentage > 0) {
          const messageIndex = Math.floor((statusResult.progress_percentage / 100) * loadingMessages.length);
          setLoadingMessage(loadingMessages[Math.min(messageIndex, loadingMessages.length - 1)]);
        }

        if (statusResult.status === 'completed') {
          setVideoUrl(statusResult.video_url);
          
          // Show notice if it's a mock video
          if (statusResult.metadata?.mock) {
            console.log('Mock video generated for testing:', statusResult.metadata);
          }
          
          completed = true;
        } else if (statusResult.status === 'failed') {
          throw new Error(statusResult.error_message || 'Video generation failed');
        }
      }

      if (!completed) {
        throw new Error('Video generation timed out. Please try again.');
      }

    } catch (e: any) {
      console.error(e);
      let errorMessage = e.message || 'An unknown error occurred.';
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
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">AI Model</label>
            <select 
              value={model} 
              onChange={(e) => {
                const newModel = e.target.value;
                setModel(newModel);
                
                // Reset duration if it exceeds new model's limit
                let maxDuration = 60; // Default
                if (newModel.includes('sora')) maxDuration = 20;
                else if (newModel.includes('wan')) maxDuration = 30;
                else if (newModel.includes('veo')) maxDuration = 60;
                
                if (duration > maxDuration) {
                  setDuration(Math.min(duration, maxDuration));
                }
              }}
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-400 focus:outline-none"
            >
              <option value="sora-1.0-turbo">OpenAI Sora 1.0 Turbo (High Quality, 20s max)</option>
              <option value="veo-3.1-fast-generate-preview">Google Veo 3.1 Fast (Fast Generation, 60s max)</option>
              <option value="wan-video-v1">WAN AI Video (Affordable, 30s max)</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              {model.includes('sora') 
                ? 'Sora: Superior quality, supports up to 20 seconds' 
                : model.includes('wan')
                ? 'WAN AI: Affordable pricing, supports up to 30 seconds'
                : 'Veo 3: Faster generation, supports up to 60 seconds'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                  <select 
                    value={duration} 
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-purple-400 focus:outline-none"
                  >
                    {[3, 5, 10, 15, 20, 30, 45, 60].map(seconds => {
                      let maxDuration = 60; // Default
                      if (model.includes('sora')) maxDuration = 20;
                      else if (model.includes('wan')) maxDuration = 30;
                      else if (model.includes('veo')) maxDuration = 60;
                      
                      const isAvailable = seconds <= maxDuration;
                      return (
                        <option 
                          key={seconds} 
                          value={seconds}
                          disabled={!isAvailable}
                        >
                          {seconds} seconds {!isAvailable && '(Not supported)'}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Max: {model.includes('sora') ? '20s' : model.includes('wan') ? '30s' : '60s'}
                  </p>
              </div>
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
              <p className="mb-2">Please log in to generate videos.</p>
              <div className="flex gap-2 justify-center">
                <button onClick={handleLogin} className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Log In</button>
                <button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">Refresh Page</button>
              </div>
              <p className="text-xs mt-2">Video generation requires authentication and credits.</p>
            </div>
           )}

          {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-lg border border-red-500">{error}</p>}
          
          <div className="p-3 rounded-lg bg-blue-900/30 border border-blue-500/50 text-blue-200 text-sm">
            <p>Model: <span className="font-semibold">
              {model.includes('sora') ? 'OpenAI Sora' : 
               model.includes('wan') ? 'WAN AI' : 
               'Google Veo 3'}
            </span></p>
            <p className="text-xs opacity-80">
              {duration}s • {image ? 'With image' : 'Text only'} • {resolution} {aspectRatio}
            </p>
            <p className="text-xs opacity-60 mt-1">
              Auth Status: {apiKeyReady ? '✅ Logged in' : '❌ Not logged in'}
            </p>
          </div>
          
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