import React, { useState, useRef } from 'react';

const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const StopIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M6 6h12v12H6z" />
    </svg>
);

const KeyboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8m-4-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

interface RequestInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  audioUrl: string | null;
  setAudioUrl: (url: string | null) => void;
  onAuthRequired?: () => void;
  isAuthenticated?: boolean;
}

const RequestInput: React.FC<RequestInputProps> = ({ 
  prompt, 
  setPrompt, 
  audioUrl, 
  setAudioUrl, 
  onAuthRequired,
  isAuthenticated = false 
}) => {
  const [mode, setMode] = useState<'text' | 'audio'>('text');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleStartRecording = async () => {
    if (!isAuthenticated) {
      onAuthRequired?.();
      return;
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };
        mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);
            setPrompt('Audio recorded. Click a tool to proceed.');
            audioChunksRef.current = [];
            stream.getTracks().forEach(track => track.stop());
        };
        audioChunksRef.current = [];
        mediaRecorderRef.current.start();
        setIsRecording(true);
        setAudioUrl(null);
        setPrompt('');
    } catch (err) {
        console.error("Error accessing microphone:", err);
        setPrompt("Microphone access was denied. Please allow access in your browser settings to record audio.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };

  const handleModeToggle = (newMode: 'text' | 'audio') => {
    if (isRecording) handleStopRecording();
    setMode(newMode);
    setPrompt('');
    setAudioUrl(null);
  }

  return (
    <div className="w-full max-w-4xl mx-auto mb-12 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
      <div className="flex items-center mb-4">
        <button 
          onClick={() => handleModeToggle('text')} 
          aria-label="Switch to text input"
          className={`p-3 rounded-l-lg transition-colors duration-200 ${mode === 'text' ? 'bg-purple-600/80 text-white' : 'bg-white/10 text-purple-200 hover:bg-white/20'}`}
        >
          <KeyboardIcon />
        </button>
        <button 
          onClick={() => handleModeToggle('audio')}
          aria-label="Switch to audio input"
          className={`p-3 rounded-r-lg transition-colors duration-200 ${mode === 'audio' ? 'bg-purple-600/80 text-white' : 'bg-white/10 text-purple-200 hover:bg-white/20'}`}
        >
          <MicIcon />
        </button>
      </div>
      
      {mode === 'text' ? (
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={isAuthenticated ? "Describe the video you want to create..." : "Sign in to start creating videos..."}
          className="w-full h-24 p-4 bg-black/20 rounded-lg text-white placeholder-gray-400 border border-transparent focus:border-purple-400 focus:ring-0 focus:outline-none transition-colors"
          aria-label="Text prompt input"
          disabled={!isAuthenticated}
          onClick={!isAuthenticated ? onAuthRequired : undefined}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-24 p-4 bg-black/20 rounded-lg">
          {audioUrl ? (
            <div className='flex flex-col items-center gap-2'>
              <p className="text-green-400">Audio ready!</p>
              <audio src={audioUrl} controls className="h-8" />
            </div>
          ) : (
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              className={`flex items-center justify-center w-16 h-16 rounded-full transition-all duration-300 text-white ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-purple-600 hover:bg-purple-500'}`}
            >
              {isRecording ? <StopIcon /> : <MicIcon />}
            </button>
          )}
          {!audioUrl && <p className="mt-2 text-sm text-gray-400" aria-live="polite">{isRecording ? "Recording... Click to stop." : "Click to record audio"}</p>}
        </div>
      )}
    </div>
  );
};

export default RequestInput;