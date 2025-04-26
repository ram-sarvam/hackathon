import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Meeting from '@/app/models/Meeting';

export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();
    
    const { title, agenda, participantCount } = data;
    
    if (!title || !agenda) {
      return NextResponse.json({ 
        success: false, 
        error: 'Title and agenda are required' 
      }, { status: 400 });
    }

    const meeting = await Meeting.create({
      title,
      agenda,
      participantCount: parseInt(participantCount) || 1,
      status: 'pending',
      submissions: []
    });

    if (!meeting) {
      throw new Error('Failed to create meeting in database');
    }

    const submissionLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/submit/${meeting._id}`;

    return NextResponse.json({ 
      success: true, 
      meeting: {
        ...meeting.toJSON(),
        submissionLink
      }
    });
  } catch (error) {
    console.error('Failed to create meeting:', error);
    return NextResponse.json({ success: false, error: 'Failed to create meeting' }, { status: 500 });
  }
}

interface Meeting {
  id: string;
  title: string;
  agenda: string;
  pdf?: string;
  participantCount?: number;
  createdAt: string;
  status: 'pending' | 'active' | 'completed';
}

export async function GET() {
  try {
    await connectDB();
    const meetings = await Meeting.find().sort({ createdAt: -1 }).exec();
    return NextResponse.json({ 
      success: true, 
      meetings: meetings.map(m => ({
        ...m.toJSON(),
        submissionLink: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/submit/${m._id}`
      }))
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch meetings' }, { status: 500 });
  }
}
