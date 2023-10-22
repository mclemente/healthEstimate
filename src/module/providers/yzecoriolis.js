import { t } from "../utils.js";
import EstimationProvider from "./templates/Base.js";

export default class yzecoriolisEstimationProvider extends EstimationProvider {
	constructor() {
		super();
		this.breakOnZeroMaxHP = true;
		this.estimations = [
			...this.estimations,
			{
				name: "Ships",
				rule: "type === \"ship\"",
				estimates: [
					{ value: 0, label: t("core.estimates.vehicles.0") },
					{ value: 20, label: t("core.estimates.vehicles.1") },
					{ value: 40, label: t("core.estimates.vehicles.2") },
					{ value: 60, label: t("core.estimates.vehicles.3") },
					{ value: 80, label: t("core.estimates.vehicles.4") },
					{ value: 100, label: t("core.estimates.vehicles.5") },
				],
			},
		];
	}

	fraction(token) {
		const type = token.actor.type;
		let hp;
		if (type === "ship") {
			hp = token.actor.system.hullPoints;
		}
		else hp = token.actor.system.hitPoints;
		return hp.value / hp.max;
	}
}
