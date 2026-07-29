export async function generateRegexWithAI(apiKey: string, sampleText: string): Promise<string> {
  if (!apiKey) {
    throw new Error('Gemini API Key is missing. Please configure it in the Global Settings.');
  }

  // Use the requested model
  const modelName = 'gemini-3.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const prompt = `
You are an expert at writing JavaScript regular expressions for cleaning EPUB/HTML text.

The user wants to remove a specific piece of text or pattern from their chapter body.
Here is the exact string the user wants to remove, or a sample of it:
"""
${sampleText}
"""

Please write a robust, highly specific JavaScript Regex pattern that matches this text and its common variations (such as surrounding decorative symbols, HTML encoded brackets like &lt; and &gt;, etc.) so it can be passed into \`string.replace(regex, '')\`.
Make sure it safely ignores normal HTML tags (like <p>) wrapping the text!

IMPORTANT:
- ONLY output the raw Regex pattern itself. 
- Do NOT wrap it in \`/\` or \`/g\`. Just the raw pattern string.
- Do NOT output any markdown, explanations, or code blocks.
- Example correct output: (?:&lt;|<)+Prev(?:&lt;|<)+.*?(?:&gt;|>)+Next(?:&gt;|>)+
`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1, // Keep it deterministic
        }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Gemini API Error:', err);
      throw new Error(err.error?.message || `API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!candidateText) {
      throw new Error('No regex pattern returned by the AI.');
    }

    // Clean up response in case AI included markdown or slash wrappers
    let cleanedPattern = candidateText.trim();
    if (cleanedPattern.startsWith('```regex')) {
      cleanedPattern = cleanedPattern.replace(/^```regex\n/, '').replace(/\n```$/, '');
    } else if (cleanedPattern.startsWith('```')) {
      cleanedPattern = cleanedPattern.replace(/^```[^\n]*\n/, '').replace(/\n```$/, '');
    }
    
    if (cleanedPattern.startsWith('/') && cleanedPattern.lastIndexOf('/') > 0) {
      cleanedPattern = cleanedPattern.substring(1, cleanedPattern.lastIndexOf('/'));
    }

    return cleanedPattern.trim();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`AI generation failed: ${message}`, { cause: error });
  }
}
