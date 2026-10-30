FROM node:24-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
RUN npm ci
COPY frontend/ frontend/
RUN npm run build

FROM nginx:1.28-alpine
ARG PZW_GID=33
RUN existing="$(awk -F: -v gid="$PZW_GID" '$3 == gid { print $1; exit }' /etc/group)" \
    && if [ -z "$existing" ]; then addgroup -g "$PZW_GID" -S pzwuploads; existing=pzwuploads; fi \
    && addgroup nginx "$existing"
COPY deploy/docker-nginx.conf /etc/nginx/nginx.conf
COPY --from=build /src/frontend/dist/ /var/www/printwithzwe/
EXPOSE 8080 8443