import mapObject, { mapObjectSkip } from 'map-obj';
import path from 'pathe';
import invariant from 'tiny-invariant';
import type { Split } from 'type-fest';
import { CamelCase } from '../types/casing.js';
import { kebabCaseToCamelCase } from './casing.js';

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
	const packageSlugpaths = {
		...mapObject(packageJsonPaths, (packageJsonPath) => {
			const packageSlugpath = path.dirname(packageJsonPath as string);
			const packageSlug = path.basename(packageSlugpath);
			const packageKey = kebabCaseToCamelCase(packageSlug);
			return [packageKey, packageSlugpath];
		}),
		monorepo: '/monorepo'
	} as {
		[K in keyof typeof packageJsonPaths as K extends `${infer _PackageCategory}/${infer PackageSlug}/package.${string}`
			? CamelCase<Split<PackageSlug, '-'>>
			: never]: K extends `${infer PackageSlugpath}/package.${string}`
			? PackageSlugpath
			: never;
	} & { monorepo: '/monorepo' };

	const packageSlugs = mapObject(
		packageSlugpaths,
		(packageKey, packageSlugpath) => {
			const packageSlug = path.basename(packageSlugpath as string);
			return [packageKey as string, packageSlug];
		}
	) as {
		[K in keyof typeof packageSlugpaths]: (typeof packageSlugpaths)[K] extends `${infer _PackageCategory}/${infer PackageSlug}`
			? PackageSlug
			: never;
	};

	const packageCategories = mapObject(
		packageSlugpaths,
		(packageKey, packageSlugpath) => {
			const packageCategory = path.dirname(packageSlugpath as string);
			// We want to skip the property so that `Object.values(packageCategories)` won't display it
			if (packageCategory === '') return mapObjectSkip;
			return [packageKey as string, packageCategory];
		}
	) as unknown as {
		[K in keyof typeof packageSlugpaths as K extends 'monorepo'
			? never
			: K]: (typeof packageSlugpaths)[K] extends `${infer PackageCategory}/${infer _PackageSlug}`
			? PackageCategory
			: never;
	};

	// Not typed because the package directory is different for each developer as it is the full file path
	const packageDirpaths = mapObject(packageSlugs, (packageKey, packageSlug) => [
		packageKey as string,
		getPackageDirpath({ packageSlug })
	]) as unknown as {
		[K in keyof typeof packageSlugpaths]: string;
	};

	const packageNames = mapObject(packageSlugs, (packageKey, packageSlug) => [
		packageKey as string,
		getPackageName({ packageSlug })
	]) as {
		[K in keyof typeof packageSlugpaths]: (typeof packageSlugpaths)[K] extends `${infer _PackageCategory}/${infer PackageSlug}`
			? `${Scope}/${PackageSlug}`
			: never;
	};

	function getPackageCategory({ packageName }: { packageName: string }) {
		const packageKey = getPackageKey({ packageName });
		const packageCategory = (packageCategories as any)[packageKey];
		invariant(
			packageCategory !== undefined,
			`Package ${packageName} is not associated with a category`
		);
		return packageCategory;
	}

	function getPackageRelativePath({ packageName }: { packageName: string }) {
		const packageCategory = getPackageCategory({ packageName });
		if (packageCategory === 'monorepo') {
			return '.';
		} else {
			const packageSlug = getPackageSlug({ packageName });
			return `${packageCategory}/${packageSlug}`;
		}
	}

	function packageNameToSlug(packageName: string) {
		return packageName.replace(`${scope}/`, '');
	}

	function packageSlugToName(packageSlug: string) {
		return `${scope}/${packageSlug}`;
	}

	function packageNameToDirpath(packageName: string) {
		if (packageName === `${scope}/monorepo`) {
			return monorepoDirpath;
		}

		return path.join(monorepoDirpath, getPackageRelativePath({ packageName }));
	}

	function packageDirpathToName(packageDirpath: string) {
		packageDirpath = path.normalize(packageDirpath);
		if (packageDirpath === monorepoDirpath) {
			return packageNames.monorepo;
		}

		return packageSlugToName(path.basename(packageDirpath));
	}

	function getPackageKey({ packageName }: { packageName: string }) {
		const packageSlug = getPackageSlug({ packageName });
		return kebabCaseToCamelCase(packageSlug);
	}

	function getPackageSlug(
		args: { packageDirpath: string } | { packageName: string }
	) {
		let packageName: string;
		if ('packageDirpath' in args) {
			packageName = packageDirpathToName(args.packageDirpath);
		} else {
			packageName = args.packageName;
		}

		return packageNameToSlug(packageName);
	}

	function getPackageName(
		args:
			| { packageDirpath: string }
			| { packageSlug: string }
			| { packageImport: string }
	) {
		if ('packageDirpath' in args) {
			return packageDirpathToName(args.packageDirpath);
		} else if ('packageSlug' in args) {
			return packageSlugToName(args.packageSlug);
		} else if ('packageImport' in args) {
			return args.packageImport.match(/^@\w\/[^/]+/)?.[0] ?? args.packageImport;
		} else {
			throw new Error(`Invalid arguments: ${JSON.stringify(args)}`);
		}
	}

	function getPackageDirpath(
		args: { packageName: string } | { packageSlug: string }
	) {
		let packageName: string;
		if ('packageSlug' in args) {
			packageName = packageSlugToName(args.packageSlug);
		} else {
			packageName = args.packageName;
		}

		return packageNameToDirpath(packageName);
	}

	function isMonorepoPackageName(packageName: string) {
		return new RegExp(`^${scope}/[^/]+$`).test(packageName);
	}

	function isMonorepoPackageImport(packageName: string) {
		return new RegExp(`^${scope}/`).test(packageName);
	}

	return {
		packageSlugpaths,
		packageSlugs,
		packageCategories,
		packageDirpaths,
		packageNames,
		getPackageCategory,
		getPackageRelativePath,
		packageNameToSlug,
		packageSlugToName,
		packageNameToDirpath,
		packageDirpathToName,
		getPackageKey,
		getPackageSlug,
		getPackageName,
		getPackageDirpath,
		isMonorepoPackageName,
		isMonorepoPackageImport
	};
}
