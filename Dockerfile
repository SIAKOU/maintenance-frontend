# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Dev server stage (for local development)
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app /app
ENV HOST=0.0.0.0
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

