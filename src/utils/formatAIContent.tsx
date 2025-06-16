
import React from 'react';

export const formatAIContent = (content: string): JSX.Element[] => {
  if (!content) return [];

  // Clean the content first - remove asterisks and hash signs
  const cleanContent = content
    .replace(/\*+/g, '') // Remove all asterisks
    .replace(/#+/g, '') // Remove all hash signs
    .trim();

  const lines = cleanContent.split('\n').filter(line => line.trim());
  const formattedElements: JSX.Element[] = [];
  let key = 0;

  // Emoji mapping for numbered sections
  const emojiMap: { [key: string]: string } = {
    '1': '🎯',
    '2': '🚀',
    '3': '💡',
    '4': '⚡',
    '5': '🔥',
    '6': '💪',
    '7': '🌟',
    '8': '🎨',
    '9': '🔮',
    '10': '🏆'
  };

  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    // Check if it's a numbered header (1., 2., 3., etc.)
    const headerMatch = trimmedLine.match(/^(\d+)\.\s*(.+)$/);
    if (headerMatch) {
      const [, number, headerText] = headerMatch;
      const emoji = emojiMap[number] || '📌';
      
      formattedElements.push(
        <div key={key++} className="mb-4 mt-6 first:mt-0">
          <h4 className="text-base font-semibold underline decoration-2 decoration-primary/30">
            {emoji} {headerText}
          </h4>
        </div>
      );
      return;
    }

    // Check if it's a bullet point
    if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
      const bulletContent = trimmedLine.replace(/^[•\-*]\s*/, '');
      
      // Check if bullet point has a colon separator
      const colonIndex = bulletContent.indexOf(':');
      if (colonIndex > 0) {
        const beforeColon = bulletContent.substring(0, colonIndex).trim();
        const afterColon = bulletContent.substring(colonIndex + 1).trim();
        
        formattedElements.push(
          <div key={key++} className="flex items-start mb-3">
            <span className="text-primary mr-2 mt-1 text-sm">•</span>
            <div className="text-sm leading-relaxed">
              <span className="font-semibold">{beforeColon}:</span>
              <span className="ml-1">{afterColon}</span>
            </div>
          </div>
        );
      } else {
        formattedElements.push(
          <div key={key++} className="flex items-start mb-3">
            <span className="text-primary mr-2 mt-1 text-sm">•</span>
            <span className="text-sm leading-relaxed">{bulletContent}</span>
          </div>
        );
      }
      return;
    }

    // Regular paragraph text
    if (trimmedLine) {
      formattedElements.push(
        <p key={key++} className="text-sm mb-3 leading-relaxed">
          {trimmedLine}
        </p>
      );
    }
  });

  return formattedElements;
};
