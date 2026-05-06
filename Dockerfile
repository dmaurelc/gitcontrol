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

# Build a self-contained, npm-style node_modules with the migrator deps so we
# don't fight pnpm's symlinks at runtime.
FROM base AS migrator
WORKDIR /app
RUN npm init -y >/dev/null \
  && npm install --silent --no-audit --no-fund --no-package-lock \
       drizzle-orm@0.45.2 pg@8.20.0

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Next standalone server (its own minimal node_modules included)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Merge migrator deps into the standalone node_modules. The standalone bundle
# already has its own node_modules dir; we only add packages it doesn't ship
# (drizzle-orm and pg are not bundled when not directly imported from a route).
COPY --from=migrator --chown=nextjs:nodejs /app/node_modules /app/migrator_modules
RUN cp -R /app/migrator_modules/. /app/node_modules/ \
  && rm -rf /app/migrator_modules \
  && chown -R nextjs:nodejs /app/node_modules

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["sh", "scripts/entrypoint.sh"]
