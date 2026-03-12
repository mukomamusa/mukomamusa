/**
 * Validation utilities for Zambia-specific form fields
 * Includes validation for cellphone numbers and NRC numbers
 */

/**
 * Result type for validation functions
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a Zambia cellphone number
 * 
 * Accepts formats:
 * - Local: 09xxxxxxxx (10 digits starting with 0)
 * - International: +2609xxxxxxxx (12 digits with country code)
 * - With country code: 2609xxxxxxxx (12 digits without +)
 * 
 * @param phone - The phone number string to validate
 * @returns ValidationResult with isValid boolean and error message if invalid
 */
export function validateZambiaCellphone(phone: string): ValidationResult {
  // Remove all whitespace and dashes
  const cleanedPhone = phone.replace(/[\s-]/g, '');

  // Check if empty
  if (!cleanedPhone || cleanedPhone.length === 0) {
    return {
      isValid: false,
      error: 'Phone number is required',
    };
  }

  // Check for +260 prefix
  const isInternational = cleanedPhone.startsWith('+260');
  const isWithCountryCode = cleanedPhone.startsWith('260');
  const isLocal = cleanedPhone.startsWith('0');

  // Local format: 09xxxxxxxx (10 digits starting with 0)
  if (isLocal) {
    if (cleanedPhone.length > 10) {
      return {
        isValid: false,
        error: 'Phone number must be exactly 10 digits (e.g., 0971234567)',
      };
    }
    if (cleanedPhone.length < 10) {
      return {
        isValid: false,
        error: 'Phone number must be exactly 10 digits (e.g., 0971234567)',
      };
    }
    
    // Check that it starts with valid Zambian mobile prefix (09x)
    const prefix = cleanedPhone.substring(0, 2);
    const validPrefixes = ['09', '07', '06'];
    if (!validPrefixes.includes(prefix)) {
      return {
        isValid: false,
        error: 'Phone number must start with 09, 07, or 06',
      };
    }

    // Check all characters are digits
    if (!/^\d+$/.test(cleanedPhone)) {
      return {
        isValid: false,
        error: 'Phone number must contain only digits',
      };
    }

    return { isValid: true };
  }

  // International format: +2609xxxxxxxx (12 digits with +)
  if (isInternational) {
    if (cleanedPhone.length > 12) {
      return {
        isValid: false,
        error: 'Phone number must be exactly 12 digits (e.g., +260971234567)',
      };
    }
    if (cleanedPhone.length < 12) {
      return {
        isValid: false,
        error: 'Phone number must be exactly 12 digits (e.g., +260971234567)',
      };
    }

    // Check that after +260, it starts with valid prefix (9, 7, or 6)
    const afterPrefix = cleanedPhone.substring(4, 5);
    const validPrefixes = ['9', '7', '6'];
    if (!validPrefixes.includes(afterPrefix)) {
      return {
        isValid: false,
        error: 'Phone number must start with +260 followed by 9, 7, or 6',
      };
    }

    // Check all characters after + are digits
    const digitsOnly = cleanedPhone.substring(1);
    if (!/^\d+$/.test(digitsOnly)) {
      return {
        isValid: false,
        error: 'Phone number must contain only digits',
      };
    }

    return { isValid: true };
  }

  // Country code without +: 2609xxxxxxxx (12 digits)
  if (isWithCountryCode) {
    if (cleanedPhone.length > 12) {
      return {
        isValid: false,
        error: 'Phone number must be exactly 12 digits (e.g., 260971234567)',
      };
    }
    if (cleanedPhone.length < 12) {
      return {
        isValid: false,
        error: 'Phone number must be exactly 12 digits (e.g., 260971234567)',
      };
    }

    // Check that after 260, it starts with valid prefix (9, 7, or 6)
    const afterPrefix = cleanedPhone.substring(3, 4);
    const validPrefixes = ['9', '7', '6'];
    if (!validPrefixes.includes(afterPrefix)) {
      return {
        isValid: false,
        error: 'Phone number must start with 260 followed by 9, 7, or 6',
      };
    }

    // Check all characters are digits
    if (!/^\d+$/.test(cleanedPhone)) {
      return {
        isValid: false,
        error: 'Phone number must contain only digits',
      };
    }

    return { isValid: true };
  }

  // If no recognized prefix, check if it's just digits
  if (/^\d+$/.test(cleanedPhone)) {
    // Could be trying to enter without prefix - show helpful error
    if (cleanedPhone.length === 9) {
      return {
        isValid: false,
        error: 'Please include the area code (0, +260, or 260). Example: 0971234567 or +260971234567',
      };
    }
    if (cleanedPhone.length === 10) {
      return {
        isValid: false,
        error: 'Phone number must start with 09, 07, or 06 (e.g., 0971234567)',
      };
    }
    return {
      isValid: false,
      error: 'Invalid phone number format. Use format: 09xxxxxxxx or +2609xxxxxxxx',
    };
  }

  return {
    isValid: false,
    error: 'Phone number must contain only digits',
  };
}

