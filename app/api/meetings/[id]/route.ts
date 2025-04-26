import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Meeting from '@/app/models/Meeting';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const id = params.id;
  const meeting = await Meeting.findById(id);
  if (!meeting) {
    return NextResponse.json({ success: false, error: 'Meeting not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, meeting: meeting.toJSON() });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const id = params.id;
  const data = await req.json();
  const { title, agenda, participantCount, status } = data;
  const meeting = await Meeting.findById(id);
  if (!meeting) {
    return NextResponse.json({ success: false, error: 'Meeting not found' }, { status: 404 });
  }
  meeting.title = title;
  meeting.agenda = agenda;
  meeting.participantCount = participantCount;
  meeting.status = status;
  await meeting.save();
  return NextResponse.json({ success: true, meeting: meeting.toJSON() });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const id = params.id;
  const meeting = await Meeting.findById(id);
  if (!meeting) {
    return NextResponse.json({ success: false, error: 'Meeting not found' }, { status: 404 });
  }
  await meeting.deleteOne();
  return NextResponse.json({ success: true, message: 'Meeting deleted successfully' });
}
