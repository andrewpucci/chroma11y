# Match GitHub Actions ubuntu-latest environment
FROM ubuntu:22.04

ARG NODE_VERSION=24.19.0
ARG TARGETARCH

# Install an exact Node.js LTS patch to match the pinned repo toolchain
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    xz-utils \
    && case "${TARGETARCH}" in \
        amd64) node_arch='x64' ;; \
        arm64) node_arch='arm64' ;; \
        *) echo "Unsupported architecture: ${TARGETARCH}" >&2; exit 1 ;; \
      esac \
    && curl -fsSLO "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${node_arch}.tar.xz" \
    && curl -fsSLO "https://nodejs.org/dist/v${NODE_VERSION}/SHASUMS256.txt" \
    && grep " node-v${NODE_VERSION}-linux-${node_arch}.tar.xz\$" SHASUMS256.txt | sha256sum -c - \
    && tar -xJf "node-v${NODE_VERSION}-linux-${node_arch}.tar.xz" -C /usr/local --strip-components=1 \
    && rm "node-v${NODE_VERSION}-linux-${node_arch}.tar.xz" SHASUMS256.txt \
    && node --version \
    && rm -rf /var/lib/apt/lists/*

# Install Playwright browser dependencies to match CI
RUN npx playwright install-deps \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Install all Playwright browsers for cross-browser testing
RUN npx playwright install chromium firefox webkit

# Copy source code
COPY . .

# Default: run E2E tests (Playwright handles build + preview via webServer config)
CMD ["npx", "playwright", "test"]
