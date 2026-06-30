import { useMemo } from 'react';
import type { PIIEntity } from '../core/types';

interface Props {
  text: string;
  entities: PIIEntity[];
}

const CATEGORY_COLORS: Record<string, string> = {
  'EMAIL': 'bg-[#00FFFF]', // Cyan
  'PHONE_US': 'bg-[#67D044]', // Lime
  'PHONE_IN': 'bg-[#67D044]',
  'SSN': 'bg-[#FF0000] text-white', // Red
  'CREDIT_CARD': 'bg-[#FF00FF] text-white', // Magenta
  'PERSON': 'bg-[#FFFF00]', // Yellow
  'ORG': 'bg-[#FF8800]', // Orange
  'LOC': 'bg-[#0088FF] text-white', // Blue
  'DATE': 'bg-[#FFBBBB]', // Pink
};

const DEFAULT_COLOR = 'bg-black text-white';

export default function HighlighterView({ text, entities }: Props) {
  const renderedSpans = useMemo(() => {
    const nodes: React.ReactNode[] = [];
    let cursor = 0;

    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];

      if (entity.start < cursor) {
        continue; // Skip overlaps if they somehow exist
      }

      if (entity.start > cursor) {
        nodes.push(
          <span key={`text-${i}`} className="whitespace-pre-wrap">
            {text.substring(cursor, entity.start)}
          </span>
        );
      }

      const primaryGroup = entity.entity_group.split('|')[0] || entity.entity_group;
      const normalizedGroup = primaryGroup.replace(/^[BIES]-/, '');
      const colorClass = CATEGORY_COLORS[normalizedGroup] || DEFAULT_COLOR;

      nodes.push(
        <mark
          key={`entity-${i}`}
          className={`inline-block border-2 border-black font-bold uppercase mx-0.5 px-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${colorClass}`}
          title={`${entity.entity_group} (${(entity.score * 100).toFixed(0)}%)`}
        >
          {text.substring(entity.start, entity.end)}
        </mark>
      );

      cursor = entity.end;
    }

    if (cursor < text.length) {
      nodes.push(
        <span key="text-end" className="whitespace-pre-wrap">
          {text.substring(cursor)}
        </span>
      );
    }

    return nodes;
  }, [text, entities]);

  return (
    <div
      className="font-mono text-base md:text-lg leading-relaxed text-black p-6 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-y-auto max-h-[60vh]"
      aria-label="Highlighted document view"
    >
      {renderedSpans}
    </div>
  );
}
