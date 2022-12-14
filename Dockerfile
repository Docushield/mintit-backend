FROM node:18.10.0-alpine
WORKDIR /usr
COPY package.json ./
COPY tsconfig.json ./
COPY src ./src
RUN ls -a
RUN npm install
RUN npm run build

## this is stage two , where the app actually runs
FROM node:18.10.0-alpine
WORKDIR /usr
COPY package.json ./
RUN npm install
COPY --from=0 /usr/dist .
RUN npm install pm2 pg -g
EXPOSE 8080
CMD ["node", "server.js"]
