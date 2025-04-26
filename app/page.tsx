"use client";

import { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useStore } from "@/app/store/use-store";
import { IMeeting } from "./models/Meeting";
import Link from "next/link";

const Home = () => {
  const { userId } = useStore();
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();
  const [meetings, setMeetings] = useState<IMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [agenda, setAgenda] = useState("");
  const [participantCount, setParticipantCount] = useState("");

  const fetchMeetings = async () => {
    try {
      const response = await fetch(`/api/meetings?userId=${userId}`);
      const data = await response.json();
      setMeetings(data.meetings);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          agenda,
          participantCount: parseInt(participantCount) || 1,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create meeting");
      }

      const data = await response.json();
      toast.success("Meeting created successfully!");
      router.push(`/meetings/${data?.meeting?.id}`);
    } catch (error) {
      toast.error("Failed to create meeting. Please try again.");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Meetings</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Create Meeting
          </button>
        </div>

        {meetings.length === 0 && (
          <p className="text-center text-gray-500">
            You don't have any meetings yet.
          </p>
        )}

        {meetings.length > 0 && (
          <ul className="space-y-4">
            {meetings.map((meeting) => (
              <Link
                href={`/meetings/${meeting._id}`}
                key={meeting._id as string}
                className="bg-white rounded-lg shadow-md p-4 flex flex-col"
              >
                <h2 className="text-2xl font-bold">{meeting.title}</h2>
                <p className="text-gray-600">{meeting.agenda}</p>
                <div className="flex items-center justify-between text-gray-600">
                  <p>Expected Participants: {meeting.participantCount}</p>
                  <p>Created at: {new Date(meeting.createdAt).toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </ul>
        )}

        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Create Meeting</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col">
                  <label
                    htmlFor="title"
                    className="text-sm font-medium text-gray-700 mb-1"
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="rounded-md border border-gray-300 p-2 focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label
                    htmlFor="agenda"
                    className="text-sm font-medium text-gray-700 mb-1"
                  >
                    Agenda
                  </label>
                  <textarea
                    id="agenda"
                    value={agenda}
                    onChange={(e) => setAgenda(e.target.value)}
                    className="rounded-md border border-gray-300 p-2 focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label
                    htmlFor="participantCount"
                    className="text-sm font-medium text-gray-700 mb-1"
                  >
                    Expected Participants
                  </label>
                  <input
                    type="number"
                    id="participantCount"
                    value={participantCount}
                    onChange={(e) => setParticipantCount(e.target.value)}
                    className="rounded-md border border-gray-300 p-2 focus:border-indigo-500 focus:ring-indigo-500"
                    min="1"
                    required
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    isLoading ? "bg-indigo-400 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    "Create Meeting"
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
};

export default Home;
