import type { AstroIntegration } from 'astro';
import { tryAwaitImportCombined, tryAwaitImportFileUrl, tryAwaitImportRelative, tryAwaitImportRoot, tryAwaitImportUrlToPath, tryMetaGlob } from './load-config';

export function sampleIntegration() {
	return {
		name: 'sample-integration',
		hooks: {
			'astro:config:setup': async ({ config }) => {
				console.log('Now trying to load user config:');
				// console.log('\n*** tryMetaGlob:', await tryMetaGlob());
				// console.log('\n*** tryAwaitImportRoot:', await tryAwaitImportRoot());
				// console.log('\n*** tryAwaitImportRelative:', await tryAwaitImportRelative());
				// console.log('\n*** tryAwaitImportUrlToPath:', await tryAwaitImportUrlToPath(config.root));
				// console.log('\n*** tryAwaitImportFileUrl:', await tryAwaitImportFileUrl(config.root));
				console.log('\n*** tryAwaitImportCombined:', await tryAwaitImportCombined(config.root));
				console.log('\n------\n');
			},
		},
	} satisfies AstroIntegration;
}

export default sampleIntegration;
