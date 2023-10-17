import capitalize from 'just-capitalize';

export function kebabCaseToCamelCase(kebabCaseString: string) {
	const words = kebabCaseString.split('-');
	return words
		.map((word, index) => {
			if (index === 0) return word;
			return capitalize(word);
		})
		.join('');
}
