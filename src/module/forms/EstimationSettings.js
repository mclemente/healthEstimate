import { sGet, sSet, t } from "../utils.js";
import { HealthEstimateSettingsV2 } from "./templates/BaseV2.js";

export default class HealthEstimateEstimationSettings extends HealthEstimateSettingsV2 {
	constructor(object, options = {}) {
		super(object, options);
		this.estimations = foundry.utils.deepClone(sGet("core.estimations"));
	}

	static DEFAULT_OPTIONS = {
		id: "health-estimate-estimation-form",
		actions: {
			addTable: HealthEstimateEstimationSettings.addTable,
			deleteTable: HealthEstimateEstimationSettings.deleteTable,
			changePrio: HealthEstimateEstimationSettings.changePrio,
			addEstimation: HealthEstimateEstimationSettings.addEstimation,
			deleteEstimation: HealthEstimateEstimationSettings.deleteEstimation,
			reset: HealthEstimateEstimationSettings.reset,
		},
		form: {
			handler: HealthEstimateEstimationSettings.#onSubmit
		},
		window: {
			icon: "fas fa-scale-balanced",
			contentClasses: ["standard-form", "healthEstimate", "estimationSettings"],
			title: "healthEstimate.core.estimationSettings.title",
			resizable: true
		}
	};

	static PARTS = {
		tabs: { template: "templates/generic/tab-navigation.hbs" },
		form: { template: "./modules/healthEstimate/templates/EstimationSettings.hbs" },
		...HealthEstimateSettingsV2.PARTS,
	};

	_estimations;

	get estimations() {
		return this._estimations ??= foundry.utils.deepClone(sGet("core.estimations"));
	}

	set estimations(value) {
		this._estimations = value;
	}

	tabGroups = {
		main: "0",
		...this.estimations.reduce((types, _, index) => {
			types[index] = "basics";
			return types;
		}, {})
	};

