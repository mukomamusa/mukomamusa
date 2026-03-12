// app/lib/agent-auth.ts
// Agent authentication helper for verifying JWT tokens

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production'
  ? (() => { throw new Error('JWT_SECRET must be set in production'); })()
  : 'vayazed-dev-secret-for-testing-only');

export interface AgentTokenPayload {
  id: number;
  email: string;
  name: string;
  business: string;
  type: 'agent';
  verified: boolean;
  sessionId: number;
}

export interface AgentAuthResult {
  valid: boolean;
  payload?: AgentTokenPayload;
  error?: string;
}

/**
 * Verify JWT token from agent authentication
 * @param token - JWT token string
 * @returns AgentAuthResult with validation status and payload
 */
export function verifyAgentToken(token: string): AgentTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AgentTokenPayload;
    
    // Verify this is an agent token
    if (decoded.type !== 'agent') {
      console.error('Token is not an agent token');
      return null;
    }
    
    // Verify required fields
    if (!decoded.id || !decoded.email) {
      console.error('Token missing required fields');
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Generate agent JWT token (used for testing or internal purposes)
 * @param payload - Agent data to encode
 * @param expiresIn - Token expiration (default: 1d)
 * @returns JWT token string
 */
export function generateAgentToken(
  payload: Omit<AgentTokenPayload, 'type'>,
  expiresIn: string = '1d'
): string {
  return jwt.sign(
    { ...payload, type: 'agent' },
    JWT_SECRET,
    { expiresIn } as jwt.SignOptions
  );
}

/**
 * Check if agent is verified and active
 * @param token - JWT token string
 * @returns boolean indicating if agent can perform actions
 */
export function isAgentActive(token: string): boolean {
  const payload = verifyAgentToken(token);
  return payload !== null && payload.verified === true;
}
