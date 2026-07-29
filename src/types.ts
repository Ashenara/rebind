export interface SourceBook {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  fileName: string;
  chaptersCount: number;
  description?: string;
}

export interface Chapter {
  id: string;
  sourceBookId: string | null; // null if manually created
  sourceBookTitle: string | null; // null if manually created
  originalTitle: string;
  title: string;
  originalContent: string; // Original XHTML body content
  cleanedContent: string;  // Cleaned XHTML or plain text content
  exclude: boolean;
  
  // Performance caching
  _cachedCandidateNumbers?: number[];
}

export interface RegexRule {
  id: string;
  pattern: string;
  replace: string;
  caseInsensitive: boolean;
  active: boolean;
}

export interface ReconstructionSettings {
  keepBold: boolean;
  keepItalic: boolean;
  keepUnderline: boolean;
  keepBrTags: boolean;     // keep <br/> tags
  regexRules: RegexRule[];
  geminiApiKey?: string;   // Optional API key for Gemini AI
}
