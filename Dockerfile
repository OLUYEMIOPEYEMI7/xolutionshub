# Container for Google Cloud Run (also works on any Docker host).
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force \
    # npm can report success after a failed download; fail the build if packages are missing.
    && node -e "['express','pg','dotenv','ejs','express-session','connect-pg-simple'].forEach(m => require(m))"
COPY . .
USER node
# Cloud Run sets PORT (8080); server.js reads it.
CMD ["node", "server.js"]
