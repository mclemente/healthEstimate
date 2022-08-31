const fraction = function (token) {
	switch (token.actor.type) {
		case "Accelerated": {
			let hitCounter = 6;
			for (let [key, value] of Object.entries(token.actor.system.health.cons)) {
				if (value.value !== "") {
					hitCounter -= 1;
				}
			}
			for (let [key, value] of Object.entries(token.actor.system.health.stress)) {
				hitCounter -= 1 * value;
			}
			return hitCounter / 6;
		}
		case "Core": {
			//TODO: Add actual logic when necessary variables are added to the token
		}
	}
};
const breakCondition = `||token.actor.type !== "Accelerated"`;

export { fraction, breakCondition };
