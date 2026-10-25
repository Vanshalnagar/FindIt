FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Non-root user and writable uploads directory
RUN mkdir -p /app/uploads \
    && chown -R node:node /app
USER node

ENV PORT=5000 \
    UPLOAD_DIR=uploads
EXPOSE 5000
VOLUME ["/app/uploads"]

CMD ["node", "src/server.js"]
