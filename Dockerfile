# Build stage
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build

# Production stage
FROM node:22-alpine AS runner

WORKDIR /app

# Install fonts for SVG text rendering with resvg
# fontconfig: font configuration library
# font-noto-cjk: Japanese/Chinese/Korean font support
# ttf-dejavu: Basic Latin font
RUN apk add --no-cache fontconfig font-noto-cjk ttf-dejavu \
    && fc-cache -f

# Copy built output
COPY --from=builder /app/.output ./.output

# Set environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

# Start server
CMD ["node", ".output/server/index.mjs"]
