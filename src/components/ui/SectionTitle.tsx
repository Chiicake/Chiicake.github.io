import { ScrollReveal } from '../animations/ScrollReveal';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  alignment?: 'left' | 'center';
  className?: string;
}

export function SectionTitle({ title, subtitle, alignment = 'left', className = '' }: SectionTitleProps) {
  return (
    <ScrollReveal className={`mb-12 ${alignment === 'center' ? 'text-center' : ''} ${className}`}>
      <div className={`inline-flex items-center gap-4 mb-4 ${alignment === 'center' ? 'justify-center w-full' : ''}`}>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
          {title}
        </h2>
        {alignment === 'left' && (
          <div className="h-px flex-1 bg-gradient-to-r from-[var(--color-accent)]/50 to-transparent max-w-xs ml-4"></div>
        )}
      </div>
      {subtitle && (
        <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl">
          {subtitle}
        </p>
      )}
    </ScrollReveal>
  );
}