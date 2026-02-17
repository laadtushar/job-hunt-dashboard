import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter
const rateLimit = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

function checkRateLimit(identifier: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const record = rateLimit.get(identifier);

    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
        for (const [key, value] of rateLimit.entries()) {
            if (value.resetTime < now) {
                rateLimit.delete(key);
            }
        }
    }

    if (!record || record.resetTime < now) {
        rateLimit.set(identifier, {
            count: 1,
            resetTime: now + config.windowMs
        });
        return true;
    }

    if (record.count >= config.maxRequests) {
        return false;
    }

    record.count++;
    return true;
}

function getClientIdentifier(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    return ip;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const identifier = getClientIdentifier(request);

    // Apply different rate limits based on the route
    let config: RateLimitConfig | null = null;

    if (pathname.startsWith('/api/sync')) {
        // Sync endpoint: 10 requests per hour
        config = { maxRequests: 10, windowMs: 60 * 60 * 1000 };
    } else if (pathname.startsWith('/api/auth')) {
        // Auth routes: 10 requests per 15 minutes
        config = { maxRequests: 10, windowMs: 15 * 60 * 1000 };
    } else if (pathname.startsWith('/api/')) {
        // Other API routes: 100 requests per 15 minutes
        config = { maxRequests: 100, windowMs: 15 * 60 * 1000 };
    }

    // Check rate limit if applicable
    if (config && !checkRateLimit(identifier, config)) {
        return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            { status: 429 }
        );
    }

    // Add security headers
    const response = NextResponse.next();

    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Content Security Policy
    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;"
    );

    return response;
}

export const config = {
    matcher: [
        '/api/:path*',
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
