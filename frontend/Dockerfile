FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL=/api/v1
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY frontend/package*.json ./
COPY frontend/tsconfig.json ./tsconfig.json
COPY frontend/tsconfig.app.json ./tsconfig.app.json
COPY frontend/tsconfig.node.json ./tsconfig.node.json
COPY frontend/vite.config.ts ./vite.config.ts
COPY frontend/tailwind.config.cjs ./tailwind.config.cjs
COPY frontend/postcss.config.cjs ./postcss.config.cjs
COPY frontend/index.html ./index.html
COPY frontend/src ./src
COPY frontend/public ./public

RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then npm ci; else npm install; fi
RUN npm run build

FROM nginx:1.27-alpine

COPY infra/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
