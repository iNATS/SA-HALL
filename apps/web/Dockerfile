FROM node:24.15.0-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Pre-compress text assets once so nginx serves them with gzip_static at no CPU cost.
RUN npm run build \
  && find dist/web/browser -type f \
     \( -name '*.js' -o -name '*.css' -o -name '*.html' -o -name '*.json' \
        -o -name '*.svg' -o -name '*.webmanifest' -o -name '*.ico' -o -name '*.txt' \) \
     -size +1k -exec gzip -9 -k {} +

FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/web/browser /usr/share/nginx/html
EXPOSE 8080
