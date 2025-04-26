"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { IMeeting } from '@/app/models/Meeting';

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

export default function MeetingPage() {
  const params = useParams();
  const [meeting, setMeeting] = useState<IMeeting | null>(null);
  const [copied, setCopied] = useState(false);

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

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Submissions</h2>
              <div className="grid gap-4">
                {meeting?.submissions?.map((submission, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{submission.teamName}</h3>
                        <p className="text-sm text-gray-500">
                          Submitted: {new Date(submission.submittedAt).toLocaleString()}
                        </p>
                        <a 
                          href={submission.pdfUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View Submission
                        </a>
                      </div>
                    </div>
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
