import React from 'react';

export interface SelectorOption<T> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

interface SelectorProps<T> {
  options: SelectorOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function Selector<T extends string | number>({ 
  options, 
  value, 
  onChange, 
  className = '',
  size = 'md'
}: SelectorProps<T>) {
  return (
    <div className={`bg-secondary p-1 rounded-lg inline-flex gap-1 border border-border ${className}`}>
        {options.map((option) => {
            const isSelected = value === option.value;
            return (
                <button
                    key={String(option.value)}
                    onClick={() => onChange(option.value)}
                    className={`
                        rounded-md font-medium transition-all flex items-center justify-center gap-2 whitespace-nowrap
                        ${size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}
                        ${isSelected 
                            ? 'bg-card text-foreground shadow-sm ring-1 ring-border/50 font-bold' 
                            : 'text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                        }
                    `}
                >
                    {option.icon && <span>{option.icon}</span>}
                    {option.label}
                </button>
            );
        })}
    </div>
  );
}