/**
 * Validates a Zambia NRC (National Registration Card) number
 * 
 * Accepts formats:
 * - With slashes: 123456/78/1 (11 characters)
 * - Without spaces: 123456/78/1
 * 
 * The format is typically: XXXXXX/YY/Z where:
 * - XXXXXX is the 6-digit birth year + serial
 * - YY is the district code (2 digits)
 * - Z is the gender code (1 digit: 1 for male, 2 for female)
 * 
 * @param nrc - The NRC string to validate
 * @returns ValidationResult with isValid boolean and error message if invalid
 */
export function validateZambiaNRC(nrc: string): ValidationResult {
  // Remove all whitespace
  const cleanedNRC = nrc.trim();

  // Check if empty
  if (!cleanedNRC || cleanedNRC.length === 0) {
    return {
      isValid: false,
      error: 'NRC number is required',
    };
  }

  // Check maximum length (standard format is 11 characters with slashes)
  if (cleanedNRC.length > 12) {
    return {
      isValid: false,
      error: 'NRC number must not exceed 12 characters (e.g., 123456/78/1)',
    };
  }

  // Check minimum length
  if (cleanedNRC.length < 9) {
    return {
      isValid: false,
      error: 'NRC number must be at least 9 characters (e.g., 123456/78/1)',
    };
  }

  // Check the format: XXXXXX/YY/Z
  // Must contain at least one slash
  if (!cleanedNRC.includes('/')) {
    return {
      isValid: false,
      error: 'NRC number must include slashes (e.g., 123456/78/1)',
    };
  }

  // Check that all slashes are in the correct position
  const slashCount = (cleanedNRC.match(/\//g) || []).length;
  if (slashCount !== 2) {
    return {
      isValid: false,
      error: 'NRC number must have exactly 2 slashes (e.g., 123456/78/1)',
    };
  }

  // Split by slashes
  const parts = cleanedNRC.split('/');
  
  // Must have exactly 3 parts
  if (parts.length !== 3) {
    return {
      isValid: false,
      error: 'NRC number format is incorrect (e.g., 123456/78/1)',
    };
  }

  const [firstPart, secondPart, thirdPart] = parts;

  // First part: 6 digits (birth year + serial)
  if (firstPart.length !== 6) {
    return {
      isValid: false,
      error: 'First part of NRC must be 6 digits (e.g., 123456/78/1)',
    };
  }

  if (!/^\d+$/.test(firstPart)) {
    return {
      isValid: false,
      error: 'First part of NRC must contain only digits',
    };
  }

  // Second part: 2 digits (district code)
  if (secondPart.length !== 2) {
    return {
      isValid: false,
      error: 'Second part of NRC must be 2 digits (e.g., 123456/78/1)',
    };
  }

  if (!/^\d+$/.test(secondPart)) {
    return {
      isValid: false,
      error: 'Second part of NRC must contain only digits',
    };
  }

  // Third part: 1 digit (gender code: 1 for male, 2 for female)
  if (thirdPart.length !== 1) {
    return {
      isValid: false,
      error: 'Third part of NRC must be 1 digit (e.g., 123456/78/1)',
    };
  }

  if (!/^\d+$/.test(thirdPart)) {
    return {
      isValid: false,
      error: 'Third part of NRC must contain only digits',
    };
  }

  // Validate gender digit is 1 or 2
  if (!['1', '2'].includes(thirdPart)) {
    return {
      isValid: false,
      error: 'Third part of NRC must be 1 (male) or 2 (female)',
    };
  }

  return { isValid: true };
}

/**
 * Validates maximum length for any string field
 * 
 * @param value - The string to validate
 * @param maxLength - Maximum allowed length
 * @param fieldName - Name of the field for error message
 * @returns ValidationResult with isValid boolean and error message if invalid
 */
export function validateMaxLength(value: string, maxLength: number, fieldName: string): ValidationResult {
  if (!value) {
    return { isValid: true }; // Empty is OK (use separate required validation)
  }

  if (value.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must not exceed ${maxLength} characters`,
    };
  }

  return { isValid: true };
}

/**
 * Validates minimum length for any string field
 * 
 * @param value - The string to validate
 * @param minLength - Minimum required length
 * @param fieldName - Name of the field for error message
 * @returns ValidationResult with isValid boolean and error message if invalid
 */
export function validateMinLength(value: string, minLength: number, fieldName: string): ValidationResult {
  if (!value) {
    return { isValid: true }; // Empty is OK (use separate required validation)
  }

  if (value.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${minLength} characters`,
    };
  }

  return { isValid: true };
}

/**
 * Validates that a field is required (not empty)
 * 
 * @param value - The value to validate
 * @param fieldName - Name of the field for error message
 * @returns ValidationResult with isValid boolean and error message if invalid
 */
export function validateRequired(value: string | undefined | null, fieldName: string): ValidationResult {
  if (value === undefined || value === null || value.trim().length === 0) {
    return {
      isValid: false,
      error: `${fieldName} is required`,
    };
  }

  return { isValid: true };
}

/**
 * Type for form field validation functions
 */
export type Validator = (value: string) => ValidationResult;

/**
 * Creates a combined validator from multiple validation functions
 * 
 * @param validators - Array of validator functions to combine
 * @returns Combined validator that runs all validators and returns first error
 */
export function combineValidators(...validators: Validator[]): Validator {
  return (value: string): ValidationResult => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true };
  };
}
