import fs from "fs";
import path from "path";
import mammoth from "mammoth";
import PDFParser from "pdf2json";

export interface ParsedContext {
  content: string;
  originalFileName: string;
  fileType: string;
  parsedAt: Date;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const SUPPORTED_EXTENSIONS = [".txt", ".json", ".md", ".pdf", ".docx", ".doc"];

export function isValidFileType(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}

export function isValidFileSize(sizeBytes: number): boolean {
  return sizeBytes <= MAX_FILE_SIZE;
}

export async function parseFile(
  filePath: string,
  originalName: string
): Promise<ParsedContext> {
  const ext = path.extname(originalName).toLowerCase();
  const buffer = await fs.promises.readFile(filePath);

  let content: string;

  switch (ext) {
    case ".txt":
    case ".md":
      content = buffer.toString("utf-8");
      break;

    case ".json":
      content = parseJsonFile(buffer.toString("utf-8"));
      break;

    case ".pdf":
      content = await parsePdfFile(buffer);
      break;

    case ".docx":
    case ".doc":
      content = await parseDocxFile(buffer);
      break;

    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }

  return {
    content,
    originalFileName: originalName,
    fileType: ext.slice(1).toUpperCase(),
    parsedAt: new Date(),
  };
}

function parseJsonFile(jsonString: string): string {
  try {
    const data = JSON.parse(jsonString);

    // Handle FAQ-style JSON
    if (data.faqs && Array.isArray(data.faqs)) {
      return data.faqs
        .map((faq: any) => {
          let entry = `Q: ${faq.question || "N/A"}\nA: ${faq.answer || "N/A"}`;
          if (faq.category) entry += `\nCategory: ${faq.category}`;
          return entry;
        })
        .join("\n\n");
    }

    // Handle generic JSON - convert to readable text
    return JSON.stringify(data, null, 2);
  } catch {
    throw new Error("Invalid JSON file");
  }
}

async function parsePdfFile(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const pdfParser = new PDFParser(null, 1); // 1 = text content only

      pdfParser.on("pdfParser_dataError", (errData: any) => {
        console.error("PDF Parser Error:", errData.parserError);
        reject(new Error("Failed to parse PDF file."));
      });

      pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
        try {
          // Extract text from pages
          const text = pdfParser.getRawTextContent().replace(/\r\n/g, "\n");

          if (!text || text.trim().length === 0) {
            reject(new Error("PDF appears to be empty or contains only images"));
            return;
          }

          resolve(text);
        } catch (error) {
          reject(error);
        }
      });

      pdfParser.parseBuffer(buffer);
    } catch (error) {
      reject(error);
    }
  });
}

async function parseDocxFile(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer: buffer });
    const text = result.value;

    if (result.messages.length > 0) {
      console.log("Mammoth messages:", result.messages);
    }

    if (!text || text.trim().length === 0) {
      throw new Error("Document appears to be empty");
    }

    return text;
  } catch (error: any) {
    console.error("DOCX parsing error:", error.message || error);
    if (error.message?.includes("empty")) {
      throw error;
    }
    throw new Error("Failed to parse Word document.");
  }
}
