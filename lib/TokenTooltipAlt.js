//Modified code from Token Tooltip Alt by Marian Bucatariu (bmarian)
//License: MIT

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
