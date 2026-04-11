# ── Frontend Build Stage ──────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Backend Production Stage ──────────────────────────────────────────────────
FROM node:20-alpine AS backend
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ .

# Copy built frontend into server to serve as static files
COPY --from=frontend-build /app/frontend/dist ./public

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "index.js"]
