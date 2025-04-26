"use client";

import { useState } from "react";
import { Toaster, toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const Home = () => {
  const [title, setTitle] = useState("");
  const [agenda, setAgenda] = useState("");
  const [participantCount, setParticipantCount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/meetings", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          agenda,
          participantCount: parseInt(participantCount) || 1,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create meeting');
      }

      const data = await response.json();
      if (!data.success || !data.meeting) {
        throw new Error(data.error || 'Failed to create meeting');
      }
      toast.success('Meeting created successfully!');
      window.location.href = `/meetings/${data.meeting._id}`;
    } catch (error) {
      toast.error('Failed to create meeting. Please try again.');
      console.error("Failed to create meeting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-center" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8"
      >
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Create New Meeting
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Meeting Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 transition-colors duration-200"
              placeholder="Enter meeting title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Agenda <span className="text-red-500">*</span>
            </label>
            <textarea
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 transition-colors duration-200"
              rows={4}
              placeholder="Enter meeting agenda"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Number of Participants <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={participantCount}
              onChange={(e) => setParticipantCount(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20 transition-colors duration-200"
              min="1"
              placeholder="Enter number of participants"
              required
            />
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-semibold text-white transition-colors duration-200 ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : 'Create Meeting'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default Home;
