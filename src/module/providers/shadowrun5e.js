import EstimationProvider from "./templates/Base.js";

export default class shadowrun5eEstimationProvider extends EstimationProvider {
	fraction(token) {
		switch (token.actor.type) {
			case "character":
			case "spirit": {
				const stun = token.actor.system.track.stun;
				const physical = token.actor.system.track.physical;
				return Math.min((stun.max - stun.value) / stun.max, (physical.max - physical.value) / physical.max);
			}
			case "vehicle": {
				const physical = token.actor.system.track.physical;
				return (physical.max - physical.value) / physical.max;
			}
			case "sprite": {
				const matrix = token.actor.system.matrix.condition_monitor;
				return (matrix.max - matrix.value) / matrix.max;
			}
		}
	}
}
