FROM node:20 AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20

ENV PORT=8080
ENV HOST=0.0.0.0

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/docs/openapi.yaml ./src/docs/openapi.yaml
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 8080

USER node

CMD ["node", "dist/src/server.js"]