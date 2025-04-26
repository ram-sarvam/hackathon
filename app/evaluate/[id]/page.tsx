"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { IMeeting } from '@/app/models/Meeting';
import { toast, Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface EvaluatedSubmission {
  teamName: string;
  score: number;
  feedback: string;
  isPresenting?: boolean;
}




export default function EvaluatePage() {
  const params = useParams();
  const [meeting, setMeeting] = useState<IMeeting | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluatedSubmissions, setEvaluatedSubmissions] = useState<EvaluatedSubmission[]>([]);
  const [currentPresenter, setCurrentPresenter] = useState<string | null>(null);

  useEffect(() => {
    fetchMeeting();
  }, []);

  const fetchMeeting = async () => {
    try {
      const response = await fetch(`/api/meetings/${params.id}`);
      const data = await response.json();
      if (data.success) {
        setMeeting(data.meeting);
        evaluateSubmissions(data.meeting);
      } else {
        toast.error('Failed to fetch meeting');
      }
    } catch (error) {
      console.error('Error fetching meeting:', error);
      toast.error('Failed to fetch meeting');
    }
  };

  const evaluateSubmissions = async (meetingData: IMeeting) => {
    if (!meetingData.submissions || meetingData.submissions.length === 0) {
      toast.error('No submissions to evaluate');
      return;
    }

    setEvaluating(true);

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId: params.id,
          submissions: meetingData.submissions,
          analysis: meetingData.analysis
        }),
      });

      const data = await response.json();
      if (data.success) {
        setEvaluatedSubmissions(data.evaluations.map((evaluation: EvaluatedSubmission) => ({
          ...evaluation,
          isPresenting: false
        })));
      } else {
        toast.error('Failed to evaluate submissions');
      }
    } catch (error) {
      console.error('Error evaluating submissions:', error);
      toast.error('Failed to evaluate submissions');
    } finally {
      setEvaluating(false);
    }
  };

  const handlePresenterChange = (teamName: string) => {
    setEvaluatedSubmissions(prev => prev.map(submission => ({
      ...submission,
      isPresenting: submission.teamName === teamName
    })));
    
    if (currentPresenter !== teamName) {
      setCurrentPresenter(teamName);
      toast.success(`${teamName} is now presenting!`, {
        icon: '🎤',
        duration: 3000
      });
    }
  };

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
          <p className="text-gray-600 font-medium">Loading meeting details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '10px',
          },
        }} 
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{meeting.title}</h1>
            <div className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
              Evaluation
            </div>
          </div>
          <p className="text-gray-600">{meeting.agenda}</p>
        </div>
        
        {evaluating ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 space-y-4"
          >
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
            <p className="text-xl font-medium text-gray-900">Evaluating submissions...</p>
            <p className="text-gray-600">This may take a few moments</p>
          </motion.div>
        ) : evaluatedSubmissions.length > 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Presentations & Evaluations</h2>
              <div className="flex items-center gap-2 text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{evaluatedSubmissions.length} Submissions</span>
              </div>
            </div>
            
            <div className="grid gap-6">
              {evaluatedSubmissions
                .sort((a, b) => b.score - a.score)
                .map((submission, index) => (
                  <motion.div
                    key={submission.teamName}
                    className={`bg-white rounded-xl shadow-sm border transition-all duration-300 p-6 
                      ${submission.isPresenting 
                        ? 'border-indigo-500 ring-2 ring-indigo-500 ring-opacity-50' 
                        : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold
                          ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                            index === 1 ? 'bg-gray-100 text-gray-700' : 
                            index === 2 ? 'bg-amber-100 text-amber-700' : 
                            'bg-gray-50 text-gray-500'}`}
                        >
                          #{index + 1}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{submission.teamName}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  xmlns="http://www.w3.org/2000/svg"
                                  className={`h-5 w-5 ${i < Math.round(submission.score / 20) ? 'text-yellow-400' : 'text-gray-300'}`}
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">({submission.score} points)</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handlePresenterChange(submission.teamName)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                            ${submission.isPresenting 
                              ? 'bg-indigo-100 text-indigo-700' 
                              : 'bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'}`}
                        >
                          {submission.isPresenting ? 'Currently Presenting' : 'Set as Presenter'}
                        </button>
                        <div className={`px-4 py-2 rounded-full text-sm font-medium
                          ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                            index === 1 ? 'bg-gray-100 text-gray-700' : 
                            index === 2 ? 'bg-amber-100 text-amber-700' : 
                            'bg-gray-50 text-gray-600'}`}
                        >
                          {index === 0 ? 'Gold' : 
                           index === 1 ? 'Silver' : 
                           index === 2 ? 'Bronze' : 
                           `Rank #${index + 1}`}
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Feedback</h4>
                      <p className="text-gray-600 whitespace-pre-line">{submission.feedback}</p>
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Evaluations Available</h3>
            <p className="text-gray-600">There are no submissions to evaluate at this time.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
