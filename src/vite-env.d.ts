/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_FALL_URL?: string;
  readonly VITE_VEHICLE_URL?: string;
  readonly VITE_RAILWAY_URL?: string;
  readonly VITE_ANIMAL_URL?: string;
  readonly VITE_CROWD_API_BASE_URL?: string;
  readonly VITE_FIRE_URL?: string;
  readonly VITE_WS_URL?: string;
  readonly VITE_WS_FALL_URL?: string;
  readonly VITE_WS_VEHICLE_URL?: string;
  readonly VITE_WS_RAILWAY_URL?: string;
  readonly VITE_WS_ANIMAL_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
