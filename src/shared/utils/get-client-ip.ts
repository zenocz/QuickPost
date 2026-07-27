import { headers } from 'next/headers';

export async function getClientIp(): Promise<string> {
  try {
    const headersList = await headers();
    
    // 1. Cloudflare
    const cfIp = headersList.get('cf-connecting-ip');
    if (cfIp) return cfIp.trim();
    
    // 2. Akamai / Cloudflare Enterprise
    const trueClientIp = headersList.get('true-client-ip');
    if (trueClientIp) return trueClientIp.trim();
    
    // 3. Standard Forwarded For (can contain multiple IPs, the first is the client)
    const forwardedFor = headersList.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    
    // 4. Nginx / General Proxy
    const realIp = headersList.get('x-real-ip');
    if (realIp) return realIp.trim();
    
  } catch {
    // Fallback if headers() fails in non-HTTP contexts (e.g. unit tests)
  }
  
  return '127.0.0.1';
}
