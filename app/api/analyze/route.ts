import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Meeting from '@/app/models/Meeting';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { transcript, meetingId, submissionId } = await req.json();
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Carefully read the following transcript.
Write a sharp, clear, and high-quality analysis using short, simple, and direct sentences.
No formatting like lists, bullets, or markdown — just plain text.
Avoid fluff, filler, or vague words.
Be honest, objective, and concise.

Your output must cover:

- 3 to 5 biggest strengths (only major positives)
- 3 to 5 real weaknesses or areas for improvement (be direct and critical if needed)
- 2 to 3 strong follow-up questions that show deeper thinking

Important rules:

- Focus only on important points, not minor details
- Your response must contain points for every category
- If content quality is very high or very poor, ignore that for now.
- Keep the tone professional, neutral, and sharp
- If there’s missing context or confusion, highlight it in cons

You must return it as JSON like this:

{
    pros: ["pro1", "pro2", "pro3", "pro4", "pro5"],
    cons: ["con1", "con2", "con3", "con4", "con5"],
    suggestedQuestions: ["question1", "question2", "question3"]
}

Transcript:
${transcript}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    text = text.replace('```json', '').replace('```', '').trim();

    const json = JSON.parse(text);

    const analysis = {
      pros: json.pros,
      cons: json.cons,
      suggestedQuestions: json.suggestedQuestions
    };

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return NextResponse.json({ success: false, error: 'Meeting not found' }, { status: 404 });
    }


    meeting.analysis = {
      ...meeting.analysis,
      [submissionId]: analysis
    };

    await meeting.save();

    const updatedMeeting = await Meeting.findById(meetingId);

    return NextResponse.json({ analysis, updatedMeeting });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze presentation' }, { status: 500 });
  }
}
