/// <reference types="vite/client" />

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
}
