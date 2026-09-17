import type { PIIEntity } from './types';

export function calculateEntropy(str: string): number {
  if (!str) return 0;
  const map = new Map<string, number>();
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    map.set(char, (map.get(char) || 0) + 1);
  }
  let entropy = 0;
  const len = str.length;
  for (const count of map.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

interface PatternDef {
  group: string;
  regex: RegExp;
  validate?: (match: RegExpExecArray, text: string) => boolean;
}

const PATTERNS: PatternDef[] = [
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
    // Matches 16 digits (Visa/MC) and 15 digits (Amex), with optional spaces/dashes
    regex: /\b(?:(?:\d{4}[-\s]?){3}\d{4}|3[47]\d{2}[-\s]?\d{6}[-\s]?\d{5})\b/g
  },
  {
    group: 'CVV',
    // 3 to 4 digit sequence
    regex: /\b\d{3,4}\b/g,
    validate: (match, text) => {
      // 50-character proximity window
      const start = Math.max(0, match.index - 50);
      const end = Math.min(text.length, match.index + match[0].length + 50);
      const windowStr = text.substring(start, end).toLowerCase();
      
      // Proximity check for CC format or CVV keywords
      const hasKeywords = /cvv|cvc|security code/.test(windowStr);
      const hasCard = /(?:(?:\d{4}[-\s]?){3}\d{4}|3[47]\d{2}[-\s]?\d{6}[-\s]?\d{5})/.test(windowStr);
      
      return hasKeywords || hasCard;
    }
  },
  {
    group: 'JWT',
    // JWTs generally start with eyJ (which is '{"' in base64url). Three segments separated by dots.
    regex: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g
  },
  {
    group: 'PRIVATE_KEY',
    // PEM format boundaries. Matches across newlines.
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[A-Za-z0-9+/\s=]+-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g
  },
  {
    group: 'EXPIRY_DATE',
    // Matches MM/YY or MM/YYYY
    regex: /\b(0[1-9]|1[0-2])\/?([0-9]{4}|[0-9]{2})\b/g,
    validate: (match, text) => {
      // 50-character proximity window
      const start = Math.max(0, match.index - 50);
      const end = Math.min(text.length, match.index + match[0].length + 50);
      const windowStr = text.substring(start, end).toLowerCase();
      // Proximity check for expiration keywords or CC format
      return /exp|expiration|valid thru/.test(windowStr) || /(?:(?:\d{4}[-\s]?){3}\d{4}|3[47]\d{2}[-\s]?\d{6}[-\s]?\d{5})/.test(windowStr);
    }
  },
  {
    group: 'SENDGRID_KEY',
    // SendGrid API Key pattern SG.[chars].[chars]
    regex: /\bSG\.[A-Za-z0-9_-]{10,40}\.[A-Za-z0-9_-]{30,60}\b/g
  },
  {
    group: 'AWS_ACCESS_KEY',
    // AWS Access Key ID pattern (AKIA, ASIA, ABIA, ACCA followed by 16 base-32 chars)
    regex: /\b((?:AKIA|ASIA|ABIA|ACCA)[A-Z2-7]{16})\b/g
  },
  {
    group: 'GENERIC_SECRET',
    // Catches unquoted secrets, generic assignments including session cookies. 
    // match[1] = key name, match[2] = operator, match[3] = payload
    regex: /((?:key|api|token|secret|password|auth|session|cookie)[\w.,-]{0,25})([=>:]|:=)[ \t]{0,5}['"]?([\w=\-%.]{16,128})['"]?/gi,
    validate: (match, _text) => {
      // match[3] is the extracted secret payload
      return calculateEntropy(match[3]) > 3.0;
    }
  },
  {
    group: 'INTERNAL_SYSTEM',
    // Internal Server/Database Naming Rule
    regex: /\b[A-Z0-9]{2,10}-DB-[A-Z0-9-]{1,10}\b/g
  },
  {
    group: 'CONFIDENTIAL_PROJECT',
    // Project Codename Naming Rule
    regex: /\bPROJECT\s+[A-Z0-9_-]+(?:\s*\(CONFIDENTIAL\))?\b/g
  }
];

export function runRegexEngine(text: string): PIIEntity[] {
  const entities: PIIEntity[] = [];

  for (const pattern of PATTERNS) {
    let match;
    while ((match = pattern.regex.exec(text)) !== null) {
      if (pattern.validate && !pattern.validate(match, text)) {
        continue;
      }
      
      let start = match.index;
      let end = match.index + match[0].length;
      let word = match[0];
      
      // For generic secrets, we specifically extract and mask the secret string payload
      if (pattern.group === 'GENERIC_SECRET' && match[3]) {
        const secretIndex = match[0].lastIndexOf(match[3]);
        start = match.index + secretIndex;
        end = start + match[3].length;
        word = match[3];
      }

      entities.push({
        entity_group: pattern.group,
        score: 1.0, // Deterministic regex match
        word: word,
        start: start,
        end: end
      });
    }
  }

  return entities;
}
