# Trim backend container for AWS (ECS Fargate).
# The cPanel deploy (.github/workflows/trim.yml) does not use this file.
FROM node:18.20.4-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

# Install libraries first so this layer is reused when only the code changes.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node . .

# Public is where uploads go (./Public/...); on AWS an EFS share is mounted here.
# The entrypoint writes config/config.js and firebase.json, so the app folder
# itself must be writable. No recursive chown: it would copy node_modules again.
RUN chmod +x docker-entrypoint.sh \
  && mkdir -p Public config \
  && chown node:node /app /app/Public /app/config

USER node
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "trim.js"]
