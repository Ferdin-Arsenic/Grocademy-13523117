FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install all dependencies, including devDependencies
RUN npm install

# Copy the rest of your app's source code
COPY . .

# The command to run the app will be handled by docker-compose.yml
CMD ["npm", "run", "start:dev"]