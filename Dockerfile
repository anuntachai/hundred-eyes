# syntax=docker/dockerfile:1
# Hundred Eyes — local dev deployment (production build, standalone output)

FROM node:22-alpine AS base

# ---- install dependencies ----
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build (NEXT_PUBLIC_* ถูก inline ตอน build → ต้องส่งเป็น build args) ----
FROM base AS builder
WORKDIR /app
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# prebuild สร้าง public/icons/*.png ให้เอง (sharp)
RUN npm run build

# ---- run (standalone) ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000
RUN addgroup --system nodejs && adduser --system nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
