import { useState, useRef, ReactNode, MouseEvent } from 'react';
import { motion } from 'framer-motion';

interface RippleButtonProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function RippleButton({
  children,
  className = '',
  onClick,
  href,
  disabled = false,
  loading = false,
  loadingText,
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const buttonRef = useRef<HTMLButtonElement | HTMLAnchorElement>(null);

  const handleClick = (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (disabled || loading) return;

    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = { id: Date.now(), x, y };
    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);

    onClick?.();
  };

  const content = (
    <>
      {loading && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center gap-2"
        >
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
          />
          {loadingText && <span className="text-sm">{loadingText}</span>}
        </motion.span>
      )}

      <span className={`relative z-10 ${loading ? 'opacity-0' : ''}`}>
        {children}
      </span>

      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute rounded-full bg-white/30 pointer-events-none"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
        />
      ))}
    </>
  );

  const baseClasses = `
    relative overflow-hidden
    transition-all duration-300
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `;

  if (href) {
    return (
      <motion.a
        ref={buttonRef as React.RefObject<HTMLAnchorElement>}
        href={href}
        onClick={handleClick as any}
        className={baseClasses}
        whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
        whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      ref={buttonRef as React.RefObject<HTMLButtonElement>}
      onClick={handleClick as any}
      disabled={disabled || loading}
      className={baseClasses}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
    >
      {content}
    </motion.button>
  );
}