import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Meeting from '@/app/models/Meeting';

export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();
    
    const { title, agenda, participantCount, userId } = data;
    
    if (!title || !agenda || !userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Title, agenda, and user ID are required' 
      }, { status: 400 });
    }

    const meeting = await Meeting.create({
      title,
      agenda,
      participantCount: parseInt(participantCount) || 1,
      userId,
      status: 'pending',
      submissions: []
    });

    if (!meeting) {
      throw new Error('Failed to create meeting in database');
    }

    const meetingData = meeting.toJSON();

    return NextResponse.json({ 
      success: true, 
      meeting: {
        ...meetingData,
        id: (meeting._id as string).toString(), // Ensure ID is a string
      }
    });
  } catch (error) {
    console.error('Failed to create meeting:', error);
    return NextResponse.json({ success: false, error: 'Failed to create meeting' }, { status: 500 });
  }
}


export async function GET(req: Request) {
  try {
    await connectDB();
    const userId = new URL(req.url).searchParams.get('userId');
    const meetings = await Meeting.find({userId}).sort({ createdAt: -1 }).exec();
    return NextResponse.json({ 
      success: true, 
      meetings
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch meetings' }, { status: 500 });
  }
}
