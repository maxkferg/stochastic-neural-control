# Stage 1 - the build process
FROM node:11 as build-deps
WORKDIR /usr/src/app
COPY package.json ./
RUN npm install --quiet
COPY . ./
RUN yarn build

# Stage 2 - the production environment
FROM nginx:1.12-alpine
COPY --from=build-deps /usr/src/app/deployment /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]