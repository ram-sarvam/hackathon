import { GoogleGenerativeAI } from '@google/generative-ai';
import { DocumentSummary } from './types';

/**
 * Initialize Gemini API client
 * @returns Initialized Gemini client
 */
export const initGemini = () => {
  // Server-side environment variable (no NEXT_PUBLIC_ prefix needed)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in your environment variables");
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Generate a summary of the document content using Gemini
 * @param textContent The text content to summarize
 * @returns Structured summary data
 */
export async function generateSummaryWithGemini(textContent: string): Promise<DocumentSummary> {
  try {
    const genAI = initGemini();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Create a prompt for Gemini to analyze the document
    const prompt = `
    You are an AI assistant specialized in analyzing hackathon project proposals and presentations.
    
    Analyze the following text extracted from a hackathon project document and provide a comprehensive summary with the following components:
    
    1. Project Title: Extract or infer the title of the project
    2. Problem Statement: What problem is the project trying to solve?
    3. Project Summary: A concise overview of the project
    4. Key Features: List the main features or components of the solution
    5. Technical Stack: Identify any technologies, frameworks, or tools mentioned
    6. Target Audience: Who would benefit from this solution?
    7. Innovation Aspects: What makes this project innovative or unique?
    8. Potential Impact: How might this project create value or impact?
    
    Format your response as a structured JSON object with these exact field names:
    {
      "projectTitle": "Title here",
      "problemStatement": "Problem statement here",
      "projectSummary": "Summary here",
      "keyFeatures": ["Feature 1", "Feature 2", "Feature 3"],
      "technicalStack": ["Tech 1", "Tech 2", "Tech 3"],
      "targetAudience": "Target audience here",
      "innovationAspects": "Innovation aspects here",
      "potentialImpact": "Potential impact here"
    }
    
    Ensure your response is valid JSON that can be parsed. Do not include any text outside the JSON object.
    
    
    Here is the document text:
    ${textContent}
    `;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse the response as JSON, fallback to text if not valid JSON
    try {
      // Check if the response contains a JSON object
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : text;
      
      const parsedJson = JSON.parse(jsonString) as DocumentSummary;
      return parsedJson;
    } catch (e) {
      console.error('JSON parse error:', e);
      
      // Create a structured summary from the raw text
      return { 
        projectTitle: "Project Summary",
        projectSummary: text,
        rawSummary: text,
        error: "Response was not in valid JSON format"
      };
    }
  } catch (error) {
    console.error('Error generating summary:', error);
    return {
      projectTitle: "Error Generating Summary",
      projectSummary: "There was an error generating the project summary.",
      error: error instanceof Error ? error.message : 'Unknown error generating summary'
    };
  }
} 