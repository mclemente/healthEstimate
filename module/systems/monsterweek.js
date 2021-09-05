import {isEmpty} from '../utils.js';

const fraction = function (token) {
	const hp = token.actor.data.data.harm;
	return hp.value / hp.max;
};
const breakCondition = `||token.actor.data.type === "location"`;

export {fraction, breakCondition};