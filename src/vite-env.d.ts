/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Web3Forms access key for the contact form. */
  readonly VITE_WEB3FORMS_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface CarControlsAPI {
  press(dir: string, on: boolean): void;
  goTo(id: string | null): void;
}

// Ambient augmentations — no import/export so these are script-scope globals
interface Window {
  CarControls: CarControlsAPI;
}

interface WindowEventMap {
  themechange: CustomEvent<{ theme: 'dark' | 'light' }>;
  listmodechange: CustomEvent<{ listMode: boolean }>;
}
