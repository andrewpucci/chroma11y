# Match GitHub Actions ubuntu-latest environment
FROM ubuntu:22.04

# Install Node.js 24 to match CI
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /usr/share/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/nodesource.gpg] https://deb.nodesource.com/node_24.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install -y nodejs \
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
