import { defineConfig } from 'astro/config';
import sampleIntegration from 'sample-integration';

console.log('------\n');
console.log('Using an astro.config.mjs that can be loaded natively.\n');

// https://astro.build/config
export default defineConfig({
	integrations: [sampleIntegration()],
});
