import { NextResponse } from "next/server";
import connectDB from "@/app/lib/mongodb";
import Meeting from "@/app/models/Meeting";
import { v4 as uuidv4 } from "uuid";
import { join } from "path";

const PDF_PARSER_API_URL = "https://api.pdfparser.example/parse"; // Replace with your actual PDF parsing API endpoint

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

    const parserFormData = new FormData();
    parserFormData.append("pdf", pdf);

    let parsedInfo: { ideaName: string; docSummary: string } = {
      ideaName: "Demo-title",
      docSummary: "Demo-summary",
    };

    try{
      const parserResponse = await fetch(PDF_PARSER_API_URL, {
        method: "POST",
        body: parserFormData,
      });
  
      if (parserResponse.ok) {
        parsedInfo = await parserResponse.json();
      }
    }catch(error){
      console.error("Error parsing PDF:", error);
    }

    
    // Add submission with parsed info
    meeting.submissions.push({
      teamName: teamName.toString(),
      pdfUrl: `/uploads/${uuidv4()}-${pdf.name}`,
      submittedAt: new Date(),
      submissionInfo: parsedInfo,
    });

    await meeting.save();

    return NextResponse.json({
      success: true,
      submissionInfo: parsedInfo,
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
