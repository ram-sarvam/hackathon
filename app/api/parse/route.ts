import { NextRequest, NextResponse } from 'next/server';
import { processDocumentWithMistral, extractCleanTextFromOcr } from '@/app/utils/mistral';
import { generateSummaryWithGemini } from '@/app/utils/gemini';

/**
 * API endpoint for document parsing and summarization
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({
        error: 'No file uploaded',
        status: 400
      }, { status: 400 });
    }

    // Step 1: Process document with Mistral OCR
    const ocrResult = await processDocumentWithMistral(file);
    
    // Step 2: Extract clean text from OCR result
    const cleanText = extractCleanTextFromOcr(ocrResult.ocrContent);
    
    // Step 3: Generate summary with Gemini
    const summary = await generateSummaryWithGemini(cleanText);

    console.log(summary);

    return NextResponse.json({
      title: summary.projectTitle,
      summary: summary
    }, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error:`, errorMessage);
    
    return NextResponse.json({
      error: errorMessage,
      status: 500
    }, { status: 500 });
  }
}






