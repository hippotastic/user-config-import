import { fileURLToPath } from 'node:url';

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

export async function tryAwaitImportUrlToPath(root: URL) {
	try {
		return (await import(/* @vite-ignore */ fileURLToPath(new URL('./user-config.mjs', root)))).default;
	} catch (e) {
		return { error: e };
	}
}

export async function tryAwaitImportFileUrl(root: URL) {
	const url = new URL('./user-config.mjs', root);
	try {
		return (await import(/* @vite-ignore */ url.href)).default;
	} catch (e) {
		return { error: e };
	}
}

export async function tryAwaitImportCombined(root: URL) {
	const configFileName = 'user-config.mjs';
	try {
		// This is the only method that works on Windows when the Astro config is loaded natively
		return (await import(/* @vite-ignore */ new URL(`./${configFileName}`, root).href)).default;
	} catch (e) {
		// Ignore and try the next method
	}
	try {
		// This method works on Windows when the Astro config is loaded through Vite
		return (await import(/* @vite-ignore */ `/${configFileName}`)).default;
	} catch (e) {
		return { error: e };
	}
}
