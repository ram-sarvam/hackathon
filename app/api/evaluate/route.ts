import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import connectDB from '@/app/lib/mongodb';
import Meeting from '@/app/models/Meeting';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    await connectDB();
    const { meetingId, submissions, analysis } = await req.json();

    if (!meetingId || !submissions || submissions.length === 0 || !analysis) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return NextResponse.json({ 
        success: false, 
        error: 'Meeting not found' 
      }, { status: 404 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const evaluations = await Promise.all(
      submissions.map(async (submission: any) => {
        const prompt = `You are an expert judge evaluating presentations. Please analyze this presentation summary and provide:
1. A score out of 100 based on:
   - Clarity and organization (30 points)
   - Technical depth (30 points)
   - Innovation and creativity (20 points)
   - Presentation quality (20 points)
   - Analysis by judges (10 points)
2. Brief but specific feedback highlighting strengths and areas for improvement

Summary of the presentation:
${JSON.stringify(submission.submissionInfo, null, 2)}

Analysis by judges:
${JSON.stringify(analysis, null, 2)}

Format your response exactly like this example:
{
  "score": 85,
  "feedback": "Strong technical implementation with clear architecture. Creative solution to X problem. Could improve Y aspect."
}`;

        try {
          const result = await model.generateContent(prompt);
          const response = result.response;
          const text = response.text();
          const evaluation = JSON.parse(text.replace('```json', '').replace('```', '').trim());

          return {
            teamName: submission.teamName,
            score: evaluation.score,
            feedback: evaluation.feedback
          };
        } catch (error) {
          console.error('Error evaluating submission:', error);
          return {
            teamName: submission.teamName,
            score: 0,
            feedback: 'Error evaluating submission'
          };
        }
      })
    );

    // Update meeting with evaluated status
    meeting.status = 'analyzed';
    await meeting.save();

    return NextResponse.json({
      success: true,
      evaluations
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to evaluate submissions' 
    }, { status: 500 });
  }
}
