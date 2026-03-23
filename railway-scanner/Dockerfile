FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

COPY tsconfig.json ./
COPY src/ ./src/

# Install typescript for build, then build, then remove devDeps
RUN npm install typescript ts-node @types/node @types/express --save-dev \
  && npx tsc \
  && rm -rf node_modules/.cache \
  && npm prune --omit=dev

EXPOSE 3001

CMD ["node", "dist/index.js"]
