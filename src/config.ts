function tryToGetEnv(key: keyof Window['_env_'], defaultValue: string): string {
    const value = window._env_?.[key];
    if (!value || value === `\${${key}}`)
        return defaultValue;

    return value;
}

export const API_BASE_URL = tryToGetEnv('API_BASE_URL', 'http://localhost:8085');