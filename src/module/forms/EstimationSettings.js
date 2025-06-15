import { sGet, t } from "../utils.js";
import { HealthEstimateSettings } from "./templates/Base.js";

export default class HealthEstimateEstimationSettings extends HealthEstimateSettings {
	constructor(object, options = {}) {
		super(object, options);
		this.estimations = foundry.utils.deepClone(sGet("core.estimations"));
		this.changeTabs = null;
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
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
			fields: game.settings.settings.get("healthEstimate.core.estimations"),
			widget: this.#estimationWidget.bind(this)
		};
	}

	#estimationWidget(field, _groupConfig, inputConfig) {
		const div = document.createElement("div");
		const { fields } = field.element;
		const { localize, value } = inputConfig;
		value.forEach((data, index) => {
			const { estimates, ignoreColor, name, rule } = data;
			const hidden = index === 0;
			const tab = document.createElement("div");
			tab.className = "tab";
			tab.dataset.tab = index;

			const nameInput = fields.name.toFormGroup({ hidden, localize }, { name: `estimations.${index}.name`, value: name });
			const ruleInput = fields.rule.toFormGroup({ hidden, localize }, {
				name: `estimations.${index}.rule`,
				value: rule,
				elementType: "code-mirror",
				language: "javascript"
			});
			const ignoreColorInput = fields.ignoreColor.toFormGroup({ hidden, localize }, { name: `estimations.${index}.ignoreColor`, value: ignoreColor });

			const estimatesTable = document.createElement("table");
			estimatesTable.className = "estimation-types";
			const tableHeader = document.createElement("tr");
			tableHeader.innerHTML = `
				<th>${game.i18n.localize("healthEstimate.core.estimationSettings.estimate")}</th>
				<th>%</th>
				<th class="delete-cell"></th>
			`;
			estimatesTable.append(tableHeader);

			estimates.forEach((estimate, i) => {
				const row = document.createElement("tr");
				const labelCell = document.createElement("td");
				labelCell.append(
					foundry.applications.fields.createTextInput({
						name: `estimations.${index}.estimates.${i}.label`,
						value: estimate.label
					})
				);
				const valueCell = document.createElement("td");
				valueCell.append(
					foundry.applications.fields.createNumberInput({
						name: `estimations.${index}.estimates.${i}.value`,
						value: estimate.value,
						min: 0,
						max: 100
					})
				);

				const deleteTD = document.createElement("td");
				deleteTD.className = "delete-cell";
				deleteTD.innerHTML = `
					<a class="delete-button" data-action="estimation-delete">
						<i class="fas fa-times" data-table="${index}" data-idx="${i}"></i>
					</a>
				`;

				row.append(labelCell, valueCell, deleteTD);
				estimatesTable.append(row);
			});

			tab.append(nameInput, ruleInput, ignoreColorInput, estimatesTable);
			if (index !== 0) {
				tab.append(HealthEstimateEstimationSettings.createEstimationButtons(index, index === value.length - 1));
			}
			div.append(tab);
		});
		return div;
	}

	static createEstimationButtons(idx, isLast) {
		const container = document.createElement("div");
		container.classList.add("flexrow", "estimation-buttons");

		// Left button
		const leftBtn = document.createElement("button");
		leftBtn.type = "button";
		if (idx === 1) {
			leftBtn.disabled = true;
		} else {
			leftBtn.dataset.tooltip = game.i18n.localize("healthEstimate.core.estimationSettings.prioIncrease");
			leftBtn.dataset.action = "change-prio";
			leftBtn.dataset.prio = "increase";
			leftBtn.dataset.idx = idx;
		}
		const leftIcon = document.createElement("i");
		leftIcon.classList.add("far", "fa-chevron-left");
		leftBtn.appendChild(leftIcon);
		container.appendChild(leftBtn);

		// Delete button
		const deleteBtn = document.createElement("button");
		deleteBtn.type = "button";
		deleteBtn.dataset.action = "table-delete";
		deleteBtn.dataset.idx = idx;
		const trashIcon = document.createElement("i");
		trashIcon.classList.add("fas", "fa-trash");
		deleteBtn.appendChild(trashIcon);
		deleteBtn.append(" ", game.i18n.localize("healthEstimate.core.estimationSettings.deleteTable"));
		container.appendChild(deleteBtn);

		// Right button
		const rightBtn = document.createElement("button");
		rightBtn.type = "button";
		if (isLast) {
			rightBtn.disabled = true;
		} else {
			rightBtn.dataset.tooltip = game.i18n.localize("healthEstimate.core.estimationSettings.prioDecrease");
			rightBtn.dataset.action = "change-prio";
			rightBtn.dataset.prio = "reduce";
			rightBtn.dataset.idx = idx;
		}
		const rightIcon = document.createElement("i");
		rightIcon.classList.add("far", "fa-chevron-right");
		rightBtn.appendChild(rightIcon);
		container.appendChild(rightBtn);

		return container;
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
			this.estimations = foundry.utils.deepClone(game.settings.settings.get("healthEstimate.core.estimations").default);
			this.render();
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
