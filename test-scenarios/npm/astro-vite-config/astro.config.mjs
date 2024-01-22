import { defineConfig } from 'astro/config';
import sampleIntegration from 'sample-integration';

import test from './test.json';
console.log('------\n');
console.log('Loaded a JSON file to force config loading through Vite:', test, '\n');

// https://astro.build/config
export default defineConfig({
	integrations: [sampleIntegration()],
});
