import { sGet, t } from "../utils.js";
import { HealthEstimateSettings } from "./templates/Base.js";

export default class HealthEstimateEstimationSettings extends HealthEstimateSettings {
	constructor(object, options = {}) {
		super(object, options);
		this.estimations = deepClone(sGet("core.estimations"));
		this.changeTabs = null;
	}

	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			id: "health-estimate-estimation-form",
			title: `Health Estimate: ${t("core.estimationSettings.title")}`,
			template: "./modules/healthEstimate/templates/EstimationSettings.hbs",
			classes: ["form", "healthEstimate", "estimationSettings"],
			height: "auto",
			tabs: [{ navSelector: ".tabs", contentSelector: ".content", initial: "behavior" }],
		});
	}

	getData(options) {
		return {
			estimations: this.estimations,
		};
	}

	/**
	 * This is the earliest method called after render() where changing tabs can be called
	 * @param {*} html
	 */
	_activateCoreListeners(html) {
		super._activateCoreListeners(html);
		if (this.changeTabs !== null) {
			const tabName = this.changeTabs.toString();
			if (tabName !== this._tabs[0].active) this._tabs[0].activate(tabName);
			this.changeTabs = null;
		}
	}

	async activateListeners(html) {
		super.activateListeners(html);
		html.find("button[name=reset]").on("click", async (event) => {
			await this.resetToDefault("estimations");
			this.estimations = sGet("core.estimations");
			canvas.scene?.tokens.forEach((token) => token.object.refresh());
			this.close();
		});

		// Handle all changes to tables
		html.find("a[data-action=add-table]").on("click", (event) => {
			this.changeTabs = this.estimations.length;
			this.estimations.push({
				name: "",
				rule: "",
				estimates: [
					{
						label: t("core.estimates.worst"),
						value: 0,
					},
					{
						label: t("core.estimates.best"),
						value: 100,
					},
				],
			});
			this.render();
		});
		html.find("button[data-action=table-delete]").on("click", (event) => {
			const { idx } = event.target.dataset ?? {};
			this.estimations.splice(Number(idx), 1);
			this.changeTabs = Number(idx) - 1;
			this.render();
		});
		html.find("button[data-action=change-prio]").on("click", (event) => {
			const prio = event.target?.dataset.prio === "increase" ? -1 : 1;
			const idx = Number(event.target?.dataset.idx);

			const arraymove = (arr, fromIndex, toIndex) => {
				const element = arr[fromIndex];
				arr.splice(fromIndex, 1);
				arr.splice(toIndex, 0, element);
			};

			arraymove(this.estimations, idx, idx + prio);
			this.changeTabs = idx + prio;
			this.render();
		});
		for (const input of html[0].querySelectorAll(".form-group input, .form-group textarea")) {
			input.addEventListener("change", (event) => {
				// eslint-disable-next-line no-unused-vars
				const [_, tableIndex, property] = event.target.name.split(".");
				this.estimations[tableIndex][property] = event.target.value;
				event.preventDefault();
			});
		}

		// Handle all changes for estimations
		html.find("[data-action=estimation-add]").on("click", (event) => {
			// Fix for clicking either the A or I tag
			const idx = Number(event.target?.dataset.idx ?? event.target?.children[0]?.dataset.idx);
			this.estimations[idx].estimates.push({ label: "Custom", value: 100 });
			this.render();
		});
		for (const element of html[0].querySelectorAll("[data-action=estimation-delete]")) {
			element.addEventListener("click", async (event) => {
				const { table, idx } = event.target?.dataset ?? {};
				if (idx) this.estimations[table].estimates.splice(Number(idx), 1);
				this.render();
			});
		}
		for (const element of html[0].querySelectorAll(".estimation-types input")) {
			element.addEventListener("change", async (event) => {
				// eslint-disable-next-line no-unused-vars
				const [_, table, tableIndex, estimateIndex, rule] = event.target?.name.split(".") ?? [];
				if (this.estimations[table]?.estimates?.[estimateIndex]?.[rule]) {
					this.estimations[table].estimates[estimateIndex][rule] = event.target?.value;
				}
				event.preventDefault();
			});
		}
	}

	_getSubmitData(updateData) {
		const original = super._getSubmitData(updateData);
		const data = expandObject(original);
		const estimations = [];
		for (const key in data.estimations) {
			const { name, rule, ignoreColor, estimates } = data.estimations[key];
			const sortedEstimates = Object.keys(estimates)
				.sort((a, b) => estimates[a].value - estimates[b].value)
				.map((innerKey) => estimates[innerKey]);
			estimations.push({ name, rule, ignoreColor, estimates: sortedEstimates });
		}
		return { estimations };
	}
}
