import type { PIIEntity } from './types';

const PATTERNS = [
  {
    group: 'EMAIL',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
  },
  {
    group: 'PHONE_US',
    // Matches (123) 456-7890, 123-456-7890, 123.456.7890, etc.
    regex: /(?:\+?1[-.\s]?)?(?:\(\d{3}\)|\d{3})[-.\s]?\d{3}[-.\s]?\d{4}\b/g
  },
  {
    group: 'PHONE_IN',
    // Matches +91 9876543210, 98765 43210, 09876543210, etc.
    regex: /(?:\+91[-.\s]?)?(?:0)?\d{5}[-.\s]?\d{5}\b/g
  },
  {
    group: 'SSN',
    // Matches XXX-XX-XXXX
    regex: /\b\d{3}-\d{2}-\d{4}\b/g
  },
  {
    group: 'CREDIT_CARD',
    // Matches 16 digits, with optional spaces/dashes
    regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g
  }
];

export function runRegexEngine(text: string): PIIEntity[] {
  const entities: PIIEntity[] = [];

  for (const pattern of PATTERNS) {
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      entities.push({
        entity_group: pattern.group,
        score: 1.0, // Deterministic regex
        word: match[0],
        start: match.index,
        end: match.index + match[0].length
      });
    }
  }

  return entities;
}
