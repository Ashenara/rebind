/**
 * Centralized configuration and helpers for filtering junk files (covers, credits, title pages, etc.) from EPUBs.
 * Imported from novels project.
 */

export const JUNK_EXACT_LABELS = [
  "cover",
  "cover page",
  "title",
  "title page",
  "description",
  "synopsis",
  "table of contents",
  "toc",
  "contents",
  "info",
  "information",
  "about",
  "credits",
  "copyright",
  "front page",
  "intro page",
  "front",
  "intro",
  "volume",
  "jilid",
  "auxiliary",
  "auxillary",
  "auxiliary chapter",
  "auxillary chapter",
  // Indonesian translations
  "daftar isi",
  "halaman judul",
  "hak cipta",
  "sampul",
  "sinopsis",
  // Chinese translations
  "目录",
  "章节目录",
  "扉页",
  "书名页",
  "版权",
  "版权页",
  "封面",
  "简介"
];

export const JUNK_BASE_NAMES = [
  "info",
  "information",
  "about",
  "credits",
  "title",
  "titlepage",
  "cover",
  "coverpage",
  "copyright",
  "toc",
  "nav",
  "front",
  "intro",
  "volume",
  "jilid",
  "auxiliary",
  "auxillary",
  "description",
  "synopsis"
];

/**
 * Checks if a given EPUB spine/TOC item's label is a known junk label.
 */
export function isJunkLabel(label: string): boolean {
  const normalized = label.trim().toLowerCase();

  // 1. Prefix/structural page checks (Table of Contents, Title Page, Synopsis, Cover, Auxiliary, Copyright)
  const structuralPatterns = [
    /^(table of contents|contents|daftar isi|目录|章节目录)(?:\s|$|:|-)/i,
    /^(title page|halaman judul|书名页|扉页)(?:\s|$|:|-)/i,
    /^(cover|sampul|封面)(?:\s|$|:|-)/i,
    /^(copyright|hak cipta|版权页?)(?:\s|$|:|-)/i,
    /^(synopsis|sinopsis|简介)(?:\s|$|:|-)/i,
    /^(about|credits|info|information)(?:\s|$|:|-)/i,
    /^auxil{1,2}i?ary(?:\s|$|:|-)/i
  ];

  if (structuralPatterns.some(pattern => pattern.test(normalized))) {
    return true;
  }
  
  // 2. If the label clearly indicates a chapter/part/ch, it's not junk!
  if (
    normalized.includes("chapter") ||
    /ch[-_.]?\d+/i.test(normalized) ||
    /ch\s+\d+/i.test(normalized) ||
    /\bch\b/i.test(normalized) ||
    /\bpart\b/i.test(normalized) ||
    /第\s*\d+\s*[章回]/i.test(normalized)
  ) {
    return false;
  }
  
  // 3. Exact match against known junk labels
  if (JUNK_EXACT_LABELS.includes(normalized)) {
    return true;
  }
  
  // 4. Substring matches for explicit junk terms
  const junkContainsTerms = [
    "table of contents",
    "daftar isi",
    "目录",
    "章节目录",
    "copyright",
    "hak cipta",
    "版权页",
    "cover page",
    "title page",
    "halaman judul",
    "书名页"
  ];
  
  if (junkContainsTerms.some(term => normalized.includes(term))) {
    return true;
  }
  
  // 5. Match specific volume header labels (e.g. "Volume 1", "Vol. II")
  // but NOT chapters like "Volume 1 Chapter 5" or "Volume 1: The Fight"
  const volHeaderLabelPattern = /^(volume|jilid|vol\.?)\s*(:?\s*([-_.#\d]+|[ivx]+|one|two|three|four|five|six|seven|eight|nine|ten))?$/i;
  if (volHeaderLabelPattern.test(normalized)) {
    return true;
  }
  
  return false;
}

/**
 * Checks if a given EPUB item's href indicates that it is a junk file (e.g. cover, title page, copyright page).
 */
export function isJunkHref(href: string): boolean {
  const lowerHref = href.toLowerCase();
  
  // Extract filename and check baseName
  const filename = lowerHref.split("/").pop()?.split("#")[0] || "";
  const baseName = filename.replace(/\.x?html?$/, "");
  
  // Clean base name by stripping leading numbers and separators (e.g. 0000_information -> information, 2.description -> description)
  const cleanBaseName = baseName.replace(/^\d+[-_.]/, "");

  // 1. Check override structural junk patterns first (always junk, even if they contain "chapter" or "part")
  const overrideJunkPatterns = [
    /^toc([-_.]|$)/i, /([-_.])toc$/i, /[-_.]toc[-_.]/i,
    /^(table[-_]of[-_]contents|contents|daftar[-_]isi|目录|章节目录)([-_.]|$)/i,
    /^copyright([-_.]|$)/i, /([-_.])copyright$/i,
    /^title[-_]?page([-_.]|$)/i, /([-_.])title[-_]?page$/i,
    /^navmap([-_.]|$)/i, /([-_.])navmap$/i,
    /^auxil{1,2}i?ary([-_.]|$)/i
  ];

  if (overrideJunkPatterns.some(pattern => pattern.test(baseName) || pattern.test(cleanBaseName))) {
    return true;
  }

  // 2. Exact match against known junk base names
  if (JUNK_BASE_NAMES.includes(baseName) || JUNK_BASE_NAMES.includes(cleanBaseName)) {
    return true;
  }

  // 3. Chapter protection guards - run ONLY against filename (not the full path href)
  if (
    filename.includes("chapter") ||
    /ch[-_.]?\d+/i.test(filename) ||
    /ch\s+\d+/i.test(filename) ||
    /chapter[-_.]?\d+/i.test(filename) ||
    /part[-_.]?\d+/i.test(filename)
  ) {
    return false;
  }

  // 4. Substring/regex matches for other junk patterns
  const otherJunkPatterns = [
    /^intro([-_.]|$)/i,
    /^front([-_.]|$)/i,
    /^info([-_.]|$)/i,
    /^information([-_.]|$)/i,
    /^cover([-_.]|$)/i, /([-_.])cover$/i, /[-_.]cover[-_.]/i
  ];

  if (otherJunkPatterns.some(pattern => pattern.test(baseName) || pattern.test(cleanBaseName))) {
    return true;
  }

  // 5. Volume divider specific patterns
  // Matches volume dividers specifically (e.g., volume_1, jilid-01, vol-ii) but NOT chapters like volume_1_1 or volume_1_ch1
  const volDividerPattern = /^(volume|jilid|vol)([-_.]?(\d+|[ivx]+|one|two|three|four|five|six|seven|eight|nine|ten))?$/i;
  if (volDividerPattern.test(baseName) || volDividerPattern.test(cleanBaseName)) {
    return true;
  }
  
  return false;
}
