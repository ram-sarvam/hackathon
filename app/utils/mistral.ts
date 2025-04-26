import { Mistral } from '@mistralai/mistralai';
import { 
  MistralOcrResponse, 
  OcrProcessingResult, 
  ParsedOcrContent 
} from './types';

/**
 * Process document with Mistral OCR
 * @param file File to process with OCR
 * @returns Object containing OCR results and file ID
 */
export async function processDocumentWithMistral(file: File): Promise<OcrProcessingResult> {
  // Server-side environment variable (no NEXT_PUBLIC_ prefix needed)
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("MISTRAL_API_KEY is not set in your environment variables");
  }

  const client = new Mistral({apiKey});

  try {
    // Convert file to array buffer and then to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Step 1: Upload file to Mistral
    const uploadedFile = await client.files.upload({
      file: {
        fileName: file.name,
        content: buffer,
      },
      purpose: "ocr"
    });
    
    // Step 2: Get a signed URL for the uploaded file
    const signedUrl = await client.files.getSignedUrl({
      fileId: uploadedFile.id,
    });
    
    // Step 3: Process OCR with the signed URL
    const ocrResponse = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: "document_url",
        documentUrl: signedUrl.url,
      }
    });

    // Parse the OCR result - cast to our interface type
    const parsedResult = parseOcrResponse(ocrResponse as unknown as MistralOcrResponse);

    return {
      ocrContent: ocrResponse as unknown as MistralOcrResponse,
      parsedContent: parsedResult,
      fileId: uploadedFile.id
    };
  } catch (error) {
    console.error('Error in OCR processing:', error);
    throw error;
  }
}

/**
 * Parse OCR response into a structured format
 * @param ocrResponse Raw OCR response from Mistral
 * @returns Structured OCR data
 */
export function parseOcrResponse(ocrResponse: MistralOcrResponse): ParsedOcrContent {
  try {
    // Initialize the parsed content
    let parsedContent: ParsedOcrContent = {
      text: '',
      pages: [],
      tables: [],
      metadata: {
        pageCount: 0,
        documentType: '',
        confidence: 0
      }
    };
    
    // Extract full text
    if (ocrResponse.text) {
      parsedContent.text = ocrResponse.text;
    }
    
    // Extract pages information
    if (Array.isArray(ocrResponse.pages)) {
      parsedContent.metadata.pageCount = ocrResponse.pages.length;
      
      parsedContent.pages = ocrResponse.pages.map((page, index) => {
        return {
          pageNumber: index + 1,
          text: page.text || '',
          width: page.width,
          height: page.height
        };
      });
    }
    
    // Extract tables if available
    if (Array.isArray(ocrResponse.tables)) {
      parsedContent.tables = ocrResponse.tables.map((table, index) => {
        return {
          tableId: index + 1,
          pageNumber: table.page,
          data: table.data || [],
          headers: table.headers || []
        };
      });
    }
    
    // Extract metadata if available
    if (ocrResponse.metadata) {
      parsedContent.metadata = {
        ...parsedContent.metadata,
        ...ocrResponse.metadata
      };
    }
    
    return parsedContent;
  } catch (error) {
    console.error('Error parsing OCR response:', error);
    // Return the original response if parsing fails
    return {
      text: ocrResponse.text || 'No text extracted',
      pages: [],
      tables: [],
      metadata: {
        pageCount: 0,
        documentType: '',
        confidence: 0
      },
      error: 'Failed to parse OCR response'
    };
  }
}

/**
 * Extract clean text from OCR response for better AI processing
 * @param ocrResponse Raw OCR response from Mistral
 * @returns Cleaned text content suitable for AI input
 */
export function extractCleanTextFromOcr(ocrResponse: MistralOcrResponse): string {
  try {
    let extractedText = '';
    
    // If there's a simple text field, use it
    if (ocrResponse.text && typeof ocrResponse.text === 'string') {
      extractedText += ocrResponse.text + '\n\n';
    }
    
    // Extract text from pages if available
    if (Array.isArray(ocrResponse.pages)) {
      ocrResponse.pages.forEach((page, index) => {
        if (page.text) {
          extractedText += `--- Page ${index + 1} ---\n${page.text}\n\n`;
        }
        
        // Extract text from blocks if available
        if (Array.isArray(page.blocks)) {
          page.blocks.forEach((block) => {
            if (block.markdown) {
              // Clean markdown content
              const cleanMarkdown = block.markdown
                .replace(/!\[.*?\]\(.*?\)/g, '') // Remove image references
                .replace(/\[.*?\]\(.*?\)/g, '$1') // Replace links with just text
                .replace(/#{1,6}\s+/g, '') // Remove heading markers
                .replace(/\*\*/g, '') // Remove bold markers
                .replace(/\*/g, '') // Remove italic markers
                .replace(/`/g, '') // Remove code markers
                .trim();
              
              if (cleanMarkdown) {
                extractedText += cleanMarkdown + '\n';
              }
            }
            
            if (block.text) {
              extractedText += block.text + '\n';
            }
          });
        }
      });
    }
    
    // Extract text from tables if available
    if (Array.isArray(ocrResponse.tables)) {
      ocrResponse.tables.forEach((table, index) => {
        extractedText += `--- Table ${index + 1} ---\n`;
        
        // Add headers if available
        if (Array.isArray(table.headers)) {
          extractedText += table.headers.join(' | ') + '\n';
        }
        
        // Add data rows if available
        if (Array.isArray(table.data)) {
          table.data.forEach((row) => {
            if (Array.isArray(row)) {
              extractedText += row.join(' | ') + '\n';
            }
          });
        }
        
        extractedText += '\n';
      });
    }
    
    return extractedText || JSON.stringify(ocrResponse);
  } catch (error) {
    console.error("Error extracting clean text from OCR:", error);
    // Fallback to stringifying the entire response
    return JSON.stringify(ocrResponse);
  }
} 