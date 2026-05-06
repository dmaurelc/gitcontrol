FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# Self-contained npm tree with the migrator deps and the migrate script in
# the same folder so Node's standard ESM resolution finds them.
FROM base AS migrator
WORKDIR /app/migrator
RUN npm init -y >/dev/null \
  && npm install --silent --no-audit --no-fund --no-package-lock \
       drizzle-orm@0.45.2 pg@8.20.0

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Migrator lives in its own folder with its own node_modules. The entrypoint
# runs node from inside /app/migrator so ESM resolution picks up drizzle-orm
# and pg from the sibling node_modules.
COPY --from=migrator --chown=nextjs:nodejs /app/migrator /app/migrator
COPY --from=builder --chown=nextjs:nodejs /app/scripts/migrate.mjs /app/migrator/migrate.mjs

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["sh", "scripts/entrypoint.sh"]
