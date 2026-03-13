# Stage 1: Build the React application
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the frontend (Vite)
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built assets from the 'build' stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy a custom nginx config if you have one, otherwise default works for simple SPAs
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port (Nginx defaults to 80)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
