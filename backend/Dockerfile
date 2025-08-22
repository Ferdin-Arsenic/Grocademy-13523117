FROM node:20-alpine

RUN apk add --no-cache postgresql-client

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

COPY . .

RUN npx prisma generate || true

CMD ["npm", "run", "start:dev"]