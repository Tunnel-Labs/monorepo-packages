import path from 'pathe';
import yaml from 'yaml';
import type { PackageJson } from 'type-fest';
import __require from 'cjs-require';

export function getMonorepoPackages({
	monorepoDirpath
}: {
	monorepoDirpath: string;
}): {
	[packageName: string]: { packageDirpath: string; packageJson: PackageJson };
} {
	const { glob } = __require('glob') as typeof import('glob');
	const fs = __require('fs') as typeof import('fs');
	let packageDirpathGlobs: string[];
	const packageJsonFilepath = path.join(monorepoDirpath, 'package.json');

	if (!fs.existsSync(packageJsonFilepath)) {
		throw new Error(
			`Could not find package.json file at "${packageJsonFilepath}"`
		);
	}

	const packageJson = JSON.parse(fs.readFileSync(packageJsonFilepath, 'utf8'));

	if (packageJson.workspaces !== undefined) {
		packageDirpathGlobs = packageJson.workspaces;
	} else if (fs.existsSync(path.join(monorepoDirpath, 'pnpm-workspace.yaml'))) {
		const pnpmWorkspacePackages = yaml.parse(
			fs.readFileSync(path.join(monorepoDirpath, 'pnpm-workspace.yaml'), 'utf8')
		)?.packages;

		if (pnpmWorkspacePackages === undefined) {
			throw new Error(
				`Could not find "packages" property in pnpm-workspace.yaml file at "${path.join(
					monorepoDirpath,
					'pnpm-workspace.yaml'
				)}"`
			);
		}

		packageDirpathGlobs = pnpmWorkspacePackages;
	} else if (packageJson.root) {
		packageDirpathGlobs = ['.'];
	} else {
		throw new Error(
			`Monorepo package.json does not include "workspaces" property or "root" property and could not locate pnpm-workspace.yaml file in "${monorepoDirpath}"`
		);
	}

	const packageJsonFilepathsArray = glob.sync(
		packageDirpathGlobs.map((packageDirpathGlob: string) =>
			path.join(monorepoDirpath, packageDirpathGlob, 'package.json')
		),
		{ absolute: true }
	);

	const packageNameToPackageMetadata: Record<
		string,
		{ packageDirpath: string; packageJson: PackageJson }
	> = {};
	for (const packageJsonFilepath of packageJsonFilepathsArray) {
		const packageJson = JSON.parse(
			fs.readFileSync(packageJsonFilepath, 'utf8')
		);
		packageNameToPackageMetadata[packageJson.name] = {
			packageDirpath: path.dirname(packageJsonFilepath),
			packageJson
		};
	}

	return packageNameToPackageMetadata;
}
