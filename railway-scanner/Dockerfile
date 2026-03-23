FROM node:18-alpine

WORKDIR /app

# Copy from the railway-scanner subdirectory (build context is repo root)
COPY railway-scanner/package.json railway-scanner/package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

COPY railway-scanner/tsconfig.json ./
COPY railway-scanner/src/ ./src/

# Build TypeScript
RUN npm install typescript @types/node @types/express --save-dev \
  && npx tsc \
  && rm -rf node_modules/.cache \
  && npm prune --omit=dev

EXPOSE 3001

CMD ["node", "dist/index.js"]
