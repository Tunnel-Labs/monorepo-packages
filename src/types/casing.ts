export type PascalCase<T extends string[]> = T extends [
	infer A extends string,
	...infer B extends string[]
]
	? `${Capitalize<A>}${PascalCase<B>}`
	: '';

export type CamelCase<T extends string[]> = T extends [
	infer A extends string,
	...infer B extends string[]
]
	? `${A}${PascalCase<B>}`
	: '';
