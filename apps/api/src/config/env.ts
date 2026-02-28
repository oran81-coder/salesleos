import { loadConfig, type AppConfig } from '@laos/config';

let cachedConfig: AppConfig | null = null;

export function getAppConfig(): AppConfig {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}

