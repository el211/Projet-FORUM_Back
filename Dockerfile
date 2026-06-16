FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching).
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# Copy the rest of the application.
COPY . .

EXPOSE 8080

# Waits for MySQL, initialises the schema/seed on first run, then starts.
CMD ["node", "scripts/docker-start.js"]
