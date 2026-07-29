import JSZip from 'jszip';
import type { Chapter } from '../types';
import { escapeHtml } from './textCleaner';

interface Metadata {
  title: string;
  author: string;
  language: string;
  publisher?: string;
  description?: string;
}

/**
 * Reconstructs a collection of chapters and metadata into a valid EPUB 3 file.
 * Returns a Blob ready for download.
 */
export async function generateEpub(
  metadata: Metadata,
  chapters: Chapter[],
  coverUrl: string | null,
  log: (msg: string) => void
): Promise<Blob> {
  log('[Generator] Starting EPUB generation...');
  const zip = new JSZip();

  const lang = metadata.language || 'en';
  const uuid = `urn:uuid:${crypto.randomUUID()}`;
  
  // Format modified time for OPF (must be UTC ISO 8601 without milliseconds, e.g., YYYY-MM-DDTHH:MM:SSZ)
  const modifiedDate = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

  // 1. mimetype (MUST be first, uncompressed)
  // We use STORE method (no compression) for mimetype file
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  log('[Generator] Created mimetype file.');

  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.file('META-INF/container.xml', containerXml);
  log('[Generator] Created container.xml');

  // 3. Cover Image extraction
  let coverFilename = '';
  let coverMime = '';
  
  if (coverUrl && coverUrl.startsWith('data:')) {
    const matches = coverUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      coverMime = matches[1];
      const coverData = matches[2];
      const extension = coverMime.split('/')[1] || 'jpg';
      coverFilename = `cover.${extension}`;
      
      // Save cover file in images folder
      zip.file(`OEBPS/images/${coverFilename}`, coverData, { base64: true });
      log(`[Generator] Added cover image: OEBPS/images/${coverFilename}`);
    }
  }

  // 4. Create Stylesheet (OEBPS/styles/style.css)
  // Supports premium reading layouts
  let stylesheet = `body {
  margin: 5% 5% 5% 5%;
  font-family: "Georgia", "Liberation Serif", "Times New Roman", serif;
  line-height: 1.6;
  color: #111111;
}
h1, h2, h3, h4, h5, h6 {
  font-family: system-ui, -apple-system, sans-serif;
  text-align: center;
  margin-top: 1.8em;
  margin-bottom: 0.8em;
  line-height: 1.2;
}
h1 { font-size: 1.8em; border-bottom: 1px solid #eeeeee; padding-bottom: 0.3em; }
h2 { font-size: 1.5em; }
h3 { font-size: 1.3em; }
blockquote {
  font-style: italic;
  margin-left: 1.5em;
  color: #555555;
  border-left: 3px solid #cccccc;
  padding-left: 0.8em;
}
`;

  // Document/Web spacing: margin between paragraphs, no indent
  stylesheet += `p {
  text-indent: 0;
  margin-top: 0;
  margin-bottom: 0.8em;
  text-align: left;
}
`;

  zip.file('OEBPS/styles/style.css', stylesheet);
  log('[Generator] Created stylesheet style.css');

  // 5. Generate Chapters (OEBPS/text/chapter_X.xhtml)
  // EPUB 3 requires XHTML (meaning tags must close, be namespaces-aware)
  const activeChapters = chapters.filter(c => !c.exclude);
  
  activeChapters.forEach((chapter, idx) => {
    const filename = `chapter_${idx + 1}.xhtml`;
    const chapterHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}" lang="${lang}">
<head>
  <title>${escapeHtml(chapter.title)}</title>
  <link rel="stylesheet" href="../styles/style.css" type="text/css" />
</head>
<body>
  <section epub:type="chapter" id="chapter_${idx + 1}">
    <h1>${escapeHtml(chapter.title)}</h1>
    ${chapter.cleanedContent}
  </section>
</body>
</html>`;
    
    zip.file(`OEBPS/text/${filename}`, chapterHtml);
    log(`[Generator] Packaged chapter ${idx + 1}/${activeChapters.length}: ${chapter.title}`);
  });

  // 6. Generate EPUB 3 Navigation Document (OEBPS/nav.xhtml)
  const navLinks = activeChapters
    .map((ch, idx) => `        <li><a href="text/chapter_${idx + 1}.xhtml">${escapeHtml(ch.title)}</a></li>`)
    .join('\n');

  const navHtml = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}" lang="${lang}">
<head>
  <title>Table of Contents</title>
  <link rel="stylesheet" href="styles/style.css" type="text/css" />
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
${navLinks}
    </ol>
  </nav>
</body>
</html>`;
  zip.file('OEBPS/nav.xhtml', navHtml);
  log('[Generator] Created nav.xhtml Table of Contents');

  // 7. Generate NCX Navigation (OEBPS/toc.ncx) for EPUB 2 compatibility
  const ncxPoints = activeChapters
    .map((ch, idx) => `    <navPoint id="navPoint-${idx + 1}" playOrder="${idx + 1}">
      <navLabel>
        <text>${escapeHtml(ch.title)}</text>
      </navLabel>
      <content src="text/chapter_${idx + 1}.xhtml"/>
    </navPoint>`)
    .join('\n');

  const ncxXml = `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${escapeHtml(metadata.title)}</text>
  </docTitle>
  <navMap>
${ncxPoints}
  </navMap>
</ncx>`;
  zip.file('OEBPS/toc.ncx', ncxXml);
  log('[Generator] Created toc.ncx');

  // 8. Generate Package XML (OEBPS/content.opf)
  const coverMeta = coverFilename 
    ? `\n    <meta name="cover" content="cover-image"/>` 
    : '';
  const coverManifest = coverFilename 
    ? `\n    <item id="cover-image" href="images/${coverFilename}" media-type="${coverMime}" properties="cover-image"/>` 
    : '';
  
  const manifestItemsHtml = activeChapters
    .map((_, idx) => `    <item id="chapter_${idx + 1}" href="text/chapter_${idx + 1}.xhtml" media-type="application/xhtml+xml"/>`)
    .join('\n');
    
  const spineItemsHtml = activeChapters
    .map((_, idx) => `    <itemref idref="chapter_${idx + 1}"/>`)
    .join('\n');

  const descriptionElement = metadata.description
    ? `\n    <dc:description>${escapeHtml(metadata.description)}</dc:description>`
    : '';
  
  const publisherElement = metadata.publisher
    ? `\n    <dc:publisher>${escapeHtml(metadata.publisher)}</dc:publisher>`
    : '';

  const opfXml = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="pub-id" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">${uuid}</dc:identifier>
    <dc:title>${escapeHtml(metadata.title)}</dc:title>
    <dc:creator id="creator">${escapeHtml(metadata.author)}</dc:creator>
    <meta refines="#creator" property="role" scheme="marc:relators">aut</meta>
    <dc:language>${lang}</dc:language>
    <meta property="dcterms:modified">${modifiedDate}</meta>${coverMeta}${descriptionElement}${publisherElement}
  </metadata>
  <manifest>
    <item id="style" href="styles/style.css" media-type="text/css"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>${coverManifest}
${manifestItemsHtml}
  </manifest>
  <spine toc="ncx">
${spineItemsHtml}
  </spine>
</package>`;

  zip.file('OEBPS/content.opf', opfXml);
  log('[Generator] Created package content.opf');

  // 9. Generate ZIP Blob
  log('[Generator] Compressing ZIP archive...');
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9 // Maximum compression
    }
  });
  log('[Generator] EPUB Blob successfully generated!');
  return blob;
}
