"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Presentation {
  id: string;
  status: 'pending' | 'recording' | 'completed';
  transcript?: string;
  analysis?: {
    pros: string[];
    cons: string[];
    suggestedQuestions: string[];
  };
}

export default function MeetingPage() {
  const params = useParams();
  const [recording, setRecording] = useState(false);
  const [currentPresentation, setCurrentPresentation] = useState<Presentation | null>(null);
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        // TODO: Implement actual transcription service
        const mockTranscript = "This is a mock transcript of the presentation.";
        
        // Analyze the presentation
        const response = await fetch('/api/presentations/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: mockTranscript })
        });
        
        const { analysis } = await response.json();
        
        if (currentPresentation) {
          const updatedPresentation = {
            ...currentPresentation,
            status: 'completed' as const,
            transcript: mockTranscript,
            analysis
          };
          
          setPresentations(prev => 
            prev.map(p => p.id === currentPresentation.id ? updatedPresentation : p)
          );
          setCurrentPresentation(null);
        }
      };

      setMediaRecorder(recorder);
      recorder.start();
      setRecording(true);
      
      // Create new presentation
      const newPresentation: Presentation = {
        id: Date.now().toString(),
        status: 'recording'
      };
      setCurrentPresentation(newPresentation);
      setPresentations(prev => [...prev, newPresentation]);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Meeting #{params.id}</h1>
          {!recording && !currentPresentation && (
            <button
              onClick={startRecording}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Start New Presentation
            </button>
          )}
          {recording && (
            <button
              onClick={stopRecording}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Stop Recording
            </button>
          )}
        </div>

        <div className="space-y-6">
          {presentations.map((presentation) => (
            <div key={presentation.id} className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">
                Presentation #{presentation.id}
              </h3>
              <div className="text-sm text-gray-500 mb-2">
                Status: {presentation.status}
              </div>
              {presentation.analysis && (
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="font-medium text-green-600">Pros:</h4>
                    <ul className="list-disc pl-5">
                      {presentation.analysis.pros.map((pro, i) => (
                        <li key={i}>{pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-600">Cons:</h4>
                    <ul className="list-disc pl-5">
                      {presentation.analysis.cons.map((con, i) => (
                        <li key={i}>{con}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-600">Suggested Questions:</h4>
                    <ul className="list-disc pl-5">
                      {presentation.analysis.suggestedQuestions.map((question, i) => (
                        <li key={i}>{question}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
