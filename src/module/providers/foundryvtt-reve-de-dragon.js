import EstimationProvider from "./templates/Base.js";

export default class reveDeDragonEstimationProvider extends EstimationProvider {
	fraction(token) {
		function ratio(node) {
			return Math.clamped(node.value / node.max, 0, 1);
		}
		function estimationBlessures(token) {
			if (token.actor.system.blessures === undefined) {
				return missing;
			}
			const nodeBlessures = token.actor.system.blessures ?? {
				legeres: { list: [] },
				graves: { list: [] },
				critiques: { list: [] },
			};
			const legeres = nodeBlessures.legeres.liste.filter((it) => it.active).length;
			const graves = nodeBlessures.graves.liste.filter((it) => it.active).length;
			const critiques = nodeBlessures.critiques.liste.filter((it) => it.active).length;

			const tableBlessure = {
				legere: [0, 10, 20, 30, 40, 50],
				grave: [0, 60, 70],
				critique: [0, 90],
				inconscient: 100,
			};
			/*
			 * Estimation of seriousness of wounds: considerinng wounds that can be taken.
			 * - 5x "legere" = light
			 * - 2x "grave" = serious
			 * - 1x "critique" = critical
			 * If one type of wounds is full, next in this category automatically goes
			 * to the next (ie: 3rd serious wound becomes critical).
			 * Using an estimation of state of health based on the worst category of wounds
			 */
			return {
				value: critiques > 0
					? tableBlessure.critique[critiques]
					: graves > 0
						? tableBlessure.grave[graves]
						: tableBlessure.legere[legeres],
				max: tableBlessure.inconscient,
			};
		}
		const missing = { value: 0, max: 1 };

		if (token.actor.type === "entite") {
			return ratio(token.actor.system.sante.endurance);
		}
		const ratioFatigue = 1 - (ratio(token.actor.system.sante?.fatigue ?? missing) / 2);
		const ratioVie = ratio(token.actor.system.sante?.vie ?? missing);
		const ratioEndurance = 0.4 + (ratio(token.actor.system.sante?.endurance ?? missing) * 0.6);
		const ratioBlessure = 1 - ratio(estimationBlessures(token));

		return Math.min(ratioBlessure, ratioEndurance, ratioFatigue, ratioVie);
	}

	get breakCondition() {
		return "||token.actor.type === \"vehicule\"";
	}
}
