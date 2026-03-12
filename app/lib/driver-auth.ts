// app/lib/driver-auth.ts
import jwt from 'jsonwebtoken';

export interface DriverTokenPayload {
  id: number;
  email: string;
  name: string;
  company_id: number;
  company_name: string;
  role: 'driver';
  type: 'driver';
}

export function verifyDriverToken(token: string): DriverTokenPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Verify it's a driver token
    if (decoded.type !== 'driver' || decoded.role !== 'driver') {
      return null;
    }
    
    return decoded as DriverTokenPayload;
  } catch (error) {
    return null;
  }
}