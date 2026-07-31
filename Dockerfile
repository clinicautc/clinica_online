# Usar una imagen oficial y ligera de Node.js
FROM node:18-alpine AS builder

# Directorio de trabajo para el build
WORKDIR /app

# Copiar los package.json necesarios para instalar dependencias
COPY package*.json ./
COPY utc-api/package*.json ./utc-api/

# Instalar dependencias de frontend y backend
RUN npm install
RUN cd utc-api && npm install

# Copiar el resto del proyecto y construir el frontend
COPY . .
RUN npm run build:single

# Stage final solo con backend y assets compilados
FROM node:18-alpine AS production
WORKDIR /app

COPY utc-api/package*.json ./utc-api/
RUN cd utc-api && npm install --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/utc-api ./utc-api

EXPOSE 10000
ENV PORT=10000
ENV SERVE_STATIC=true

CMD ["node", "utc-api/index.js"]
