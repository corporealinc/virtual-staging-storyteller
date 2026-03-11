# Build stage
FROM node:22-slim AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY --from=build /app/dist ./dist
COPY server.ts ./
COPY tsconfig.json ./
COPY images ./images

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "--import", "tsx", "server.ts"]
