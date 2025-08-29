/**
 * Security utilities for handling sensitive data
 * 
 * IMPORTANT: This file contains recommendations for securing sensitive data.
 * The Strava token encryption should be implemented on the backend/edge functions
 * to prevent exposing encryption keys in the client-side code.
 */

// Client-side input validation and sanitization
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Rate limiting helpers
export class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();

  isRateLimited(identifier: string, maxAttempts: number = 5, windowMs: number = 300000): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return false;
    }

    // Reset if outside window
    if (now - record.lastAttempt > windowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return false;
    }

    // Check if rate limited
    if (record.count >= maxAttempts) {
      return true;
    }

    // Increment attempts
    record.count++;
    record.lastAttempt = now;
    return false;
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

// Password strength validation
export const validatePasswordStrength = (password: string) => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  
  const score = Object.values(requirements).filter(Boolean).length;
  return { requirements, score, isStrong: score >= 4 };
};

// Secure error message formatting
export const formatSecureErrorMessage = (error: any): string => {
  const secureMessages: Record<string, string> = {
    'Invalid login credentials': 'Email ou mot de passe incorrect',
    'Email not confirmed': 'Veuillez confirmer votre email avant de vous connecter',
    'Too many requests': 'Trop de tentatives. Veuillez réessayer plus tard',
    'User already registered': 'Un compte existe déjà avec cet email',
    'Signup not allowed': 'Les inscriptions ne sont pas autorisées actuellement',
    'Email rate limit exceeded': 'Trop d\'emails envoyés. Veuillez réessayer plus tard',
  };
  
  return secureMessages[error.message] || 'Une erreur est survenue. Veuillez réessayer';
};

/**
 * SECURITY RECOMMENDATION FOR STRAVA TOKENS:
 * 
 * The current implementation stores Strava access tokens in plain text in the database.
 * This poses a security risk. Here are the recommended solutions:
 * 
 * 1. BACKEND ENCRYPTION (Recommended):
 *    - Move token encryption/decryption to edge functions
 *    - Use Supabase Vault or environment variables for encryption keys
 *    - Encrypt tokens before storing in database
 *    - Decrypt tokens only when needed for API calls
 * 
 * 2. TOKEN ROTATION:
 *    - Implement automatic token refresh
 *    - Set shorter expiry times
 *    - Invalidate tokens after use where possible
 * 
 * 3. DATABASE SECURITY:
 *    - Use separate table for tokens with restricted access
 *    - Implement audit logging for token access
 *    - Add token usage monitoring
 * 
 * Example edge function for secure token handling:
 * 
 * ```typescript
 * // In an edge function
 * import { createClient } from '@supabase/supabase-js'
 * 
 * const encryptToken = (token: string, key: string): string => {
 *   // Implementation using a secure encryption library
 *   // Never expose the encryption key to the client
 * }
 * 
 * const decryptToken = (encryptedToken: string, key: string): string => {
 *   // Implementation using a secure decryption library
 * }
 * ```
 */