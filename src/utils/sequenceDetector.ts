import type { Chapter } from '../types';

export interface SpineIssue {
  type: 'gap' | 'duplicate_number' | 'out_of_order';
  message: string;
  chapterId?: string;
  afterChapterId?: string;
  missingNumbers?: number[];
}

export function extractVolumeNumber(title: string): number | null {
  const match = title.match(/\b(?:volume|vol\.?|jilid|book)\s*(\d+(?:\.\d+)?)\b/i);
  if (match) {
    return parseFloat(match[1]);
  }
  return null;
}

export function extractChapterNumber(title: string): number | null {
  // Remove volume and part indicators so they aren't mistakenly parsed as chapter numbers
  let safeTitle = title.replace(/\b(?:volume|vol\.?|jilid|book)\s*\d+(?:\.\d+)?\b/gi, '');
  safeTitle = safeTitle.replace(/(?:\[|\(|\b)?(?:part|pt\.?)\s*(\d+)(?:\]|\)|\b)?/gi, '');

  const getNumWithSuffix = (numStr: string, suffix: string | undefined, fullTitle: string) => {
    let num = parseFloat(numStr);
    if (suffix) {
      const charCode = suffix.toLowerCase().charCodeAt(0);
      num += (charCode - 96) / 1000; // 'a' -> .001, 'b' -> .002
    } else {
      const partMatch = fullTitle.match(/(?:\[|\(|\b)?(?:part|pt\.?)\s*(\d+)(?:\]|\)|\b)?/i);
      if (partMatch) {
        const partNum = parseFloat(partMatch[1]);
        if (num !== partNum) {
          num += partNum / 1000;
        }
      } else {
        const fractionMatch = fullTitle.match(/\[?\(\s*(\d+)\s*\/\s*\d+\s*\)\]?/);
        if (fractionMatch) {
          const fracNum = parseFloat(fractionMatch[1]);
          if (num !== fracNum) {
            num += fracNum / 1000;
          }
        }
      }
    }
    return num;
  };

  // 1. Explicit indicator: "Chapter 123", "Ch. 123", "Ch123", "Episode 123", "No. 123"
  const explicitRegex = /(?:chapter|ch\.?|episode|no\.?)\s*(\d+(?:\.\d+)?)([a-z])?\b/i;
  const explicitMatch = safeTitle.match(explicitRegex);
  if (explicitMatch) {
    return getNumWithSuffix(explicitMatch[1], explicitMatch[2], title);
  }

  // 2. Standalone number at the start: "543. Nascent Transformation" or "543A - Nascent"
  const startRegex = /^\s*(\d+(?:\.\d+)?)([a-z])?(?:\s*[:\-.)]|\s+|$)/i;
  const startMatch = safeTitle.match(startRegex);
  if (startMatch) {
    return getNumWithSuffix(startMatch[1], startMatch[2], title);
  }

  // 3. Standalone number at the end: "Nascent Transformation 543A"
  const endRegex = /(?:\b|\s)(\d+(?:\.\d+)?)([a-z])?\s*$/i;
  const endMatch = safeTitle.match(endRegex);
  if (endMatch) {
    return getNumWithSuffix(endMatch[1], endMatch[2], title);
  }

  // 4. Any standalone number in the title: "Nascent 543A Transformation"
  const generalRegex = /\b(\d+(?:\.\d+)?)([a-z])?\b/i;
  const generalMatch = safeTitle.match(generalRegex);
  if (generalMatch) {
    return getNumWithSuffix(generalMatch[1], generalMatch[2], title);
  }

  return null;
}

