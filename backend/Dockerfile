# Gunakan base image yang stabil
FROM node:20-alpine

# Tetapkan direktori kerja di dalam container
WORKDIR /usr/src/app

# Salin package.json dan package-lock.json terlebih dahulu
# Ini memanfaatkan Docker layer caching
COPY package*.json ./

# Instal semua dependensi di dalam container
RUN npm install

# Salin sisa kode sumber aplikasi Anda
COPY . .

# Perintah CMD Anda sudah benar, karena di-handle oleh docker-compose
CMD ["npm", "run", "start:dev"]