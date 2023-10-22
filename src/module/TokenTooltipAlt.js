// Modified code from Token Tooltip Alt by Marian Bucatariu (bmarian)
// License: MIT

export const REG = {
	// searches if the string is one path
	path: new RegExp(/^([\w_-]+\.)*([\w_-]+)$/),
};

// extracts data from an object, and a string path,
// it has no depth search limit
export function getNestedData(data, path) {
	if (!REG.path.test(path)) {
		return null;
	}
	const paths = path.split(".");
	if (!paths.length) {
		return null;
	}
	let res = data;
	for (let i = 0; i < paths.length; i += 1) {
		if (res === undefined) {
			return null;
		}
		res = res?.[paths[i]];
	}
	return res;
}
