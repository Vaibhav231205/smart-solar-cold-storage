const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

// Local dev uses the Vite proxy at /api. Production needs an explicit backend URL.
export const isApiEnabled = import.meta.env.DEV || Boolean(configuredBaseUrl);

export const API_BASE_URL = configuredBaseUrl || '/api';
