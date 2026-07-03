# Multi-stage build for Cloud Run (or any container host). Vercel ignores this file entirely
# and uses its own build pipeline — this is purely for the GCP/self-host path documented in
# DEPLOY.md.

FROM node:20-bookworm-slim AS base
WORKDIR /app

# ---- Dependencies (cached separately so source changes don't bust this layer) ----
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ---- Build ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# DATABASE_URL isn't needed for `next build` itself (every DB-touching route is dynamic, see
# DEPLOY.md), but Prisma's generator needs the schema present, which it already is.
RUN npx prisma generate
RUN npm run build

# ---- Runtime ----
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Next.js's standalone output tracer frequently misses Prisma's native query engine binaries
# (they live under node_modules/.prisma, not node_modules/@prisma) — copy both explicitly.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]
