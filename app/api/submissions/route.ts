import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Meeting from '@/app/models/Meeting';

export async function POST(req: Request) {
  try {
    await connectDB();

    const formData = await req.formData();
    const teamName = formData.get('teamName') as string;
    const pdf = formData.get('pdf') as File;
    const meetingId = formData.get('meetingId') as string;

    if (!teamName || !pdf || !meetingId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Implement actual file upload to cloud storage
    const mockPdfUrl = `https://storage.example.com/${pdf.name}`;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return NextResponse.json(
        { success: false, error: 'Meeting not found' },
        { status: 404 }
      );
    }

    meeting.submissions.push({
      teamName,
      pdfUrl: mockPdfUrl,
      submittedAt: new Date()
    });

    await meeting.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit presentation' },
      { status: 500 }
    );
  }
}
