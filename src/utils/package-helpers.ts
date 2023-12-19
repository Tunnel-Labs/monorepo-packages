import path from 'pathe';
import type { PackageJson } from 'type-fest';
import fs from 'node:fs';
import { createMonorepoPackageHelpers as createBrowserMonorepoPackageHelpers } from './package-helpers.browser.js';

export function createMonorepoPackageHelpers<
	Scope extends `@${string}`,
	MonorepoDirpath extends string,
	PackageJsonPaths extends Record<string, unknown>
>({
	monorepoDirpath,
	packageJsonPaths,
	scope
}: {
	scope: Scope;
	monorepoDirpath: MonorepoDirpath;
	packageJsonPaths: PackageJsonPaths;
}) {
	const browserMonorepoPackageHelpers = createBrowserMonorepoPackageHelpers({
		scope,
		monorepoDirpath,
		packageJsonPaths
	});

	async function getPackageJson({ packageName }: { packageName: string }) {
		const packageJson = JSON.parse(
			await fs.promises.readFile(
				path.join(
					browserMonorepoPackageHelpers.getPackageDirpath({ packageName }),
					'package.json'
				),
				'utf8'
			)
		);

		return packageJson as PackageJson;
	}

	function getPackageJsonSync({ packageName }: { packageName: string }) {
		const packageJson = JSON.parse(
			fs.readFileSync(
				path.join(
					browserMonorepoPackageHelpers.getPackageDirpath({ packageName }),
					'package.json'
				),
				'utf8'
			)
		);

		return packageJson as PackageJson;
	}

	return {
		...browserMonorepoPackageHelpers,
		getPackageJson,
		getPackageJsonSync
	};
}