export function getChapterCandidates(title: string): number[] {
  const candidates: number[] = [];
  
  // Get primary match from standard parsing rules
  const primary = extractChapterNumber(title);
  if (primary !== null) {
    candidates.push(primary);
  }
  
  // Remove volume indicators so they aren't mistakenly parsed as chapter numbers
  let safeTitle = title.replace(/\b(?:volume|vol\.?|jilid|book)\s*\d+(?:\.\d+)?\b/gi, '');
  safeTitle = safeTitle.replace(/(?:\[|\(|\b)?(?:part|pt\.?)\s*(\d+)(?:\]|\)|\b)?/gi, '');
  
  // Extract all other standalone numbers found in the title
  const regex = /(\d+(?:\.\d+)?)([a-z])?\b/gi;
  let match;
  while ((match = regex.exec(safeTitle)) !== null) {
    let val = parseFloat(match[1]);
    if (match[2]) {
      const charCode = match[2].toLowerCase().charCodeAt(0);
      val += (charCode - 96) / 1000;
    } else {
      const partMatch = title.match(/(?:\[|\(|\b)?(?:part|pt\.?)\s*(\d+)(?:\]|\)|\b)?/i);
      if (partMatch) {
        const partNum = parseFloat(partMatch[1]);
        if (val !== partNum) {
          val += partNum / 1000;
        }
      } else {
        const fractionMatch = title.match(/\[?\(\s*(\d+)\s*\/\s*\d+\s*\)\]?/);
        if (fractionMatch) {
          const fracNum = parseFloat(fractionMatch[1]);
          if (val !== fracNum) {
            val += fracNum / 1000;
          }
        }
      }
    }
    if (!isNaN(val) && !candidates.includes(val)) {
      candidates.push(val);
    }
  }
  
  return candidates;
}

