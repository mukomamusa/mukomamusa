// app/lib/jwt.ts
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    // In development, provide a clear error
    if (process.env.NODE_ENV === 'development') {
      console.error(
        '\x1b[31m%s\x1b[0m',
        '❌ JWT_SECRET is not set in environment variables!\n' +
        'Please add JWT_SECRET to your .env.local file:\n' +
        'JWT_SECRET=your-super-secret-key-change-this'
      );
      // Return a development-only default (DO NOT use in production)
      return 'dev-jwt-secret-do-not-use-in-production';
    }
    
    // In production, throw error
    throw new Error('JWT_SECRET is not configured');
  }
  
  return secret;
}