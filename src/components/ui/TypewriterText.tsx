import { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface TypewriterTextProps {
  texts: string[];
  speed?: number;
  pauseDuration?: number;
  loop?: boolean;
  className?: string;
}

export function TypewriterText({
  texts,
  speed = 100,
  pauseDuration = 2000,
  loop = true,
  className = ''
}: TypewriterTextProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayText(texts[0] || '');
      return;
    }

    if (!texts.length) return;

    let timer: ReturnType<typeof setTimeout>;
    
    const currentFullText = texts[currentTextIndex];

    const handleType = () => {
      if (!isDeleting) {
        if (displayText.length < currentFullText.length) {
          setDisplayText(currentFullText.substring(0, displayText.length + 1));
          timer = setTimeout(handleType, speed);
        } else {
          if (loop || currentTextIndex < texts.length - 1) {
            timer = setTimeout(() => setIsDeleting(true), pauseDuration);
          }
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(currentFullText.substring(0, displayText.length - 1));
          timer = setTimeout(handleType, speed / 2);
        } else {
          setIsDeleting(false);
          setCurrentTextIndex((prev) => (prev + 1) % texts.length);
        }
      }
    };

    timer = setTimeout(handleType, speed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentTextIndex, texts, speed, pauseDuration, loop, shouldReduceMotion]);

  if (shouldReduceMotion) {
    return <span className={className}>{texts[0]}</span>;
  }

  return (
    <span className={`inline-block ${className}`}>
      {displayText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        className="inline-block w-[3px] h-[1em] bg-[var(--color-accent)] ml-1 align-middle translate-y-[-2px]"
      />
    </span>
  );
}