import React from 'react';

interface MentionTextProps {
  text: string;
  className?: string;
}

const MENTION_REGEX = /@\[([^\]]+)\]\(([a-f0-9]{24})\)/g;

const MentionText: React.FC<MentionTextProps> = ({ text, className }) => {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(MENTION_REGEX.source, 'g');

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span
        key={match.index}
        className="text-primary-600 dark:text-primary-400 font-medium"
      >
        @{match[1]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <p className={className}>{parts}</p>;
};

export default MentionText;
