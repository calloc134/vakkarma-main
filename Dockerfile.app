# reference: https://pnpm.io/ja/docker
FROM node:lts AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

# 実行ステージ
FROM oven/bun:1.2.4

WORKDIR /dist

# ビルドステージから必要なファイルだけコピー
COPY --from=build /app/dist /dist

# アプリケーションの実行
CMD ["./index.js"]