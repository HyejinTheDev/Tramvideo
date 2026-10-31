# Build từ gốc monorepo:  docker build -f docker/api.Dockerfile -t tram-api .
FROM node:22-alpine AS base
RUN apk add --no-cache openssl && corepack enable
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @tram/api... build
# Gói riêng api + dependency production vào /out, rồi generate Prisma client ngay trong /out
# (cùng Alpine với runtime nên engine khớp nền tảng).
RUN pnpm --filter @tram/api deploy --prod /out \
  && cp -r backend/api/dist /out/dist \
  && cp -r backend/database/prisma /out/prisma \
  && cd /out && ./node_modules/.bin/prisma generate --schema=prisma/schema.prisma

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=build /out .
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/main.js"]
