#!/bin/sh
# Writes the two files the cPanel deploy builds from GitHub secrets
# (config/config.js and firebase.json), here from environment variables.
# On AWS the variables come from Parameter Store through the ECS task.
set -e

if [ -n "$DB_HOST" ]; then
  node -e '
    const db = {
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      dialect: process.env.DB_DIALECT || "mysql",
      logging: false,
    }
    const body = "module.exports = " + JSON.stringify(
      { development: db, test: db, production: db }, null, 2) + "\n"
    require("fs").writeFileSync("config/config.js", body)
  '
  echo "[entrypoint] config/config.js written for host $DB_HOST"
else
  echo "[entrypoint] DB_HOST not set, keeping config/config.js as it is"
fi

if [ -n "$FIREBASE_JSON_B64" ]; then
  printf '%s' "$FIREBASE_JSON_B64" | base64 -d > firebase.json
  echo "[entrypoint] firebase.json written"
fi

# The app-version check reads the Google service account from a file path.
if [ -n "$GOOGLE_SERVICE_ACCOUNT_JSON_B64" ]; then
  printf '%s' "$GOOGLE_SERVICE_ACCOUNT_JSON_B64" | base64 -d > google-service-account.json
  export GOOGLE_SERVICE_ACCOUNT_KEY_PATH=/app/google-service-account.json
  echo "[entrypoint] google-service-account.json written"
fi

exec "$@"
