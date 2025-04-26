"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { IMeeting } from "@/app/models/Meeting";
import { LoaderIcon, toast } from "react-hot-toast";


export default function MeetingPage() {
  const params = useParams();
  const [meeting, setMeeting] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState(-1);
  const [expandedSubmissions, setExpandedSubmissions] = useState<{
    [key: string]: boolean;
  }>({});
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const [transcriptParts, setTranscriptParts] = useState<string[]>([]);
  const [finalTranscript, setFinalTranscript] = useState<string>("");

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const response = await fetch(`/api/meetings/${params.id}`);
        const data = await response.json();
        setMeeting(data?.meeting);
      } catch (error) {
        console.error("Error fetching meeting:", error);
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
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        throw new Error("Speech recognition not supported in this browser");
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            setTranscriptParts((prev) => [...prev, result[0].transcript]);
            setFinalTranscript((prev) => prev + " " + result[0].transcript);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        toast.error("Speech recognition error: " + event.error);
      };

      recognition.start();
      setIsRecording(true);
      setTranscriptParts([]); // Reset transcript parts
      setFinalTranscript(""); // Reset final transcript
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording");
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

      toast.loading("Analyzing presentation...");

      try {
        // Analyze the transcript
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: finalTranscript,
            meetingId: meeting?._id,
            submissionId: meeting?.submissions[currentSubmissionIndex]?._id,
          }),
        });

        if (!response.ok) throw new Error("Analysis failed");

        const { updatedMeeting } = await response.json();

        toast.dismiss();
        setMeeting(updatedMeeting);
        setFinalTranscript(""); // Reset transcript for next presentation
        // Move to next submission if available
        if (currentSubmissionIndex < (meeting?.submissions.length || 0) - 1) {
          setCurrentSubmissionIndex((prev) => prev + 1);
        } else {
          endPresentation();
          // Check if this was the last presentation
          if (checkAllPresentationsComplete()) {
            // Update meeting status to analyzed
            const updateResponse = await fetch(`/api/meetings/${params.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ status: "presented" }),
            });

            if (updateResponse.ok) {
              const updatedMeeting = await updateResponse.json();
              setMeeting(updatedMeeting.meeting);
            }
          }

          toast.success("Analysis complete!");
        }
      } catch (error) {
        console.error("Error analyzing presentation:", error);
        toast.error("Failed to analyze presentation");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {meeting && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">{meeting.title}</h1>
                  <p className="text-gray-600 text-lg max-w-2xl">{meeting.agenda}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={copySubmissionLink}
                    className="bg-white border-2 border-blue-600 text-blue-600 px-6 py-2.5 rounded-lg hover:bg-blue-50 flex items-center gap-2 transition-all duration-200 font-medium"
                    title="Share this link with teams to submit their projects"
                  >
                    {copied ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Link Copied!
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                        Share Submission Link
                      </>
                    )}
                  </button>
                </div>
              </div>

              {!isPresentationMode && meeting.submissions?.length > 0 && (
                <button
                  onClick={
                    meeting.status === "presented"
                      ? () => (window.location.href = `/evaluate/${params.id}`)
                      : startPresentation
                  }
                  className={`${
                    meeting.status === "presented"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-green-600 hover:bg-green-700"
                  } text-white px-8 py-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-3 text-lg font-medium w-full justify-center`}
                >
                  {meeting.status === "presented" ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Start Project Evaluation
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Start Presentations
                    </>
                  )}
                </button>
              )}
            </div>

            {isPresentationMode && (
              <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-8 mb-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
                      <h3 className="text-2xl font-semibold text-gray-900">
                        Now Presenting: {meeting.submissions[currentSubmissionIndex].teamName}
                      </h3>
                    </div>
                    <p className="text-blue-600 font-medium">
                      Presentation {currentSubmissionIndex + 1} of {meeting.submissions.length}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 font-medium"
                        title="Start recording the presentation"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                        </svg>
                        Begin Recording
                      </button>
                    ) : (
                      <button
                        onClick={stopRecording}
                        className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 font-medium"
                        title="Stop recording and analyze the presentation"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                        </svg>
                        End Recording
                      </button>
                    )}
                    <button
                      onClick={endPresentation}
                      className="border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 font-medium"
                      title="Exit presentation mode"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Exit
                    </button>
                  </div>
                </div>
                {isRecording && finalTranscript && (
                  <div className="mt-6 bg-gray-50 rounded-lg border border-gray-200 p-6">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
                      </svg>
                      Live Transcript
                    </h4>
                    <p className="text-gray-700 leading-relaxed">{finalTranscript}</p>
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Project Submissions</h2>
              <div className="grid gap-6">
                {meeting?.submissions?.map((submission: any, index: any) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-6 transition-all duration-200 hover:shadow-md bg-white"
                  >
                    <div
                      onClick={() =>
                        setExpandedSubmissions((prev) => ({
                          ...prev,
                          [submission._id]: !prev[submission._id],
                        }))
                      }
                      className="flex justify-between items-center cursor-pointer"
                    >
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {submission.teamName}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Submitted: {new Date(submission.submittedAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        className="text-gray-600 hover:text-gray-900 transition-all duration-200 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50"
                        
                      >
                        <svg style={{
                          transform: expandedSubmissions[submission._id]
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                        }} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        {expandedSubmissions[submission._id] ? "Hide Details" : "View Project Details"}
                      </button>
                    </div>

                    <div
                      className={`mt-4 space-y-4 transition-all duration-200 overflow-hidden ${
                        expandedSubmissions[submission._id]
                          ? "max-h-[1000px] opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      

                      {submission.submissionInfo && (
                        <div className="space-y-3 p-4 bg-gray-50 rounded-md">
                          {submission.submissionInfo.ideaName && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700">
                                Idea Name:
                              </h4>
                              <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
                                {submission.submissionInfo.ideaName} <LoaderIcon className="animate-spin" />
                              </p>
                            </div>
                          )}

                          <div className="prose max-w-none">
                            {submission.submissionInfo.docSummary ? (
                              <div className="bg-gray-50 p-6 rounded-md overflow-auto max-h-[500px]">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">
                                  {submission.submissionInfo.docSummary
                                    .projectTitle || "Project Summary"}
                                </h3>

                                {submission.submissionInfo.docSummary
                                  .projectTitle && (
                                  <div className="mb-4">
                                    <h4 className="text-md font-semibold text-gray-800">
                                      Project Title
                                    </h4>
                                    <p className="text-gray-700">
                                      {
                                        submission.submissionInfo.docSummary
                                          .projectTitle
                                      }
                                    </p>
                                  </div>
                                )}

                                {submission.submissionInfo.docSummary
                                  .problemStatement && (
                                  <div className="mb-4">
                                    <h4 className="text-md font-semibold text-gray-800">
                                      Problem Statement
                                    </h4>
                                    <p className="text-gray-700">
                                      {
                                        submission.submissionInfo.docSummary
                                          .problemStatement
                                      }
                                    </p>
                                  </div>
                                )}

                                {submission.submissionInfo.docSummary
                                  .projectSummary && (
                                  <div className="mb-4">
                                    <h4 className="text-md font-semibold text-gray-800">
                                      Project Summary
                                    </h4>
                                    <p className="text-gray-700">
                                      {
                                        submission.submissionInfo.docSummary
                                          .projectSummary
                                      }
                                    </p>
                                  </div>
                                )}

                                {submission.submissionInfo.docSummary
                                  .keyFeatures &&
                                  Array.isArray(
                                    submission.submissionInfo.docSummary
                                      .keyFeatures
                                  ) &&
                                  submission.submissionInfo.docSummary
                                    .keyFeatures.length > 0 && (
                                    <div className="mb-4">
                                      <h4 className="text-md font-semibold text-gray-800">
                                        Key Features
                                      </h4>
                                      <ul className="list-disc pl-5">
                                        {submission.submissionInfo.docSummary.keyFeatures.map(
                                          (feature: any, index: any) => (
                                            <li
                                              key={index}
                                              className="text-gray-700"
                                            >
                                              {feature}
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  )}

                                {submission.submissionInfo.docSummary
                                  .technicalStack && (
                                  <div className="mb-4">
                                    <h4 className="text-md font-semibold text-gray-800">
                                      Technical Stack
                                    </h4>
                                    {Array.isArray(
                                      submission.submissionInfo.docSummary
                                        .technicalStack
                                    ) ? (
                                      <ul className="list-disc pl-5">
                                        {submission.submissionInfo.docSummary.technicalStack.map(
                                          (tech: any, index: any) => (
                                            <li
                                              key={index}
                                              className="text-gray-700"
                                            >
                                              {tech}
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    ) : (
                                      <p className="text-gray-700">
                                        {
                                          submission.submissionInfo.docSummary
                                            .technicalStack
                                        }
                                      </p>
                                    )}
                                  </div>
                                )}

                                {submission.submissionInfo.docSummary
                                  .targetAudience && (
                                  <div className="mb-4">
                                    <h4 className="text-md font-semibold text-gray-800">
                                      Target Audience
                                    </h4>
                                    <p className="text-gray-700">
                                      {
                                        submission.submissionInfo.docSummary
                                          .targetAudience
                                      }
                                    </p>
                                  </div>
                                )}

                                {submission.submissionInfo.docSummary
                                  .innovationAspects && (
                                  <div className="mb-4">
                                    <h4 className="text-md font-semibold text-gray-800">
                                      Innovation Aspects
                                    </h4>
                                    <p className="text-gray-700">
                                      {
                                        submission.submissionInfo.docSummary
                                          .innovationAspects
                                      }
                                    </p>
                                  </div>
                                )}

                                {submission.submissionInfo.docSummary
                                  .potentialImpact && (
                                  <div className="mb-4">
                                    <h4 className="text-md font-semibold text-gray-800">
                                      Potential Impact
                                    </h4>
                                    <p className="text-gray-700">
                                      {
                                        submission.submissionInfo.docSummary
                                          .potentialImpact
                                      }
                                    </p>
                                  </div>
                                )}

                                {submission.submissionInfo.docSummary
                                  .rawSummary && (
                                  <div className="mt-6 pt-4 border-t border-gray-200">
                                    <p className="text-gray-500 text-sm italic">
                                      {
                                        submission.submissionInfo.docSummary
                                          .rawSummary
                                      }
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <p className="text-gray-500 flex items-center justify-center gap-2">
                                 We're generating a summary for this project. Please check back soon! <LoaderIcon className="animate-spin" />
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {meeting?.analysis?.[submission._id] && (
                      <div className="mt-6 border-t border-gray-100 pt-4">
                        <button
                          onClick={() =>
                            setExpandedSubmissions((prev) => ({
                              ...prev,
                              [`${submission._id}_analysis`]: !prev[`${submission._id}_analysis`],
                            }))
                          }
                          className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium text-gray-900">Presentation Analysis</span>
                          </div>
                          <svg
                            style={{
                              transform: expandedSubmissions[`${submission._id}_analysis`]
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                            }}
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-500 transition-transform duration-200"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <div
                          className={`overflow-hidden transition-all duration-200 ${
                            expandedSubmissions[`${submission._id}_analysis`]
                              ? "max-h-[1000px] opacity-100 mt-4"
                              : "max-h-0 opacity-0"
                          }`}
                        >
                          <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                            <div>
                              <h5 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Strengths
                              </h5>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {meeting?.analysis?.[submission._id]?.pros.map(
                                  (pro: string, i: number) => (
                                    <li key={i} className="text-gray-700">{pro}</li>
                                  )
                                )}
                              </ul>
                            </div>

                            <div>
                              <h5 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm0 6a1 1 0 10-2 0 1 1 0 102 0z" clipRule="evenodd" />
                                </svg>
                                Areas for Improvement
                              </h5>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {meeting?.analysis?.[submission._id]?.cons.map(
                                  (con: string, i: number) => (
                                    <li key={i} className="text-gray-700">{con}</li>
                                  )
                                )}
                              </ul>
                            </div>

                            <div>
                              <h5 className="text-sm font-medium text-blue-600 mb-2 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                                Suggested Questions
                              </h5>
                              <ul className="list-disc list-inside text-sm space-y-1">
                                {meeting?.analysis?.[
                                  submission._id
                                ]?.suggestedQuestions.map(
                                  (q: string, i: number) => (
                                    <li key={i} className="text-gray-700">{q}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          </div>
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
