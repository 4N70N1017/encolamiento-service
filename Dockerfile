# Usa una imagen oficial de Node.js como base
FROM node:20-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala las dependencias de producción
RUN npm install --production

# Copia el resto del código fuente al contenedor
COPY . .

# Construye la aplicación NestJS
RUN npm run build

# Expone el puerto en el que corre tu app (ajusta si usas otro)
EXPOSE 3000

# Comando por defecto para arrancar la app en modo producción
CMD ["npm", "run", "start:prod"]