const missing = { value: 0, max: 1, };

const missingBlessures = {
	legeres: { list: [] },
	graves: { list: [] },
	critiques: { list: [] },
};

const tableBlessure = {
	legere: [0, 20, 40, 50, 60, 70],
	grave: [0, 60, 75],
	critique: [0, 95],
	inconscient: 100,
};

function betweenZeroAndOne(ratio) {
	return Math.max(0, Math.min(ratio, 1));
}

function ratio(node) {
	return betweenZeroAndOne(node.value / node.max);
}

const fraction = function (token) {
	if (token.actor.type == 'vehicule')	{
		return 1;
	}
	const fatigue = token.actor.data.data.sante?.fatigue ?? missing;
	const ratioFatigue = 1 - ratio({value: fatigue.value, max:fatigue.max}) / 2;
	const ratioVie = ratio(token.actor.data.data.sante?.vie ?? missing);
	const ratioEndurance = 0.4 + ratio(token.actor.data.data.sante?.endurance ?? missing) * 0.6;
	const ratioBlessure = 1 - ratio(estimationBlessures(token));

	return Math.min(ratioBlessure, ratioEndurance, ratioFatigue, ratioVie);
};

export { fraction };

function estimationBlessures(token) {
	if (token.actor.data.data.blessures === undefined) {
		return missing;
	}
	const nodeBlessures = token.actor.data.data.blessures ?? missingBlessures;
	const legeres = nodeBlessures.legeres.liste.filter((it) => it.active).length;
	const graves = nodeBlessures.graves.liste.filter((it) => it.active).length;
	const critiques = nodeBlessures.critiques.liste.filter((it) => it.active).length;

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
		value: critiques > 0 ? tableBlessure.critique[critiques] : graves > 0 ? tableBlessure.grave[graves] : tableBlessure.legere[legeres],
		max: tableBlessure.inconscient,
	};
}


