export interface PIIEntity {
  /** Standard AI tags (PERSON, ORG, LOC, etc) or Custom (INTERNAL_SYSTEM, CONFIDENTIAL_PROJECT, etc) */
  entity_group: string;
  score: number;
  word: string;
  start: number;
  end: number;
}
