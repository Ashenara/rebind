import JSZip from 'jszip';
import type { SourceBook, Chapter } from '../types';
import { isJunkHref, isJunkLabel } from './epubFilter';

/**
 * Resolves relative paths within an EPUB archive, handling '.' and '..'
 */
export function resolvePath(baseDir: string, relativePath: string): string {
  if (relativePath.startsWith('/')) {
    return relativePath.substring(1);
  }
  
  const baseParts = baseDir.split('/').filter(Boolean);
  const relParts = relativePath.split('/');
  
  for (const part of relParts) {
    if (part === '.') {
      continue;
    }
    if (part === '..') {
      baseParts.pop();
    } else {
      baseParts.push(part);
    }
  }
  
  return baseParts.join('/');
}

/**
 * Parses an EPUB file entirely in the browser.
 */
export async function parseEpubFile(
  file: File,
  log: (msg: string) => void
): Promise<{ book: SourceBook; chapters: Chapter[] }> {
  const bookId = crypto.randomUUID();
  log(`[Parser] Loading ZIP for ${file.name}...`);
  
  const zip = await JSZip.loadAsync(file);
  
  // 1. Read META-INF/container.xml
  const containerFile = zip.file('META-INF/container.xml');
  if (!containerFile) {
    throw new Error('Invalid EPUB: META-INF/container.xml not found.');
  }
  
  const containerText = await containerFile.async('text');
  const parser = new DOMParser();
  const containerDoc = parser.parseFromString(containerText, 'text/xml');
  const rootfile = containerDoc.querySelector('rootfile');
  const opfPath = rootfile?.getAttribute('full-path');
  
  if (!opfPath) {
    throw new Error('Invalid EPUB: Could not find package OPF file path in container.xml.');
  }
  
  log(`[Parser] Found package OPF file at: ${opfPath}`);
  
  // 2. Read the OPF Package Document
  const opfFile = zip.file(opfPath);
  if (!opfFile) {
    throw new Error(`Invalid EPUB: Package file not found at ${opfPath}`);
  }
  
  const opfText = await opfFile.async('text');
  const opfDoc = parser.parseFromString(opfText, 'text/xml');
  
  // OPF directory for relative paths
  const lastSlashIndex = opfPath.lastIndexOf('/');
  const opfDir = lastSlashIndex !== -1 ? opfPath.substring(0, lastSlashIndex + 1) : '';
  
  // 3. Extract Metadata
  const title = 
    opfDoc.querySelector('metadata > title')?.textContent || 
    opfDoc.querySelector('title')?.textContent || 
    opfDoc.querySelector('dc\\:title')?.textContent || 
    file.name.replace(/\.[^/.]+$/, ''); // fallback to filename without extension
    
  const author = 
    opfDoc.querySelector('metadata > creator')?.textContent || 
    opfDoc.querySelector('creator')?.textContent || 
    opfDoc.querySelector('dc\\:creator')?.textContent || 
    'Unknown Author';
    
  const descEl = 
    opfDoc.querySelector('metadata > description') || 
    opfDoc.querySelector('metadata > synopsis') || 
    opfDoc.querySelector('metadata > summary') || 
    opfDoc.querySelector('description') || 
    opfDoc.querySelector('synopsis') || 
    opfDoc.querySelector('summary') || 
    opfDoc.querySelector('dc\\:description') || 
    opfDoc.querySelector('dc\\:synopsis') || 
    opfDoc.querySelector('dc\\:summary');
    
  let description = '';
  if (descEl) {
    const hasChildElements = descEl.children.length > 0;
    const rawMarkup = hasChildElements ? descEl.innerHTML : (descEl.textContent || '');
    const tempDoc = parser.parseFromString(`<body>${rawMarkup}</body>`, 'text/html');
    const plainText = (tempDoc.body.innerText || tempDoc.body.textContent || '').trim();
    description = plainText
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n\n');
  }
    
  log(`[Parser] Book title: "${title}", author: "${author}", description length: ${description.length}`);
  
  // 4. Parse Manifest
  const manifestItems = Array.from(opfDoc.getElementsByTagName('*')).filter(el => el.localName === 'item');
  const manifestMap = new Map<string, { href: string; mediaType: string; properties?: string }>();
  
  manifestItems.forEach(item => {
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    const mediaType = item.getAttribute('media-type');
    const properties = item.getAttribute('properties') || undefined;
    
    if (id && href) {
      // Decode URI Component because hrefs in OPF are URL encoded
      manifestMap.set(id, {
        href: decodeURIComponent(href),
        mediaType: mediaType || '',
        properties
      });
    }
  });
  
  // 5. Parse Spine (defines the reading order)
  const spineItems = Array.from(opfDoc.getElementsByTagName('*')).filter(el => el.localName === 'itemref');
  const spineIds = spineItems
    .map(ref => ref.getAttribute('idref'))
    .filter(Boolean) as string[];
    
  if (spineIds.length === 0) {
    throw new Error('Invalid EPUB: The spine contains no chapters (itemrefs).');
  }
  
  log(`[Parser] Spine contains ${spineIds.length} itemrefs.`);
  
  // 6. Extract Cover Image (if any)
  let coverUrl: string | null = null;
  let coverItemId: string | null = null;
  
  // Search for EPUB 3 cover (item with property cover-image)
  for (const [id, item] of manifestMap.entries()) {
    if (item.properties?.includes('cover-image')) {
      coverItemId = id;
      break;
    }
  }
  
  // Fallback to EPUB 2 cover meta tag
  if (!coverItemId) {
    const coverMeta = opfDoc.querySelector('metadata > meta[name="cover"]');
    coverItemId = coverMeta?.getAttribute('content') || null;
  }
  
  // Alternate fallback: look for items with ID or href containing "cover"
  if (!coverItemId) {
    for (const [id, item] of manifestMap.entries()) {
      const lowerId = id.toLowerCase();
      const lowerHref = item.href.toLowerCase();
      if (item.mediaType.startsWith('image/') && (lowerId.includes('cover') || lowerHref.includes('cover'))) {
        coverItemId = id;
        break;
      }
    }
  }
  
  if (coverItemId) {
    const coverItem = manifestMap.get(coverItemId);
    if (coverItem) {
      const coverPath = resolvePath(opfDir, coverItem.href);
      const imgFile = zip.file(coverPath);
      if (imgFile) {
        log(`[Parser] Extracted cover image from: ${coverPath}`);
        const base64 = await imgFile.async('base64');
        coverUrl = `data:${coverItem.mediaType};base64,${base64}`;
      }
    }
  }
  
  if (!coverUrl) {
    log(`[Parser] No cover image found in ${file.name}.`);
  }
  
  // 7. Parse and Extract Chapters
  const chapters: Chapter[] = [];
  let validChapterCount = 1;
  
  for (let idx = 0; idx < spineIds.length; idx++) {
    const idref = spineIds[idx];
    const item = manifestMap.get(idref);
    
    if (!item) {
      log(`[Warning] Spine element IDREF "${idref}" not found in manifest. Skipping.`);
      continue;
    }
    
    // Only parse XHTML/HTML content documents
    const mt = item.mediaType.toLowerCase();
    if (!mt.includes('xml') && !mt.includes('html') && !mt.includes('xhtml')) {
      continue;
    }
    
    const chapterPath = resolvePath(opfDir, item.href);
    const chapterFile = zip.file(chapterPath);
    
    if (!chapterFile) {
      log(`[Warning] Chapter file not found in ZIP at path: ${chapterPath}. Skipping.`);
      continue;
    }
    
    const rawContent = await chapterFile.async('text');
    const chapterDoc = parser.parseFromString(rawContent, 'text/html');
    
    // Use the extracted helper
    const extracted = extractChapterTitle(chapterDoc, item.href, validChapterCount);
    const chapterTitle = extracted.title;
    const isJunk = extracted.isJunk;
    
    if (!isJunk) {
      validChapterCount++;
    }
    
    // Extract the body content (raw inner HTML of <body>)
    const bodyContent = chapterDoc.body ? chapterDoc.body.innerHTML : rawContent;

    chapters.push({
      id: `${bookId}-ch-${idx}`,
      sourceBookId: bookId,
      sourceBookTitle: title,
      originalTitle: chapterTitle,
      title: chapterTitle,
      originalContent: bodyContent,
      cleanedContent: '', // Will be cleaned on demand or state load
      exclude: isJunk
    });
  }
  
  // 8. If description was not found in the package OPF metadata, attempt to extract it from a Synopsis or Summary chapter
  if (!description) {
    const synopsisChapter = chapters.find(ch => {
      const lower = ch.title.toLowerCase();
      return lower === 'synopsis' || lower === 'summary';
    });
    
    if (synopsisChapter) {
      const synopsisDoc = parser.parseFromString(`<body>${synopsisChapter.originalContent}</body>`, 'text/html');
      const synopsisContainer = synopsisDoc.querySelector('.synopsis, .summary, .description, blockquote');
      const targetElement = (synopsisContainer || synopsisDoc.body) as HTMLElement;
      
      const plainText = (targetElement.innerText || targetElement.textContent || '').trim();
      description = plainText
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n\n');
      log(`[Parser] Extracted book description from Synopsis chapter: "${description.substring(0, 60)}..."`);
    }
  }

  log(`[Parser] Successfully parsed ${chapters.length} chapters from ${file.name}.`);
  
  const sourceBook: SourceBook = {
    id: bookId,
    title,
    author,
    coverUrl,
    fileName: file.name,
    chaptersCount: chapters.length,
    description
  };
  
  return {
    book: sourceBook,
    chapters
  };
}

