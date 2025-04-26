"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { IMeeting } from '@/app/models/Meeting';
import { toast } from 'react-hot-toast';

interface EvaluatedSubmission {
  teamName: string;
  score: number;
  feedback: string;
}

export default function EvaluatePage() {
  const params = useParams();
  const [meeting, setMeeting] = useState<IMeeting | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluatedSubmissions, setEvaluatedSubmissions] = useState<EvaluatedSubmission[]>([]);

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
        setEvaluatedSubmissions(data.evaluations);
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

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">{meeting.title} - Evaluation</h1>
      
      {evaluating ? (
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="text-lg">Evaluating submissions...</p>
        </div>
      ) : evaluatedSubmissions.length > 0 ? (
        <div className="space-y-8">
          <h2 className="text-2xl font-semibold mb-4">Leaderboard</h2>
          <div className="grid gap-6">
            {evaluatedSubmissions
              .sort((a, b) => b.score - a.score)
              .map((submission, index) => (
                <div 
                  key={submission.teamName}
                  className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <span className={`text-2xl font-bold ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-500' : index === 2 ? 'text-amber-700' : 'text-gray-700'}`}>
                        #{index + 1}
                      </span>
                      <h3 className="text-xl font-semibold">{submission.teamName}</h3>
                    </div>
                    <div className="text-2xl font-bold text-indigo-600">
                      {submission.score} points
                    </div>
                  </div>
                  <p className="text-gray-600 whitespace-pre-line">{submission.feedback}</p>
                </div>
              ))}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-600">
          No evaluations available
        </div>
      )}
    </div>
  );
}
