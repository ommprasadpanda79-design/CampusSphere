FROM node:22-alpine

WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json
RUN npm ci --omit=dev --workspace campussphere-backend
COPY backend/prisma ./backend/prisma
WORKDIR /app/backend
RUN npx prisma generate
COPY backend/src ./src
COPY backend/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
