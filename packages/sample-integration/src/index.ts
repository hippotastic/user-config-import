import { tryAwaitImportRelative, tryAwaitImportRoot, tryMetaGlob } from './load-config';

export function sampleIntegration() {
	return {
		name: 'sample-integration',
		hooks: {
			'astro:config:setup': async () => {
				console.log('Now trying to load user config:');
				console.log('\n*** tryMetaGlob:', await tryMetaGlob());
				console.log('\n*** tryAwaitImportRoot:', await tryAwaitImportRoot());
				console.log('\n*** tryAwaitImportRelative:', await tryAwaitImportRelative());
				console.log('\n------\n');
			},
		},
	};
}

export default sampleIntegration;
