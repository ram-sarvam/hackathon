"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { IMeeting } from '@/app/models/Meeting';
import { toast } from 'react-hot-toast';
import { SpeechRecognition } from '@/app/types/speech';

interface Presentation {
  id: string;
  teamName: string;
  status: 'pending' | 'recording' | 'completed';
  transcript?: string;
  analysis?: {
    pros: string[];
    cons: string[];
    suggestedQuestions: string[];
  };
}

interface SubmissionWithAnalysis {
  teamName: string;
  pdfUrl: string;
  submittedAt: Date;
  submissionInfo?: {
    analysis?: {
      pros: string[];
      cons: string[];
      suggestedQuestions: string[];
    };
    transcript?: string;
  };
}

export default function MeetingPage() {
  const params = useParams();
  const [meeting, setMeeting] = useState<IMeeting | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState(-1);
  const [expandedSubmissions, setExpandedSubmissions] = useState<{[key: string]: boolean}>({});
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [transcriptParts, setTranscriptParts] = useState<string[]>([]);
  const [finalTranscript, setFinalTranscript] = useState<string>("");

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const response = await fetch(`/api/meetings/${params.id}`);
        const data = await response.json();
        setMeeting(data?.meeting);
      } catch (error) {
        console.error('Error fetching meeting:', error);
      }
    };
    fetchMeeting();
  }, [params.id]);

  const copySubmissionLink = () => {
    const submissionLink = `${window.location.origin}/submit/${params.id}`;
    navigator.clipboard.writeText(submissionLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startPresentation = () => {
    setIsPresentationMode(true);
    setCurrentSubmissionIndex(0);
  };

  const endPresentation = () => {
    setIsPresentationMode(false);
    setCurrentSubmissionIndex(-1);
    setIsRecording(false);
  };

  const startRecording = async () => {
    try {
      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error('Speech recognition not supported in this browser');
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            setTranscriptParts(prev => [...prev, result[0].transcript]);
            setFinalTranscript(prev => prev + ' ' + result[0].transcript);
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionEvent) => {
        console.error('Speech recognition error:', event.error);
        toast.error('Speech recognition error: ' + event.error);
      };

      recognition.start();
      setIsRecording(true);
      setTranscriptParts([]); // Reset transcript parts
      setFinalTranscript(''); // Reset final transcript
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  };

  const checkAllPresentationsComplete = () => {
    if (!meeting?.submissions) return false;
    return currentSubmissionIndex === meeting.submissions.length - 1;
  };

  const stopRecording = async () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);

      toast.loading('Analyzing presentation...');

      try {
        // Analyze the transcript
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: finalTranscript, meetingId: meeting?._id, submissionId: meeting?.submissions[currentSubmissionIndex]?._id })
        });

        if (!response.ok) throw new Error('Analysis failed');
        
        const { updatedMeeting } = await response.json();

        
        toast.dismiss();
        setMeeting(updatedMeeting);
        setFinalTranscript(''); // Reset transcript for next presentation
        // Move to next submission if available
        if (currentSubmissionIndex < (meeting?.submissions.length || 0) - 1) {
          setCurrentSubmissionIndex(prev => prev + 1);
        } else {
          endPresentation();
          // Check if this was the last presentation
          if (checkAllPresentationsComplete()) {
            // Update meeting status to analyzed
            const updateResponse = await fetch(`/api/meetings/${params.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ status: 'presented' }),
            });

            if (updateResponse.ok) {
              const updatedMeeting = await updateResponse.json();
              setMeeting(updatedMeeting.meeting);
            }
          }

          toast.success('Analysis complete!');
        }
      } catch (error) {
        console.error('Error analyzing presentation:', error);
        toast.error('Failed to analyze presentation');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        {meeting && (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold">{meeting.title}</h1>
                <p className="text-gray-600 mt-1">{meeting.agenda}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copySubmissionLink}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  {copied ? 'Copied!' : 'Copy Submission Link'}
                </button>
              </div>
            </div>

            {!isPresentationMode && meeting.submissions?.length > 0 && (
              <button
                onClick={meeting.status === 'presented' ? () => window.location.href = `/evaluate/${params.id}` : startPresentation}
                className={`${meeting.status === 'presented' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'} text-white px-4 py-2 rounded transition-colors`}
              >
                {meeting.status === 'presented' ? 'Begin Evaluation' : 'Begin Presentation Mode'}
              </button>
            )}

            {isPresentationMode && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Presenting: {meeting.submissions[currentSubmissionIndex].teamName}
                  </h3>
                  <div className="flex gap-2">
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                      >
                        Start Recording
                      </button>
                    ) : (
                      <button
                        onClick={stopRecording}
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                      >
                        Stop Recording
                      </button>
                    )}
                    <button
                      onClick={endPresentation}
                      className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                    >
                      End Presentation Mode
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    Presentation {currentSubmissionIndex + 1} of {meeting.submissions.length}
                  </div>
                  {isRecording && finalTranscript && (
                    <div className="p-3 bg-white rounded border text-sm">
                      <h4 className="font-medium mb-1">Live Transcript:</h4>
                      <p className="text-gray-600">{finalTranscript}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Submissions</h2>
              <div className="grid gap-4">
                {meeting?.submissions?.map((submission, index) => (
                  <div key={index} className="border rounded-lg p-4 transition-all duration-200 hover:shadow-md">
                    <div 
                      onClick={() => setExpandedSubmissions(prev => ({
                        ...prev,
                        [submission._id]: !prev[submission._id]
                      }))}
                      className="flex justify-between items-center cursor-pointer"
                    >
                      <div>
                        <h3 className="text-lg font-semibold">{submission.teamName}</h3>
                        <p className="text-sm text-gray-500">
                          Submitted: {new Date(submission.submittedAt).toLocaleString()}
                        </p>
                      </div>
                      <button 
                        className="text-gray-500 hover:text-gray-700 transition-transform duration-200"
                        style={{ transform: expandedSubmissions[submission._id] ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      >
                        ▼
                      </button>
                    </div>

                    <div className={`mt-4 space-y-4 transition-all duration-200 overflow-hidden ${expandedSubmissions[submission._id] ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      <div className="flex gap-4 items-center">
                        <a 
                          href={submission.pdfUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          View Submission
                        </a>
                      </div>

                      {submission.submissionInfo && (
                        <div className="space-y-3 p-4 bg-gray-50 rounded-md">
                          {submission.submissionInfo.ideaName && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700">Idea Name:</h4>
                              <p className="text-sm text-gray-600">{submission.submissionInfo.ideaName}</p>
                            </div>
                          )}
                          {submission.submissionInfo.docSummary && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700">Summary:</h4>
                              <p className="text-sm text-gray-600">{JSON.stringify(submission.submissionInfo.docSummary)}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {meeting?.analysis?.[submission._id] && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-md">
                        <h4 className="font-semibold mb-2">Presentation Analysis</h4>
                        
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-green-600">Pros:</h5>
                          <ul className="list-disc list-inside text-sm">
                            {meeting?.analysis?.[submission._id]?.pros.map((pro: string, i: number) => (
                              <li key={i}>{pro}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-red-600">Areas for Improvement:</h5>
                          <ul className="list-disc list-inside text-sm">
                            {meeting?.analysis?.[submission._id]?.cons.map((con: string, i: number) => (
                              <li key={i}>{con}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-blue-600">Suggested Questions:</h5>
                          <ul className="list-disc list-inside text-sm">
                            {meeting?.analysis?.[submission._id]?.suggestedQuestions.map((q: string, i: number) => (
                              <li key={i}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
