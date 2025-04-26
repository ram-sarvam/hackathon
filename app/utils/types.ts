
// Mistral OCR Response Structure
export interface MistralOcrResponse {
  text?: string;
  pages?: MistralOcrPage[];
  tables?: MistralOcrTable[];
  metadata?: Record<string, any>;
}

export interface MistralOcrPage {
  text?: string;
  width?: number;
  height?: number;
  blocks?: MistralOcrBlock[];
}

export interface MistralOcrBlock {
  text?: string;
  markdown?: string;
}

export interface MistralOcrTable {
  page?: number;
  headers?: string[];
  data?: string[][];
}

// Parsed OCR Content
export interface ParsedOcrContent {
  text: string;
  pages: ParsedOcrPage[];
  tables: ParsedOcrTable[];
  metadata: {
    pageCount: number;
    documentType: string;
    confidence: number;
    [key: string]: any;
  };
  error?: string;
}

export interface ParsedOcrPage {
  pageNumber: number;
  text: string;
  width?: number;
  height?: number;
}

export interface ParsedOcrTable {
  tableId: number;
  pageNumber?: number;
  headers: string[];
  data: string[][];
}

// OCR Processing Result
export interface OcrProcessingResult {
  ocrContent: MistralOcrResponse;
  parsedContent: ParsedOcrContent;
  fileId: string;
}

/**
 * Document Summary Types
 */
export interface DocumentSummary {
  projectTitle: string;
  problemStatement?: string;
  projectSummary: string;
  keyFeatures?: string[];
  technicalStack?: string[];
  targetAudience?: string;
  innovationAspects?: string;
  potentialImpact?: string;
  rawSummary?: string;
  error?: string;
}