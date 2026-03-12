import React, { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant of the button */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Whether the button is in a loading state */
  loading?: boolean;
  /** Whether the button should take full width */
  fullWidth?: boolean;
  /** Left icon component */
  leftIcon?: React.ReactNode;
  /** Right icon component */
  rightIcon?: React.ReactNode;
}

/**
 * Consistent button component with multiple variants, sizes, and states.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const baseStyles = `
      inline-flex items-center justify-center font-medium
      rounded-lg transition-all duration-150
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:cursor-not-allowed disabled:opacity-60
    `;

    const variantStyles: Record<ButtonVariant, string> = {
      primary: `
        bg-primary-500 text-white
        hover:bg-primary-600
        focus:ring-primary-500
        active:bg-primary-700
      `,
      secondary: `
        bg-secondary-500 text-white
        hover:bg-secondary-600
        focus:ring-secondary-500
        active:bg-secondary-700
      `,
      danger: `
        bg-accent-500 text-white
        hover:bg-accent-600
        focus:ring-accent-500
        active:bg-accent-700
      `,
      outline: `
        border-2 border-primary-500 text-primary-600
        hover:bg-primary-50 dark:hover:bg-primary-900/20
        focus:ring-primary-500
        active:bg-primary-100 dark:active:bg-primary-900/30
      `,
      ghost: `
        text-gray-700 dark:text-gray-200
        hover:bg-gray-100 dark:hover:bg-gray-700
        focus:ring-gray-400
        active:bg-gray-200 dark:active:bg-gray-600
      `,
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: `
        px-3 py-1.5 text-sm
        gap-1.5
      `,
      md: `
        px-4 py-2 text-base
        gap-2
      `,
      lg: `
        px-6 py-3 text-lg
        gap-2.5
      `,
    };

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
