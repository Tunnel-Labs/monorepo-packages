import { createPackageBuilder } from 'lionconfig';
import fs from 'node:fs';

await createPackageBuilder(import.meta, {
	packageJsonPath: '../package.json'
})
	.cleanDistFolder()
	.tsc()
	.generateBundles({ commonjs: true })
	.copyPackageFiles()
	.build();
