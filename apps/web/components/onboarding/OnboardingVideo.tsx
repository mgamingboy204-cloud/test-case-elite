'use client';

import { useState, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { setOnboardingData } from '@/lib/storage';

interface OnboardingVideoProps {
  onNext: () => void;
  onBack: () => void;
}

export default function OnboardingVideo({ onNext, onBack }: OnboardingVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: true 
      });
      streamRef.current = stream;
      videoRef.current!.srcObject = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setRecordedChunks([blob]);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordedChunks([]);
    } catch (err: any) {
      setError(err.message || 'Could not access camera');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(track => track.stop());
    setIsRecording(false);
  };

  const handleVerify = async () => {
    if (recordedChunks.length === 0) {
      setError('Please record a video first');
      return;
    }

    setIsVerifying(true);
    setError('');
    try {
      // Create FormData to upload video
      const formData = new FormData();
      formData.append('video', recordedChunks[0], 'verification-video.webm');

      // Mock upload - in production, this would upload to storage
      const videoUrl = URL.createObjectURL(recordedChunks[0]);
      await apiClient.verifyVideo(videoUrl);

      setOnboardingData({ videoUrl });
      onNext();
    } catch (err: any) {
      setError(err.message || 'Failed to verify video');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <button
          onClick={onBack}
          className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] transition-colors"
        >
          ← Back
        </button>
        <h2 className="text-3xl font-serif font-bold text-[var(--text-primary)]">
          Record a Video
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Record a 15-30 second intro video to be verified
        </p>
      </div>

      <div className="space-y-4">
        {/* Video preview */}
        <div className="relative w-full aspect-square bg-[var(--bg-secondary)] rounded-lg overflow-hidden border border-[var(--border-color)]">
          {recordedChunks.length > 0 ? (
            <video
              src={URL.createObjectURL(recordedChunks[0])}
              className="w-full h-full object-cover"
              controls
            />
          ) : (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
            />
          )}
        </div>

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        {/* Controls */}
        <div className="space-y-2">
          {recordedChunks.length === 0 ? (
            <>
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="w-full py-3 px-4 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-lg font-semibold transition-all duration-200 hover:opacity-90 active:scale-98"
                >
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="w-full py-3 px-4 bg-red-600 text-white rounded-lg font-semibold transition-all duration-200 hover:opacity-90 active:scale-98"
                >
                  Stop Recording
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className="w-full py-3 px-4 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded-lg font-semibold transition-all duration-200 hover:opacity-90 active:scale-98 disabled:opacity-50"
            >
              {isVerifying ? 'Verifying...' : 'Continue'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
