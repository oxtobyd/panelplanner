FROM node:20-alpine

WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose Vite's port and your API port
EXPOSE 3006
EXPOSE 3001

# Use the same dev command from your package.json
CMD ["npm", "run", "dev"] 