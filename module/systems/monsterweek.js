import { isEmpty } from "../utils.js";

const fraction = function (token) {
	const hp = token.actor.system.harm;
	return hp.value / hp.max;
};
const breakCondition = `||token.actor.type === "location"`;

export { fraction, breakCondition };