	#prepareTabs() {
		return this.estimations.reduce((tabs, tabData, index) => {
			const active = this.tabGroups.main === String(index);
			tabs[index] = {
				id: index,
				group: "main",
				label: index === 0 ? game.i18n.localize("healthEstimate.core.estimationSettings.default") : tabData.name,
				active,
				cssClass: active ? "active" : "",
				data: tabData
			};
			return tabs;
		}, {});
	}

	_prepareContext(options) {
		return {
			tabs: this.#prepareTabs(),
			verticalTabs: true,
			fields: game.settings.settings.get("healthEstimate.core.estimations"),
			widget: this.#estimationWidget.bind(this),
			buttons: this._getButtons(),
		};
	}

	#estimationWidget(field, _groupConfig, inputConfig) {
		const div = document.createElement("div");
		const { fields } = field.element;
		const { index, localize, value } = inputConfig;

		function createInput(id) {
			let inputValue = value[id];
			if (id === "rule" && inputValue === "default") inputValue = "";
			return fields[id].toFormGroup({ hidden: index === 0, localize }, { name: `${index}.${id}`, value: inputValue });
		}

		const estimatesTable = document.createElement("table");
		estimatesTable.className = "estimation-types";
		const tableHeader = document.createElement("tr");
		tableHeader.innerHTML = `
			<th>${game.i18n.localize("healthEstimate.core.estimationSettings.estimate")}</th>
			<th>%</th>
			<th class="delete-cell"></th>
		`;
		estimatesTable.append(tableHeader);

		value.estimates.forEach((estimate, i) => {
			const row = document.createElement("tr");
			const labelCell = document.createElement("td");
			labelCell.append(
				foundry.applications.fields.createTextInput({
					name: `${index}.estimates.${i}.label`,
					value: estimate.label
				})
			);
			const valueCell = document.createElement("td");
			valueCell.append(
				foundry.applications.fields.createNumberInput({
					name: `${index}.estimates.${i}.value`,
					value: estimate.value,
					min: 0,
					max: 100
				})
			);

			const deleteTD = document.createElement("td");
			deleteTD.className = "delete-cell";
			deleteTD.innerHTML = `
				<a class="delete-button" data-action="deleteEstimation">
					<i class="fas fa-times" data-table="${index}" data-idx="${i}"></i>
				</a>
			`;

			row.append(labelCell, valueCell, deleteTD);
			estimatesTable.append(row);
		});
		const lastRow = document.createElement("tr");
		const labelCell = document.createElement("td");
		labelCell.dataset.action = "addCell";
		lastRow.innerHTML = `
			<td colspan="3" class="add-cell">
				<a data-action="addEstimation">
					<i class="fas fa-plus" data-idx="${index}"></i>
					${game.i18n.localize("healthEstimate.core.estimationSettings.AddEstimate")}
				</a>
			</td>
		`;
		estimatesTable.append(lastRow);

		div.append(estimatesTable, ...["name", "rule", "ignoreColor"].map(createInput));
		if (index !== 0) {
			const isLast = index === this.estimations.length - 1;
			div.append(this.createEstimationButtons(index, isLast));
		}
		return div;
	}

	createEstimationButtons(idx, isLast) {
		const container = document.createElement("div");
		container.classList.add("flexrow", "estimation-buttons");

		// Left button
		const leftBtn = document.createElement("button");
		leftBtn.type = "button";
		if (idx === 1) {
			leftBtn.disabled = true;
		} else {
			leftBtn.dataset.tooltip = game.i18n.localize("healthEstimate.core.estimationSettings.prioIncrease");
			leftBtn.dataset.action = "changePrio";
			leftBtn.dataset.prio = "increase";
			leftBtn.dataset.idx = idx;
		}
		const leftIcon = document.createElement("i");
		leftIcon.classList.add("far", "fa-chevron-up");
		leftBtn.appendChild(leftIcon);
		container.appendChild(leftBtn);

		// Delete button
		const deleteBtn = document.createElement("button");
		deleteBtn.type = "button";
		deleteBtn.dataset.action = "deleteTable";
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
			rightBtn.dataset.action = "changePrio";
			rightBtn.dataset.prio = "reduce";
			rightBtn.dataset.idx = idx;
		}
		const rightIcon = document.createElement("i");
		rightIcon.classList.add("far", "fa-chevron-down");
		rightBtn.appendChild(rightIcon);
		container.appendChild(rightBtn);

		return container;
	}

	_onRender(context, options) {
		const anchor = document.createElement("a");
		anchor.dataset.action = "addTable";
		anchor.dataset.tab = "";

		const icon = document.createElement("i");
		icon.className = "far fa-plus";

		const label = document.createElement("span");
		label.append(icon);
		label.innerText = game.i18n.localize("healthEstimate.core.estimationSettings.addTable");

		anchor.append(label);

		this.element.querySelector(".sheet-tabs").append(anchor);

		// Handle all changes for estimations
		for (const element of this.element.querySelectorAll(".estimation-types input")) {
			element.addEventListener("change", async (event) => {
				event.preventDefault();
				// eslint-disable-next-line no-unused-vars
				const [table, _, estimateIndex, rule] = event.target?.name.split(".") ?? [];
				this.estimations[table].estimates[estimateIndex][rule] = event.target?.value;
			});
		}
	}

	static #onSubmit(event, form, formData) {
		const data = foundry.utils.expandObject(formData.object);
		const estimations = [];
		for (const key in data) {
			const { name, rule, ignoreColor, estimates } = data[key];
			const sortedEstimates = Object.keys(estimates)
				.sort((a, b) => estimates[a].value - estimates[b].value)
				.map((innerKey) => estimates[innerKey]);
			estimations.push({ name, rule, ignoreColor, estimates: sortedEstimates });
		}
		sSet("core.estimations", estimations);
	}

	static addTable(event) {
		event.preventDefault();
		this.tabGroups.main = String(this.estimations.length);
		this.estimations.push({
			name: game.i18n.localize("healthEstimate.core.estimationSettings.newTable"),
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
	}

	static deleteTable(event) {
		const { idx } = event.target.dataset ?? {};
		this.estimations.splice(Number(idx), 1);
		this.tabGroups.main = String(Number(idx) - 1);
		this.render();
	}

	static changePrio(event) {
		const prio = event.target?.dataset.prio === "increase" ? -1 : 1;
		const idx = Number(event.target?.dataset.idx);

		const arraymove = (arr, fromIndex, toIndex) => {
			const element = arr[fromIndex];
			arr.splice(fromIndex, 1);
			arr.splice(toIndex, 0, element);
		};

		arraymove(this.estimations, idx, idx + prio);
		this.tabGroups.main = String(Number(idx) - 1);
		this.render();
	}

	static addEstimation(event) {
		// Fix for clicking either the A or I tag
		const idx = Number(event.target?.dataset.idx ?? event.target?.children[0]?.dataset.idx);
		this.estimations[idx].estimates.push({ label: "Custom", value: 100 });
		this.render();
	}

	static deleteEstimation(event) {
		const { table, idx } = event.target?.dataset ?? {};
		if (idx) this.estimations[table].estimates.splice(Number(idx), 1);
		this.render();
	}

	static async reset(event, form, formData) {
		this.estimations = foundry.utils.deepClone(game.settings.settings.get("healthEstimate.core.estimations").default);
		this.tabGroups.main = "0";
		this.render();
	}
}
