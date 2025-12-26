import React, { useState, useEffect } from 'react';
import { Tool } from '../types';

interface VideoGeneratorProps {
  tool: Tool;
  initialPrompt: string;
  onBack: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ tool, initialPrompt, onBack }) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [model, setModel] = useState('veo-3.1-fast-generate-preview');
  const [selectedDuration, setSelectedDuration] = useState(5);
  const [selectedResolution, setSelectedResolution] = useState({ width: 1280, height: 720 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError('');
    setVideoUrl(null);
    
    try {
      const token = localStorage.getItem('token');
      console.log('Sending request to backend...');
      console.log('Token present:', !!token);
      console.log('Token preview:', token?.substring(0, 20) + '...');
      
      const response = await fetch(`${API_BASE_URL}/videos/generate-public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No auth needed for public endpoint
        },
        body: JSON.stringify({
          prompt,
          model,
          duration: selectedDuration,
          resolution: `${selectedResolution.width}x${selectedResolution.height}`,
          provider: 'VEO3',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to start video generation');
      }

      const result = await response.json();
      const videoId = result.id;  // Backend returns 'id', not 'video_id'
      console.log('Video generation started, ID:', videoId);
      console.log('Full API response:', result);
      
      if (!videoId) {
        console.error('No video ID found in response:', result);
        throw new Error('Server did not return a valid video ID');
      }

      // Poll for completion
      let completed = false;
      const maxAttempts = 60; // 10 minutes with 10-second intervals
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        console.log(`Polling attempt ${attempt + 1}/${maxAttempts}...`);

        const statusResponse = await fetch(`${API_BASE_URL}/videos/${videoId}/status-public`, {
          headers: {
            // No auth needed for public endpoint
          },
        });

        if (!statusResponse.ok) {
          console.error('Status check failed:', statusResponse.status, statusResponse.statusText);
          const errorText = await statusResponse.text();
          console.error('Status error details:', errorText);
          throw new Error(`Failed to check video status: ${statusResponse.status} ${statusResponse.statusText}`);
        }

        const statusResult = await statusResponse.json();
        console.log('Status result:', statusResult);
        
        if (statusResult.status === 'completed' && statusResult.video_url) {
          setVideoUrl(statusResult.video_url);
          console.log('Video generation completed!');
          completed = true;
          break;
        } else if (statusResult.status === 'failed') {
          throw new Error(statusResult.error_message || 'Video generation failed');
        }
      }

      if (!completed) {
        throw new Error('Video generation timed out. Please try again.');
      }

    } catch (e: any) {
      console.error('Generation error:', e);
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 animate-fade-in-scale">
      <button onClick={onBack} className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors mb-4">
        ← Back to Dashboard
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">{tool.name}</h2>
        <p className="text-gray-300">{tool.description}</p>
        <p className="text-sm text-purple-300 mt-2">Using Backend: Python + Google AI SDK</p>
      </div>

      {!videoUrl && (
        <div className="space-y-4">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
              Video Description
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the video you want to create..."
              className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="veo-3.1-fast-generate-preview">VEO 3.1 Fast</option>
                <option value="veo-3.1-generate-preview">VEO 3.1</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Duration (seconds)</label>
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(Number(e.target.value))}
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
              >
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Quality</label>
              <select
                value={`${selectedResolution.width}x${selectedResolution.height}`}
                onChange={(e) => {
                  const [width, height] = e.target.value.split('x').map(Number);
                  setSelectedResolution({ width, height });
                }}
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="1280x720">HD (720p)</option>
                <option value="1920x1080">Full HD (1080p)</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-500/20 border border-red-500 text-red-200">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-cyan-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isGenerating ? 'Generating Video...' : 'Generate Video (Backend)'}
          </button>
        </div>
      )}

      {isGenerating && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Generating your video...</p>
          <p className="text-gray-400 text-sm mt-2">This may take a few minutes</p>
        </div>
      )}

      {videoUrl && (
        <div className="text-center py-8">
          <h3 className="text-xl font-semibold text-white mb-4">Your Video is Ready!</h3>
          <video 
            src={videoUrl} 
            controls 
            className="w-full max-w-md mx-auto rounded-lg"
            autoPlay
          />
          <button
            onClick={() => {
              setVideoUrl(null);
              setPrompt('');
              setError('');
            }}
            className="mt-6 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Generate Another Video
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoGenerator;