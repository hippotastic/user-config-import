export async function tryMetaGlob() {
	try {
		const configFiles = import.meta.glob('/user-config.*', { import: 'default' });
		return (await configFiles['/user-config.mjs']?.()) || { notFound: true };
	} catch (e) {
		return { error: e };
	}
}

export async function tryAwaitImportRoot() {
	try {
		return (await import('/user-config.mjs')).default;
	} catch (e) {
		return { error: e };
	}
}

export async function tryAwaitImportRelative() {
	try {
		return (await import('./user-config.mjs')).default;
	} catch (e) {
		return { error: e };
	}
}