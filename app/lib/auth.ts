import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  user_type: 'customer' | 'company' | 'admin';
  company_name?: string;
  license_number?: string;
}

// Define the payload that goes into the JWT
export interface TokenPayload {
  id: number;
  email: string;
  user_type: 'customer' | 'company' | 'admin';
  name?: string; // Optional, but useful for audit logs and other features  
  iat?: number;
  exp?: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      user_type: user.user_type,
      name: user.name || 'Company User'  // Fallback if name is missing
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Update verifyToken to return the properly typed payload
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Ensure the decoded token has the expected structure
    if (typeof decoded === 'object' && decoded !== null && 'id' in decoded && 'user_type' in decoded) {
      return decoded as TokenPayload;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export function signToken(payload: any) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function generateBookingReference(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BK${timestamp}${random}`.toUpperCase();
}

export function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TK${timestamp}${random}`.toUpperCase();
}

export function generateQRCode(ticketNumber: string, bookingRef: string, seatNumber: number, passengerName?: string, idNumber?: string): string {
  // Generate a comprehensive QR code with essential passenger info for verification
  const timestamp = Date.now();
  const basicData = `${ticketNumber}|${bookingRef}|${seatNumber}|${timestamp}`;
  
  // Add passenger details if available for enhanced verification
  const enhancedData = passengerName && idNumber 
    ? `${basicData}|${passengerName}|${idNumber}` 
    : basicData;
  
  // Base64 encode for QR code content
  return Buffer.from(enhancedData).toString('base64');
}

export function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `TXN${timestamp}${random}`.toUpperCase();
}