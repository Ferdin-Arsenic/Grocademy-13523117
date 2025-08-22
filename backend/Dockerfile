# --- TAHAP 1: BUILDER ---
# Tahap ini bertugas meng-install semua dependensi (termasuk dev) dan membangun aplikasi.
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "run", "start:prod"]