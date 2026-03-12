import React, { forwardRef, useId } from 'react';
import { ValidationResult } from '@/app/lib/validations';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label text displayed above the input */
  label?: string;
  /** Error message to display below the input */
  error?: string;
  /** Helper text displayed below the input (mutually exclusive with error) */
  helperText?: string;
  /** Validation result object from validations.ts */
  validation?: ValidationResult;
  /** Whether to show character count for maxLength */
  showCharCount?: boolean;
  /** Container className override */
  containerClassName?: string;
}

/**
 * Consistent input component with label, error display, and validation support.
 * Integrates with the validation utilities from app/lib/validations.ts
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      validation,
      showCharCount = false,
      containerClassName = '',
      className = '',
      maxLength,
      id: providedId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    
    // Determine error to display - prioritize explicit error prop, then validation error
    const displayError = error || (validation && !validation.isValid ? validation.error : undefined);
    const hasError = !!displayError;

    return (
      <div className={`w-full ${containerClassName}`}>
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5"
          >
            {label}
            {props.required && (
              <span className="text-red-500 ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        
        <input
          ref={ref}
          id={id}
          maxLength={maxLength}
          className={`
            w-full px-3 py-2 
            border rounded-lg 
            text-gray-900 dark:text-gray-100
            bg-white dark:bg-gray-800
            placeholder-gray-400 dark:placeholder-gray-500
            transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-offset-1
            ${hasError
              ? 'border-red-500 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-800'
              : 'border-gray-300 dark:border-gray-600 focus:border-primary-500 focus:ring-primary-200 dark:focus:ring-primary-800'
            }
            ${props.disabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60' : ''}
            ${className}
          `}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
          {...props}
        />
        
        <div className="mt-1.5 flex justify-between items-start min-h-[20px]">
          {displayError ? (
            <p
              id={`${id}-error`}
              className="text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {displayError}
            </p>
          ) : helperText ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {helperText}
            </p>
          ) : (
            <span />
          )}
          
          {showCharCount && maxLength && (
            <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
              {props.value?.toString().length || 0}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
