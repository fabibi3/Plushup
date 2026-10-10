import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Tests de la logique pure (src/lib) — pas de rendu RN ici, donc rapides (< 1 s).
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
