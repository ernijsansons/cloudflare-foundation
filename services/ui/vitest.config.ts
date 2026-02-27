import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const vite5SvelteCompat = {
	name: 'vite5-svelte-compat',
	configureServer(server: any) {
		// vite-plugin-svelte hot-update assumes `server.environments` (Vite 6+).
		// Vitest in this workspace is on Vite 5, so provide a safe fallback.
		server.environments ??= {};
	}
};

export default defineConfig({
	plugins: [vite5SvelteCompat, svelte({ hot: false })],
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/tests/setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: ['src/lib/**/*.{ts,svelte}'],
			exclude: [
				'src/lib/**/*.test.ts',
				'src/lib/**/*.spec.ts',
				'src/tests/**'
			],
			all: true,
			lines: 80,
			functions: 80,
			branches: 80,
			statements: 80
		}
	}
});
