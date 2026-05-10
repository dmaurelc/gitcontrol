# Better Auth Rate Limiting Configuration (^1.6.9)

## Configuration Shape

```typescript
rateLimit: {
  enabled: boolean,           // false in dev, true in prod (default)
  window: number,             // seconds (default: 60)
  max: number,                // requests per window (default: 100)
  storage?: "database" | "secondary-storage",
  customRules?: {
    [path: string]: {
      window: number,
      max: number,
    } | false
  },
  customStorage?: {
    get: (key: string) => Promise<any>,
    set: (key: string, value: any, ttl?: number) => Promise<void>,
  }
}
```

## Redis Storage Setup

```typescript
import { Redis } from "ioredis";
import { betterAuth } from "better-auth";

const redis = new Redis();

export const auth = betterAuth({
  // ... other options
  rateLimit: {
    window: 60,
    max: 100,
    customStorage: {
      get: (key) => redis.get(key),
      set: (key, value, ttl) => 
        redis.setex(key, ttl || 3600, JSON.stringify(value)),
    },
    customRules: {
      "/sign-in/email": { window: 10, max: 3 },
      "/oauth/callback": false, // disable for OAuth
    }
  },
  // ... rest of config
});
```

## Key Points

- **Default**: 100 req/60sec in production; disabled in dev
- **Redis**: Use `customStorage` with get/set methods (or @better-auth/redis-storage package)
- **Per-path**: `customRules` map paths to limits or `false` to disable
- **Server-side bypass**: `auth.api` calls skip rate limits
- **Production**: Defaults to enabled; configure storage to avoid memory issues in serverless
- **Return code**: 429 with `X-Retry-After` header

## Unresolved Questions

- Does @better-auth/redis-storage package exist for v1.6.9? (referenced in v1.5+ but not in official docs)
- IPv6 subnet configuration for distributed environments?