/**
 * Extracts a chapter title and determines if it is junk.
 * Exported so it can be reused by the main thread after Web Worker processing.
 */
export function extractChapterTitle(chapterDoc: Document, itemHref: string, validChapterCount: number): { title: string, isJunk: boolean } {
  const rawBlockTexts: string[] = [];
  if (chapterDoc.body) {
    const elements = chapterDoc.body.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div');
    for (const el of Array.from(elements)) {
      const tag = el.tagName.toLowerCase();
      if (tag === 'div' && el.querySelector('p, div, h1, h2, h3, h4, h5, h6')) {
        continue;
      }
      const text = (el.textContent || '').trim();
      if (text.length > 0) {
        rawBlockTexts.push(text);
      }
      if (rawBlockTexts.length >= 10) break;
    }
    if (rawBlockTexts.length === 0) {
      for (const node of Array.from(chapterDoc.body.childNodes)) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = (node.nodeValue || '').trim();
          if (text.length > 0) {
            rawBlockTexts.push(text);
          }
        }
      }
    }
  }

  const blockTexts = rawBlockTexts
    .slice(0, 5)
    .filter(text => {
      const isChapterKeyword = 
        /\b(chapter|ch|prologue|epilogue|introduction|preface|volume|vol|interlude|glossary|pov|side story|extra|appendix|afterword|foreword|author['’]?s? note|notice)\b/i.test(text) ||
        /^(?:ch|vol|part)[-._\s]*\d+/i.test(text);
      const isNumericHeader = /^(?:#\s*\d+|\d+)/.test(text);
      
      if (!isChapterKeyword && !isNumericHeader) return false;
      // Reject if it's too long to be a title
      if (text.length >= 150) return false;
      return true;
    });

  let chapterTitle = '';
  const isShortNumber = (text: string) => /^(?:#\s*\d+|\d+)$/.test(text);

  if (blockTexts.length > 0) {
    let titleBaseIndex = -1;
    for (let i = 0; i < blockTexts.length; i++) {
      if (!isShortNumber(blockTexts[i])) {
        titleBaseIndex = i;
        chapterTitle = blockTexts[i];
        break;
      }
    }
    if (titleBaseIndex === -1) {
      titleBaseIndex = 0;
      chapterTitle = blockTexts[0];
    }
    for (let i = titleBaseIndex + 1; i < blockTexts.length; i++) {
      const nextText = blockTexts[i];
      if (nextText.toLowerCase().includes(chapterTitle.trim().toLowerCase()) && nextText.length > chapterTitle.length) {
        chapterTitle = nextText;
      } else if (/^(chapter|ch|volume|vol|part|interlude|prologue|epilogue)\s*[-._]?\s*\d*\s*$/i.test(chapterTitle)) {
        if (!/^(chapter|ch|volume|vol|part)\s*[-._]?\s*\d+\s*$/i.test(nextText)) {
          if (/[-:]\s*$/.test(chapterTitle)) {
            chapterTitle = `${chapterTitle.trim()} ${nextText}`;
          } else {
            chapterTitle = `${chapterTitle.trim()} - ${nextText}`;
          }
          break;
        }
      } else {
        break;
      }
    }
  }
  
  if (!chapterTitle) {
    chapterTitle = chapterDoc.querySelector('title')?.textContent?.trim() || '';
  }

  const isJunk = isJunkHref(itemHref) || isJunkLabel(chapterTitle);

  const isTitleValid = (text: string) => {
    if (!text) return false;
    const isChapterKeyword = 
      /\b(chapter|ch|prologue|epilogue|introduction|preface|volume|vol|interlude|glossary|pov|side story|extra|appendix|afterword|foreword|author['’]?s? note|notice)\b/i.test(text) ||
      /^(?:ch|vol|part)[-._\s]*\d+/i.test(text);
    const isNumericHeader = /^(?:#\s*\d+|\d+)/.test(text);
    return isChapterKeyword || isNumericHeader;
  };

  if (!isJunk && !isTitleValid(chapterTitle)) {
    chapterTitle = `Chapter ${validChapterCount}`;
  } else if (!isJunk && isTitleValid(chapterTitle)) {
    if (/^\d+/.test(chapterTitle.trim())) {
      chapterTitle = `Chapter ${chapterTitle.trim()}`;
    } else if (/^#\s*\d+/.test(chapterTitle.trim())) {
      chapterTitle = chapterTitle.trim().replace(/^#\s*/, 'Chapter ');
    }
  }

  return { title: chapterTitle, isJunk };
}
