import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Meeting from "@/app/models/Meeting";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";

const PDF_PARSER_API_URL = "https://hackathon-tau-red.vercel.app/api/parse"; // Replace with your actual PDF parsing API endpoint

export async function POST(req: Request) {
  try {
    await connectDB();

    const requestFormData: FormData = await req.formData();
    const teamName = requestFormData.get("teamName");
    const meetingId = requestFormData.get("meetingId");
    const pdf = requestFormData.get("pdf") as File | null;

    if (!teamName || !meetingId || !pdf) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const meeting = await Meeting.findById(meetingId);

    console.log(meeting)

    if (!meeting) {
      return NextResponse.json(
        { success: false, error: "Meeting not found" },
        { status: 404 }
      );
    }

    const submissionId = new mongoose.Types.ObjectId().toHexString();

    // Add submission first without parsed info
    meeting.submissions.push({
      teamName: teamName.toString(),
      pdfUrl: `/uploads/${uuidv4()}-${pdf.name}`,
      submittedAt: new Date(),
      submissionInfo: {
        ideaName: "Processing...",
        docSummary: {}
      },
      _id: submissionId,
    });

    await meeting.save();

    // Start parsing in background
    const parserFormData = new FormData();
    parserFormData.append("file", pdf);

    fetch(PDF_PARSER_API_URL, {
      method: "POST",
      body: parserFormData,
    }).then(async (parserResponse) => {
      if (parserResponse.ok) {
        const parserData = await parserResponse.json();
        const parsedInfo = {
          ideaName: parserData.title,
          docSummary: parserData.summary
        };

        // Update the submission with parsed info
        await Meeting.findOneAndUpdate(
          { _id: meetingId, 'submissions._id': submissionId },
          { 
            $set: { 
              'submissions.$.submissionInfo': parsedInfo 
            } 
          }
        );
      }
    }).catch((error) => {
      console.error("Error parsing PDF:", error);
    });

    return NextResponse.json({
      success: true,
      submissionId,
      submissionInfo: {
        ideaName: "Processing...",
        docSummary: {}
      }
    });

  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit presentation",
      },
      { status: 500 }
    );
  }
}
