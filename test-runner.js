// @ts-check
import { existsSync, rmSync, copyFileSync, cpSync, readFileSync, writeFileSync } from 'node:fs';
import { execa } from 'execa';

const sampleProjectNames = ['astro-native-config', 'astro-vite-config'];
const packageManagers = ['npm', 'pnpm'];

if (process.argv.includes('clean')) cleanup();
await buildIntegration();
await prepareTestScenarios();
await runBuildTests();

// --- Step Functions ---

function cleanup() {
	console.log('  - Cleaning up previous sample projects');
	sampleProjectNames.forEach((projectName) => {
		removeDir(`./test-scenarios/npm/${projectName}`);
		removeDir(`./test-scenarios/pnpm/${projectName}`);
		removeDir(`./test-scenarios/pnpm-workspace/packages/${projectName}`);
	});
}

async function buildIntegration() {
	const integrationDir = './sample-integration';
	console.log('- Building sample-integration');
	console.log('  - Cleaning up previous output');
	removeDir(`${integrationDir}/dist-package`);
	console.log('  - Installing dependencies');
	await runCommand('pnpm', ['install'], integrationDir);
	console.log('  - Building');
	await runCommand('pnpm', ['build'], integrationDir);
	console.log('  - Preparing clean version');
	cpSync(`${integrationDir}/dist`, `${integrationDir}/dist-package/dist`, { recursive: true });
	copyFileSync(`${integrationDir}/package.json`, `${integrationDir}/dist-package/package.json`);
}

async function prepareTestScenarios() {
	console.log('- Preparing non-workspace test scenarios');
	console.log('  - Creating directories from templates');
	sampleProjectNames.forEach((projectName) => {
		const srcDir = `./sample-astro-projects/${projectName}`;
		packageManagers.forEach((packageManager) => {
			const projectDir = `./test-scenarios/${packageManager}/${projectName}`;
			cpSync(srcDir, projectDir, { recursive: true });
			processPackageJson(`${projectDir}/package.json`, (packageJsonObj) => {
				delete packageJsonObj.dependencies['sample-integration'];
			});
		});
	});
	console.log('  - Installing dependencies');
	for (const projectName of sampleProjectNames) {
		const projectDir = `./test-scenarios/npm/${projectName}`;
		if (!shouldInstallDependencies(projectDir)) continue;
		console.log(`    - ${projectDir}`);
		await runCommand('npm', ['i'], projectDir);
	}
	for (const projectName of sampleProjectNames) {
		const projectDir = `./test-scenarios/pnpm/${projectName}`;
		if (!shouldInstallDependencies(projectDir)) continue;
		console.log(`    - ${projectDir}`);
		await runCommand('pnpm', ['i'], projectDir);
	}
	console.log('  - Adding sample-integration package');
	sampleProjectNames.forEach((projectName) => {
		const srcDir = `./sample-integration/dist-package`;
		packageManagers.forEach((packageManager) => {
			const projectDir = `./test-scenarios/${packageManager}/${projectName}`;
			cpSync(srcDir, `${projectDir}/node_modules/sample-integration`, { recursive: true });
			processPackageJson(`${projectDir}/package.json`, (packageJsonObj) => {
				packageJsonObj.dependencies['sample-integration'] = '0.0.1';
			});
		});
	});

	console.log('- Preparing workspace test scenario');
	console.log('  - Creating directories from templates');
	sampleProjectNames.forEach((projectName) => {
		const srcDir = `./sample-astro-projects/${projectName}`;
		const projectDir = `./test-scenarios/pnpm-workspace/packages/${projectName}`;
		cpSync(srcDir, projectDir, { recursive: true });
		processPackageJson(`${projectDir}/package.json`, (packageJsonObj) => {
			packageJsonObj.dependencies['sample-integration'] = 'workspace:*';
		});
	});
	console.log('  - Adding sample-integration package to workspace');
	cpSync(
		`./sample-integration/dist-package`,
		`./test-scenarios/pnpm-workspace/packages/sample-integration`,
		{ recursive: true }
	);
	console.log('  - Installing workspace dependencies');
	await runCommand('pnpm', ['i'], './test-scenarios/pnpm-workspace');
}

async function runBuildTests() {
	const buildTests = [
		...packageManagers.flatMap((packageManager) =>
			sampleProjectNames.map((projectName) => ({
				id: `${packageManager}/${projectName}`,
				projectPath: `./test-scenarios/${packageManager}/${projectName}`,
				packageManager,
			}))
		),
		...sampleProjectNames.map((projectName) => ({
			id: `pnpm-workspace/${projectName}`,
			projectPath: `./test-scenarios/pnpm-workspace/packages/${projectName}`,
			packageManager: 'pnpm',
		})),
	];

	console.log('- Running Astro build tests');
	const testResultsByFunction = {};
	for (const { id, projectPath, packageManager } of buildTests) {
		console.log(`  - ${projectPath}`);
		const result = await runCommand(packageManager, ['run', 'build'], projectPath);
		result.replace(/^\*\*\* (.*?): ([\s\S]*?)\n\n/gm, (match, functionName, functionResult) => {
			let functionResults = testResultsByFunction[functionName];
			if (!functionResults) {
				functionResults = [];
				testResultsByFunction[functionName] = functionResults;
			}
			const functionResultChar = functionResult.includes('success:') ? '✅' : '❌';
			const shortId = id.replace(/(astro-|-config)/g, '');
			functionResults.push({
				shortId,
				tableColumn: `${shortId}: ${functionResultChar}`,
				firstResultLine: functionResult.split('\n')[1],
			});
			return match;
		});
	}

	for (const [functionName, functionResults] of Object.entries(testResultsByFunction)) {
		if (!functionName.startsWith('combined')) continue;
		console.log(`\n- Detailed results of function "${functionName}"`);
		console.log(
			functionResults
				.map((result) => {
					const prefix = `  - ${(result.shortId + ':').padEnd(25, ' ')}`;
					const shortMsg = result.firstResultLine
						.replace(/^(\s*error: TypeError )/, '')
						.replace(/Module "(.*?)"/, (_, path) => {
							return `Module "[...]/${path.split('/').slice(-2).join('/')}"`;
						})
						.trim();
					return `${prefix} ${shortMsg}`;
				})
				.join('\n')
		);
	}

	console.log('\n- Status by function');
	for (const [functionName, functionResults] of Object.entries(testResultsByFunction)) {
		console.log(
			`  - ${(functionName + ':').padEnd(25, ' ')} ${functionResults
				.map((result) => result.tableColumn)
				.join(', ')}`
		);
	}

	console.log('\n');
}

// --- Helpers ---

function removeDir(path) {
	if (existsSync(path)) {
		rmSync(path, { recursive: true });
	}
}

function shouldInstallDependencies(path) {
	if (process.argv.includes('clean') || process.argv.includes('deps')) return true;
	return !existsSync(`${path}/node_modules/astro`);
}

function processPackageJson(packageJsonPath, processingFn) {
	const packageJson = readFileSync(packageJsonPath, 'utf-8');
	const packageJsonObj = JSON.parse(packageJson);
	processingFn(packageJsonObj);
	const newContents = JSON.stringify(packageJsonObj, null, 2);
	writeFileSync(packageJsonPath, newContents);
}

async function runCommand(command, args, cwd) {
	const commandResult = await execa(command, args, { cwd });
	// Throw an error if the build command failed
	if (commandResult.failed || commandResult.stderr) {
		throw new Error(commandResult.stderr.toString());
	}
	return commandResult.stdout.toString();
}
