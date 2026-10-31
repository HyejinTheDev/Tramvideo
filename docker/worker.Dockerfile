# Worker xử lý video (giai đoạn sau). Có sẵn ffmpeg.
# Build từ gốc monorepo:  docker build -f docker/worker.Dockerfile -t tram-worker .
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @tram/worker... build

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache ffmpeg
COPY --from=build /repo/backend/worker/dist ./dist
USER node
CMD ["node", "dist/main.js"]
