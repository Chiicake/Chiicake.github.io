import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

interface ButtonAsButtonProps extends BaseButtonProps {
  to?: never;
  href?: never;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

interface ButtonAsLinkProps extends BaseButtonProps {
  to: string;
  href?: never;
  onClick?: never;
}

interface ButtonAsExternalProps extends BaseButtonProps {
  href: string;
  to?: never;
  target?: string;
  rel?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps | ButtonAsExternalProps;

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] shadow-sm hover:shadow',
  secondary: 'bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-gray-100 dark:hover:bg-slate-800 shadow-sm border border-gray-200 dark:border-slate-700',
  ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-gray-100 dark:hover:bg-slate-800',
  outline: 'bg-transparent text-[var(--color-accent)] border-2 border-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-base rounded-xl',
  lg: 'px-8 py-4 text-lg rounded-2xl',
};

export function Button(props: ButtonProps) {
  const { 
    variant = 'primary', 
    size = 'md', 
    className = '', 
    children, 
    icon,
  } = props;
  
  const shouldReduceMotion = useReducedMotion();

  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-bg)]';
  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  const content = (
    <>
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </>
  );

  const motionProps = shouldReduceMotion ? {} : {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 }
  };

  if ('to' in props && props.to) {
    return (
      <Link to={props.to} className={combinedClassName}>
        {content}
      </Link>
    );
  }

  if ('href' in props && props.href) {
    const { href, target, rel, onClick } = props;
    return (
      <motion.a 
        href={href} 
        className={combinedClassName}
        target={target}
        rel={rel}
        onClick={onClick}
        {...motionProps}
      >
        {content}
      </motion.a>
    );
  }

  const { onClick, disabled, type } = props as ButtonAsButtonProps;
  return (
    <motion.button 
      className={combinedClassName} 
      onClick={onClick}
      disabled={disabled}
      type={type}
      {...motionProps}
    >
      {content}
    </motion.button>
  );
}