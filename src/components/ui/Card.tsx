import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  image?: string;
  imageAlt?: string;
  hoverable?: boolean;
}

export function Card({ children, className = '', image, imageAlt = '', hoverable = false }: CardProps) {
  const shouldReduceMotion = useReducedMotion();
  
  const baseStyles = 'bg-[var(--color-surface)] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-800/50';
  
  const motionProps = (hoverable && !shouldReduceMotion) ? {
    whileHover: { y: -8, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' },
    transition: { duration: 0.3, ease: 'easeOut' as const }
  } : {};

  return (
    <motion.div 
      className={`${baseStyles} ${className} flex flex-col h-full`}
      {...motionProps}
    >
      {image && (
        <div className="w-full h-48 overflow-hidden bg-gray-200 dark:bg-slate-800">
          <img 
            src={image} 
            alt={imageAlt} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-6 flex-grow flex flex-col">
        {children}
      </div>
    </motion.div>
  );
}