export function detectSpineIssues(chapters: Chapter[]) {
  const activeChapters = chapters.filter(c => !c.exclude);
  const issues: SpineIssue[] = [];
  const duplicateIds = new Set<string>();
  const outOfOrderIds = new Set<string>();
  
  // 1. Extract candidate numbers for each chapter
  const items = activeChapters.map(ch => {
    if (!ch._cachedCandidateNumbers) {
      ch._cachedCandidateNumbers = getChapterCandidates(ch.title);
    }
    return {
      id: ch.id,
      title: ch.title,
      candidates: ch._cachedCandidateNumbers,
      resolvedNum: null as number | null
    };
  });

  // Initialize with the primary candidate (index 0)
  items.forEach(item => {
    if (item.candidates.length > 0) {
      item.resolvedNum = item.candidates[0];
    }
  });

  // Pass 1: Forward Sweep (left-to-right) context propagation
  for (let i = 1; i < items.length; i++) {
    const item = items[i];
    if (item.candidates.length <= 1) continue;
    const prevNum = items[i - 1].resolvedNum;
    if (prevNum !== null) {
      let bestCand = item.resolvedNum;
      let maxScore = -1;
      for (const cand of item.candidates) {
        let score = 0;
        if (cand === prevNum + 1) score = 10;
        else if (cand === prevNum) score = 8;
        else if (cand > prevNum && cand - prevNum <= 5) score = 4;
        else if (cand > prevNum) score = 2;
        
        if (score > maxScore) {
          maxScore = score;
          bestCand = cand;
        }
      }
      if (maxScore > 0) {
        item.resolvedNum = bestCand;
      }
    }
  }

  // Pass 2: Backward Sweep (right-to-left) context propagation
  for (let i = items.length - 2; i >= 0; i--) {
    const item = items[i];
    if (item.candidates.length <= 1) continue;
    const nextNum = items[i + 1].resolvedNum;
    if (nextNum !== null) {
      let bestCand = item.resolvedNum;
      let maxScore = -1;
      for (const cand of item.candidates) {
        let score = 0;
        if (cand === nextNum - 1) score = 10;
        else if (cand === nextNum) score = 8;
        else if (cand < nextNum && nextNum - cand <= 5) score = 4;
        else if (cand < nextNum) score = 2;
        
        if (score > maxScore) {
          maxScore = score;
          bestCand = cand;
        }
      }
      if (maxScore > 0) {
        item.resolvedNum = bestCand;
      }
    }
  }

  // Pass 3: Iterative Bidirectional Refinement for local corrections
  for (let pass = 0; pass < 3; pass++) {
    let changed = false;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.candidates.length <= 1) continue; // no choices

      const prevNum = i > 0 ? items[i - 1].resolvedNum : null;
      const nextNum = i < items.length - 1 ? items[i + 1].resolvedNum : null;

      let bestCandidate = item.resolvedNum;
      let highestScore = 0;

      for (const cand of item.candidates) {
        let score = 0;
        
        if (prevNum !== null) {
          if (cand === prevNum + 1) score += 10; // perfect order with previous
          else if (cand === prevNum) score += 8;  // repeat/part of the same chapter (duplicate)
          else if (cand > prevNum) score += 2;    // ascending order
        }
        
        if (nextNum !== null) {
          if (cand === nextNum - 1) score += 10; // perfect order with next
          else if (cand === nextNum) score += 8;  // repeat/part of the same chapter (duplicate)
          else if (cand < nextNum) score += 2;    // descending from next
        }
        
        if (prevNum !== null && nextNum !== null && cand > prevNum && cand < nextNum) {
          score += 5; // fits perfectly in range
        }

        if (score > highestScore) {
          highestScore = score;
          bestCandidate = cand;
        }
      }

      if (highestScore >= 5 && bestCandidate !== item.resolvedNum) {
        item.resolvedNum = bestCandidate;
        changed = true;
      }
    }
    
    if (!changed) break; // if no updates made in this pass, resolution is complete
  }
  
  // Convert items back to validation structure with resolved numbers and volume numbers
  let currentVol: number | null = null;
  const activeChapterNums = items.map(item => {
    let volNum = extractVolumeNumber(item.title);
    if (volNum !== null) {
      currentVol = volNum;
    } else {
      volNum = currentVol;
    }
    return {
      id: item.id,
      title: item.title,
      num: item.resolvedNum,
      volNum: volNum
    };
  });

  // Find duplicates
  const numToChapters: { [key: string]: string[] } = {};
  activeChapterNums.forEach(item => {
    if (item.num !== null) {
      const key = item.volNum !== null ? `${item.volNum}-${item.num}` : `${item.num}`;
      if (!numToChapters[key]) {
        numToChapters[key] = [];
      }
      numToChapters[key].push(item.id);
    }
  });
  
  Object.keys(numToChapters).forEach(key => {
    const ids = numToChapters[key];
    if (ids.length > 1) {
      ids.forEach((id) => {
        duplicateIds.add(id);
        const displayNum = key.includes('-') ? key.split('-')[1] : key;
        issues.push({
          type: 'duplicate_number',
          message: `Duplicate: Chapter ${displayNum}`,
          chapterId: id
        });
      });
    }
  });

  // Track sequence issues (gaps and out-of-order)
  let lastNum: number | null = null;
  let lastId: string | null = null;
  let lastVol: number | null = null;
  
  activeChapterNums.forEach((item) => {
    if (item.num !== null) {
      if (lastNum !== null && lastId !== null) {
        const isNewVolume = lastVol !== null && item.volNum !== null && item.volNum > lastVol;
        
        // If it's a new volume, we expect the number to restart or just jump. 
        // We will skip gap/out-of-order checks across volume boundaries.
        if (!isNewVolume) {
          if (item.num < lastNum) {
            issues.push({
              type: 'out_of_order',
              message: `Out of order: Chapter ${item.num} follows Chapter ${lastNum}`,
              chapterId: item.id
            });
            outOfOrderIds.add(item.id);
          } else if (item.num > lastNum + 1.001) {
            const start = Math.floor(lastNum) + 1;
            const end = Math.floor(item.num) - 1;
            if (end >= start) {
              const missing: number[] = [];
              for (let n = start; n <= end; n++) {
                missing.push(n);
              }
              if (missing.length > 0) {
                issues.push({
                  type: 'gap',
                  message: `Missing: Chapter ${missing.join(', ')}`,
                  afterChapterId: lastId,
                  missingNumbers: missing
                });
              }
            }
          }
        }
      }
      lastNum = item.num;
      lastId = item.id;
      lastVol = item.volNum;
    }
  });
  
  return {
    issues,
    duplicateIds,
    outOfOrderIds
  };
}
