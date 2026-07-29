import JSZip from 'jszip';

// Helper to resolve paths
function resolvePath(baseDir: string, relativePath: string): string {
  if (relativePath.startsWith('/')) return relativePath.substring(1);
  const baseParts = baseDir.split('/').filter(Boolean);
  const relParts = relativePath.split('/');
  for (const part of relParts) {
    if (part === '.') continue;
    if (part === '..') baseParts.pop();
    else baseParts.push(part);
  }
  return baseParts.join('/');
}

// Decode XML entities
function unescapeXml(safe: string): string {
  return safe.replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&apos;/g, "'")
             .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
             .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

// Simple XML tag extractor for worker
function extractTagContent(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? unescapeXml(match[1].trim()) : null;
}

// Helper function to extract attribute values correctly, accommodating namespaces
const getAttribute = (tagXml: string, attr: string): string | null => {
  const regex = new RegExp(`${attr}=(?:"([^"]+)"|'([^']+)')`, 'i');
  const match = tagXml.match(regex);
  return match ? unescapeXml(match[1] || match[2]) : null;
};

self.onmessage = async (e: MessageEvent) => {
  const { file, id } = e.data;
  
  try {
    const zip = await JSZip.loadAsync(file);
    
    // 1. Read container.xml
    const containerFile = zip.file('META-INF/container.xml');
    if (!containerFile) throw new Error('Invalid EPUB: META-INF/container.xml not found.');
    const containerText = await containerFile.async('text');
    
    const opfPathMatch = containerText.match(/<rootfile[^>]+full-path=["']([^"']+)["']/i);
    const opfPath = opfPathMatch ? opfPathMatch[1] : null;
    if (!opfPath) throw new Error('Invalid EPUB: Could not find package OPF file path.');
    
    const opfFile = zip.file(opfPath);
    if (!opfFile) throw new Error(`Invalid EPUB: Package file not found at ${opfPath}`);
    const opfText = await opfFile.async('text');
    
    const lastSlashIndex = opfPath.lastIndexOf('/');
    const opfDir = lastSlashIndex !== -1 ? opfPath.substring(0, lastSlashIndex + 1) : '';
    
    // 2. Extract Metadata using regex
    const title = extractTagContent(opfText, 'dc:title') || extractTagContent(opfText, 'title') || file.name.replace(/\.[^/.]+$/, '');
    const author = extractTagContent(opfText, 'dc:creator') || extractTagContent(opfText, 'creator') || 'Unknown Author';
    
    // Description will be extracted properly on main thread if needed, but we try a simple extract here
    let description = extractTagContent(opfText, 'dc:description') || extractTagContent(opfText, 'description') || '';
    // strip basic tags from description
    description = description.replace(/<[^>]+>/g, '').trim();

    // 3. Parse manifest
    const manifestMap = new Map<string, { href: string; mediaType: string; properties?: string }>();
    const manifestMatch = opfText.match(/<(?:[\w-]+:)?manifest[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?manifest>/i);
    if (manifestMatch) {
      const itemRegex = /<(?:[\w-]+:)?item\s+([^>]+)>/gi;
      let itemMatch;
      while ((itemMatch = itemRegex.exec(manifestMatch[1])) !== null) {
        const attrs = itemMatch[1];
        const itemId = getAttribute(attrs, 'id');
        const href = getAttribute(attrs, 'href');
        const mediaType = getAttribute(attrs, 'media-type');
        const properties = getAttribute(attrs, 'properties');
        if (itemId && href) {
          manifestMap.set(itemId, { href: decodeURIComponent(href), mediaType: mediaType || '', properties: properties || undefined });
        }
      }
    }

    // 4. Parse spine
    const spineIds: string[] = [];
    const spineMatch = opfText.match(/<(?:[\w-]+:)?spine[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?spine>/i);
    if (spineMatch) {
      const itemrefRegex = /<(?:[\w-]+:)?itemref\s+([^>]+)\/?>/gi;
      let refMatch;
      while ((refMatch = itemrefRegex.exec(spineMatch[1])) !== null) {
        const idref = getAttribute(refMatch[1], 'idref');
        if (idref) spineIds.push(idref);
      }
    }

    if (spineIds.length === 0) throw new Error('Invalid EPUB: The spine contains no chapters (itemrefs).');

    // 5. Extract Cover
    let coverUrl: string | null = null;
    let coverItemId: string | null = null;
    for (const [itemId, item] of manifestMap.entries()) {
      if (item.properties?.includes('cover-image')) {
        coverItemId = itemId;
        break;
      }
    }
    if (!coverItemId) {
      const coverMetaMatch = opfText.match(/<meta\s+name=["']cover["']\s+content=["']([^"']+)["']/i) || opfText.match(/<meta\s+content=["']([^"']+)["']\s+name=["']cover["']/i);
      if (coverMetaMatch) coverItemId = coverMetaMatch[1];
    }
    if (!coverItemId) {
      for (const [itemId, item] of manifestMap.entries()) {
        const lowerId = itemId.toLowerCase();
        const lowerHref = item.href.toLowerCase();
        if (item.mediaType.startsWith('image/') && (lowerId.includes('cover') || lowerHref.includes('cover'))) {
          coverItemId = itemId;
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
          const base64 = await imgFile.async('base64');
          coverUrl = `data:${coverItem.mediaType};base64,${base64}`;
        }
      }
    }

    // 6. Extract Raw Chapter Texts
    const rawChapters = [];
    for (const idref of spineIds) {
      const item = manifestMap.get(idref);
      if (!item) continue;
      const mt = item.mediaType.toLowerCase();
      if (!mt.includes('xml') && !mt.includes('html') && !mt.includes('xhtml')) continue;

      const chapterPath = resolvePath(opfDir, item.href);
      const chapterFile = zip.file(chapterPath);
      if (!chapterFile) continue;

      const rawContent = await chapterFile.async('text');
      rawChapters.push({
        idref,
        href: item.href,
        rawContent
      });
    }

    self.postMessage({
      id,
      success: true,
      data: {
        title,
        author,
        description,
        coverUrl,
        fileName: file.name,
        rawChapters
      }
    });

  } catch (err: unknown) {
    self.postMessage({
      id,
      success: false,
      error: err instanceof Error ? err.message : String(err)
    });
  }
};
