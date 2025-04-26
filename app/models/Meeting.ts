import mongoose, { Schema, Document } from 'mongoose';

export interface IMeeting extends Document {
  title: string;
  agenda: string;
  participantCount?: number;
  createdAt: Date;
  status: 'pending' | 'active' | 'completed';
  userId: string;
  submissions: {
    teamName: string;
    pdfUrl: string;
    submittedAt: Date;
    submissionInfo?: Record<string, any>;
    analysis?: Record<string, any>;
    _id: string;
  }[];
}

const MeetingSchema = new Schema({
  title: { type: String, required: true },
  agenda: { type: String, required: true },
  participantCount: { type: Number },
  createdAt: { type: Date, default: Date.now },
  userId: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'active', 'completed'],
    default: 'pending'
  },
  submissions: [{
    teamName: { type: String, required: true },
    pdfUrl: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    submissionInfo: { type: Schema.Types.Mixed },
    analysis: { type: Schema.Types.Mixed }
  }]
});

export default mongoose.models.Meeting || mongoose.model<IMeeting>('Meeting', MeetingSchema);
