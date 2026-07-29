import type { ReconstructionSettings, RegexRule } from '../types';

/**
 * Escapes special characters for XML/HTML text nodes.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Applies custom user-defined regex search-and-replace rules to a string.
 */
export function applyRegexRules(content: string, rules: RegexRule[]): string {
  let cleaned = content;
  for (const rule of rules) {
    if (!rule.active || !rule.pattern) continue;
    try {
      const flags = rule.caseInsensitive ? 'gi' : 'g';
      const regex = new RegExp(rule.pattern, flags);
      cleaned = cleaned.replace(regex, rule.replace);
    } catch (e) {
      console.error(`Invalid regex: ${rule.pattern}`, e);
    }
  }
  return cleaned;
}

/**
 * Clean chapter HTML based on the provided settings.
 * Returns valid XHTML string representing body contents.
 */
export function cleanChapterContent(
  rawHtml: string,
  settings: ReconstructionSettings,
  chapterTitle?: string
): string {
  const parser = new DOMParser();
  // Wrap in a body to ensure standard DOM parsing
  const doc = parser.parseFromString(`<body>${rawHtml}</body>`, 'text/html');
  const body = doc.body;

  // Remove unwanted elements immediately
  const elementsToRemove = body.querySelectorAll('script, style, link, svg, iframe, object, embed, img');
  elementsToRemove.forEach(el => el.remove());

    // Clean HTML Mode
    // Allowed semantic formatting elements for readability
    const allowedTags = new Set([
      'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote',
      'b', 'i', 'em', 'strong', 'u', 'sub', 'sup', 'span'
    ]);
    
    if (settings.keepBrTags) {
      allowedTags.add('br');
    }

    // Inline tags to distinguish block containers vs inline elements
    const INLINE_TAGS = new Set([
      'b', 'i', 'em', 'strong', 'u', 'sub', 'sup', 'span', 'a', 'br', 'font', 'code',
      'cite', 'dfn', 'kbd', 'samp', 'small', 'strike', 'del', 'ins'
    ]);

    // Create a temporary document to build the clean XML structure
    const xmlDoc = document.implementation.createDocument('http://www.w3.org/1999/xhtml', 'html', null);
    const xmlBody = xmlDoc.createElementNS('http://www.w3.org/1999/xhtml', 'body');

    const cleanNode = (node: Node, parentXmlEl: Element) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textVal = node.nodeValue || '';
        if (textVal) {
          const textNode = xmlDoc.createTextNode(textVal);
          parentXmlEl.appendChild(textNode);
        }
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
      }

      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();

      // Check if tag is allowed
      if (allowedTags.has(tagName)) {
        // If inline formatting, check settings
        const isInline = INLINE_TAGS.has(tagName);
        let flattenTag = false;
        
        if (isInline) {
          if (['b', 'strong'].includes(tagName) && !settings.keepBold) flattenTag = true;
          if (['i', 'em'].includes(tagName) && !settings.keepItalic) flattenTag = true;
          if (['u'].includes(tagName) && !settings.keepUnderline) flattenTag = true;
        }

        if (flattenTag) {
          // Flatten: append clean children directly to parent XML element
          for (let i = 0; i < el.childNodes.length; i++) {
            cleanNode(el.childNodes[i], parentXmlEl);
          }
          return;
        }

        // Create new clean element without any attributes (clean!)
        const newEl = xmlDoc.createElementNS('http://www.w3.org/1999/xhtml', tagName);
        
        // Exception: if it is a break <br>, which doesn't need children
        if (tagName === 'br') {
          parentXmlEl.appendChild(newEl);
          return;
        }

        // Process children
        for (let i = 0; i < el.childNodes.length; i++) {
          cleanNode(el.childNodes[i], newEl);
        }

        // Only append if it's structural (p, h1-h6, br) or has text/children content
        const hasContent = newEl.childNodes.length > 0 || tagName === 'br';
        if (hasContent) {
          parentXmlEl.appendChild(newEl);
        }
        return;
      }

      // If it's a container element (not in allowedTags, e.g. div, section, chapter, etc.),
      // process its children into the parent.
      // If the parent is the root xmlBody, we should ensure the children are wrapped/bundled in paragraph block tags.
      if (parentXmlEl === xmlBody) {
        // Create a temporary p-tag to bundle any inline content
        let currentP = xmlDoc.createElementNS('http://www.w3.org/1999/xhtml', 'p');
        
        for (let i = 0; i < el.childNodes.length; i++) {
          const childNode = el.childNodes[i];
          if (childNode.nodeType === Node.ELEMENT_NODE) {
            const childTag = (childNode as HTMLElement).tagName.toLowerCase();
            const isBlock = !INLINE_TAGS.has(childTag);
            
            if (isBlock) {
              // Flush current p if it has content
              if (currentP.childNodes.length > 0) {
                xmlBody.appendChild(currentP);
                currentP = xmlDoc.createElementNS('http://www.w3.org/1999/xhtml', 'p');
              }
              cleanNode(childNode, xmlBody);
            } else {
              cleanNode(childNode, currentP);
            }
          } else {
            cleanNode(childNode, currentP);
          }
        }
        
        // Flush remaining p
        if (currentP.childNodes.length > 0 && currentP.textContent?.trim()) {
          xmlBody.appendChild(currentP);
        }
      } else {
        // Just process children directly into the parent element
        for (let i = 0; i < el.childNodes.length; i++) {
          cleanNode(el.childNodes[i], parentXmlEl);
        }
      }
    };

    // Populate xmlBody by traversing the body (treated as a container element)
    cleanNode(body, xmlBody);

    // 1. Remove empty/whitespace-only elements first
    for (let i = xmlBody.children.length - 1; i >= 0; i--) {
      const child = xmlBody.children[i];
      const text = child.textContent?.trim() || '';
      if (text.length === 0 && !child.querySelector('br')) {
        xmlBody.removeChild(child);
      }
    }

    // Smart post-processing: Remove redundant title/number prefix (e.g. first elements are just "#343" or "343" followed by a descriptive title/heading)
    const isShortNumber = (text: string) => /^(?:#\s*\d+|\d+)$/.test(text);

    // Keep removing first child if it is a short number, AS LONG AS there is at least one non-short-number block left
    while (xmlBody.children.length > 1) {
      const firstChild = xmlBody.children[0];
      const firstText = firstChild.textContent?.trim() || '';
      
      if (isShortNumber(firstText)) {
        let hasDescriptiveBlock = false;
        for (let i = 1; i < xmlBody.children.length; i++) {
          const childText = xmlBody.children[i].textContent?.trim() || '';
          if (childText && !isShortNumber(childText)) {
            hasDescriptiveBlock = true;
            break;
          }
        }
        
        if (hasDescriptiveBlock) {
          xmlBody.removeChild(firstChild);
        } else {
          // No descriptive block left, keep this short number as it is the only heading/text
          break;
        }
      } else {
        break;
      }
    }

    // Remove multiple redundant headings that match the chapter title or look like generic "Chapter X" headers
    if (chapterTitle && xmlBody.children.length > 1) {
      const cleanTitle = chapterTitle.trim().toLowerCase();
      
      // Loop up to 3 times to remove redundant title blocks (like "Chapter 1" and "Chapter 1 - Title")
      for (let k = 0; k < 3 && xmlBody.children.length > 1; k++) {
        const firstChild = xmlBody.children[0];
        const firstText = firstChild.textContent?.trim() || '';
        const firstTextLower = firstText.toLowerCase();
        
        if (firstText && (
          firstTextLower === cleanTitle ||
          cleanTitle.startsWith(firstTextLower) ||
          /^(chapter|ch|volume|vol|part)\s*[-._]?\s*\d+\s*$/i.test(firstTextLower)
        )) {
          // Extra safety: only remove if it's relatively short (< 300 chars) 
          // to prevent deleting a whole paragraph that happens to start with "Chapter 1 was a crazy time..."
          if (firstText.length < 300) {
            xmlBody.removeChild(firstChild);
            continue;
          }
        }
        break; // Stop if the first element doesn't match our criteria
      }
    }

    // Now, serialize the clean XML body children back to strings
    const serializer = new XMLSerializer();
    let result = '';
    
    // Filter out completely empty paragraphs
    for (let i = 0; i < xmlBody.children.length; i++) {
      const child = xmlBody.children[i];
      const text = child.textContent?.trim() || '';
      
      // If it contains a br, or has actual text, serialize it
      if (text.length > 0 || child.querySelector('br')) {
        let str = serializer.serializeToString(child);
        // Remove xmlns namespace attribute that XMLSerializer automatically adds
        str = str.replace(/\sxmlns="[^"]*"/g, '');
        result += str + '\n';
      }
    }

    return result;
}
