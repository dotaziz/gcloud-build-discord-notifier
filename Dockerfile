FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY tsconfig.json tsup.config.ts ./
COPY src ./src
RUN pnpm build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/dist/server.cjs .
USER node
EXPOSE 8080
CMD ["node", "server.cjs"]
