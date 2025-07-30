
import React, { useState, useRef, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TruncatedTextProps {
  text: string;
  maxLength?: number;
  className?: string;
  showTooltip?: boolean;
  fallbackIcon?: React.ReactNode;
  useFallbackAt?: number;
}

export const TruncatedText: React.FC<TruncatedTextProps> = ({
  text,
  maxLength = 20,
  className = '',
  showTooltip = true,
  fallbackIcon,
  useFallbackAt = 8
}) => {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = textRef.current;
    if (element) {
      setIsOverflowing(element.scrollWidth > element.offsetWidth);
    }
  }, [text]);

  // Use fallback icon for very small screens if text is too long
  const shouldUseFallback = fallbackIcon && text.length > useFallbackAt;

  if (shouldUseFallback) {
    return showTooltip ? (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`cursor-help ${className}`}>
              {fallbackIcon}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="text-sm">{text}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : (
      <span className={className}>{fallbackIcon}</span>
    );
  }

  const truncatedText = text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  const needsTooltip = showTooltip && (text.length > maxLength || isOverflowing);

  return needsTooltip ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            ref={textRef}
            className={`cursor-help truncate ${className}`}
            title={text}
          >
            {truncatedText}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <span ref={textRef} className={`truncate ${className}`}>
      {truncatedText}
    </span>
  );
};
