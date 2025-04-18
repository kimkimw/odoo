/** @odoo-module **/
import {registry} from "@web/core/registry";
import {useService} from "@web/core/utils/hooks";
import {_t} from "@web/core/l10n/translation";

import { Component, onWillStart, onMounted, useState } from "@odoo/owl";
const actionRegistry = registry.category("actions");

import  {
	createPointGrid, getGridData, updateDataAfterCalculate, clearGrid, renderBendingDataInfo
} from './bending_functions';

export class BendingCalculationComponent extends Component {
	setup() {
		super.setup(...arguments);
		this.action = useService("action");
		this.orm = useService("orm");
		this.notification = useService("notification");

		const {context} = this.props.action;

		this.model = context.model;
		this.bendingData = null;

		this.layout = null
		this.formNew = null
		this.formOriginal = null
		this.gridNew = null
		this.gridOriginal = null

		this.isChanging = false;

		onWillStart(async () => {
			await this.loadData()
		})

		onMounted(async () => {
			this.renderLayout()

			this.updateData()
		});
	}

	async loadData() {
		const self = this;
		this.bendingData = await this.rpc.query({
			model: self.model,
			method: 'get_bending_data_info',
			args: [0],
		});
	}

	async reload() {
		await this.loadData()

		this.updateData()
	}

	renderLayout() {
		this.layout = new dhx.Layout("bending_data_layout", {
			type: "none",
			rows: [
				{
					id: "form_header",
				},
				{
					type: "space",
					height: "85vh",
					cols: [
						{
							id: "form_new"
						},
						{
							id: "form_original"
						},
					]
				},
			]
		});

		this.renderFormHeader()
		this.renderFormNew()
		this.renderFormOriginal()
	}

	renderFormOriginal() {
		const self = this

		self.formOriginal = new dhx.Form(null, {
			css: "dhx_form_right",
			rows: [
				self.renderCommonInfo(),
				// Bending Data Header
				{
					css: "form_line_row",
					align: "between",
					cols: [
						{
							type: "text",
							name: "txtOriginal",
							label: "",
							hiddenLabel: true,
							value: _t("Original Bending Data")
						},
						{
							type: "select",
							name: "selDia",
							label: _t("Main/Branch Pipe"),
							labelPosition: "left",
							options: [{value: "", content: "",}]
						},
						{
							cols: [
								{
									type: "button",
									name: "btnCalculate",
									text: _t("Calculate"),
									size: "small",
									view: "flat"
								},
								{
									type: "button",
									name: "btnSaveOriginal",
									text: _t("Save Change"),
									size: "small",
									view: "flat",
									disabled: false,
									hidden: false
								},
								{
									type: "button",
									name: "btnDeleteOriginal",
									text: _t("Delete"),
									size: "small",
									view: "flat"
								},
							]
						}
					]
				},
				// Bending Data Original Info
				renderBendingDataInfo().originalData,
				// Bending Data Original Clear
				{
					css: "form_line_row",
					align: "between",
					cols: [
						{
							css: "reset_checkbox",
							cols: [
								{
									type: "checkbox",
									name: "ckWhiteRemark",
									id: "ckWhiteRemark",
									text: _t("White Remark"),
									label: "",
									labelPosition: "left",
									hidden: true
								},
								{
									type: "checkbox",
									name: "ckLeftBending",
									id: "ckLeftBending",
									text: _t("Left Bending"),
									label: "",
									labelPosition: "left",
									hidden: true
								},
								{
									type: "checkbox",
									name: "ckRollBending",
									id: "ckRollBending",
									text: _t("Roll Bending"),
									label: "",
									labelPosition: "left"
								},
								{
									type: "checkbox",
									name: "ckApplyLength",
									id: "ckApplyLength",
									text: _t("Apply Intermediate Length"),
									label: "",
									labelPosition: "left",
									checked: true
								},
							]
						},
						{
							type: "button",
							name: "btnClearOriginal",
							text: _t("Clear"),
							size: "small",
							view: "flat"
						},
					]
				},
				// Bending Data Original Grid
				{
					css: "form_line_row",
					type: "container",
					name: "gridOriginal",
					height: 170
				},
				{
					type: "textarea",
					name: "textBendingData",
					label: "1",
					labelWidth: "70px",
					hiddenLabel: true,
					value: "",
					height: 170,
					width: "100%",
					hidden: true
				},
			]
		})

		self.gridOriginal = createPointGrid(this.gridOriginalData)
		self.formOriginal.getItem("gridOriginal").attach(self.gridOriginal);

		self.setFromOriginalEvents()

		this.layout.getCell("form_original").attach(self.formOriginal);
	}

	renderFormHeader() {
		const self = this;
		const formHeader = new dhx.Form(null, {
			css: "dhx_form_right",
			rows: [
				{
					align: "between",
					css: "title_row",
					cols: [
						{
							type: "text",
							name: "txtTitle",
							label: "",
							hiddenLabel: true,
							value: _t("Bending Data")
						},
						{
							type: "button",
							name: "btnBendingSetting",
							text: _t("Bending Setting"),
							size: "small",
							view: "flat"
						},
					]
				}
			]
		})

		// formHeader.getItem("btnBendingSetting").events.on("click", async function () {
		// 	const actionId = 'autonsi_standard_seyoung.autonsi_standard_common_bending_action';
		// 	self.action.doAction(actionId);
		// });
		// this.layout.getCell("form_header").attach(formHeader);
	}

	renderFormNew() {
		const self = this

		self.formNew = new dhx.Form(null, {
			css: "dhx_form_right",
			rows: [
				// Bending Data New Header
				{
					css: "form_line_row",
					align: "between",
					cols: [
						{
							type: "text",
							name: "txtNewData",
							label: "",
							hiddenLabel: true,
							value: _t("New Bending Data Setting")
						},
						{
							cols: [
								{
									type: "button",
									name: "btnCalculateNew",
									text: _t("Calculate"),
									size: "small",
									view: "flat"
								},
								{
									type: "button",
									name: "btnSaveNew",
									text: _t("Save"),
									size: "small",
									view: "flat"
								},
							]
						},
					]
				},
				// Bending Data New Info
				renderBendingDataInfo().newData,
				// Bending Data New Clear
				{
					css: "form_line_row",
					align: "between",
					cols: [
						{
							css: "reset_checkbox",
							cols: [
								{
									type: "checkbox",
									name: "ckWhiteRemarkNew",
									id: "ckWhiteRemarkNew",
									text: _t("White Remark"),
									label: "",
									labelPosition: "left",
									hidden: true
								},
								{
									type: "checkbox",
									name: "ckLeftBendingNew",
									id: "ckLeftBendingNew",
									text: _t("Left Bending"),
									label: "",
									labelPosition: "left",
									hidden: true
								},
								{
									type: "checkbox",
									name: "ckRollBendingNew",
									id: "ckRollBendingNew",
									text: _t("Roll Bending"),
									label: "",
									labelPosition: "left"
								},
								{
									type: "checkbox",
									name: "ckApplyLengthNew",
									id: "ckApplyLengthNew",
									text: _t("Apply Intermediate Length"),
									label: "",
									labelPosition: "left",
									checked: true
								},
							]
						},
						{
							type: "button",
							name: "btnClearNew",
							text: _t("Clear"),
							size: "small",
							view: "flat",
							// icon: "dxi dxi-eraser"
						},
					]
				},
				// Bending Data New Grid
				{
					type: "container",
					name: "gridNew",
					height: 170
				},
				{
					type: "textarea",
					name: "textBendingDataNew",
					label: "1",
					labelWidth: "70px",
					hiddenLabel: true,
					value: "",
					height: 170,
					width: "100%",
					hidden: true
				},
			]
		})

		self.gridNew = createPointGrid(this.gridNewData)
		self.formNew.getItem("gridNew").attach(self.gridNew);

		self.setFormNewEvents()

		this.layout.getCell("form_new").attach(self.formNew);
	}

	setFromOriginalEvents() {
		const self = this;

		self.formOriginal.getItem("selDia").events.on("change", function (value) {
			self.updateOriginalData(value)
			self.formOriginal.getItem("gridOriginal").show()
			self.formOriginal.getItem("textBendingData").hide()
		});

		self.formOriginal.getItem("selMaterialType").events.on("change", function (value) {
			const diaList = self.bendingData.dia_list[value] ?? [{'content': "", 'value': ""}]
			self.formOriginal.getItem("selDiaOriginal").setOptions(diaList)
		});

		self.formOriginal.getItem("selDiaOriginal").events.on("change", function (value) {
			const bendingSetting = self.bendingData.bending_setting_list.find(item => item.id === value);

			let clamp_length = bendingSetting?.clamp_length ?? "";
			let elongation = bendingSetting?.elongation ?? "";
			let dia = bendingSetting?.dia ?? "";
			let former_radius = bendingSetting?.former_radius ?? "";

			self.formOriginal.getItem("txtClampLength").setValue(clamp_length)
			self.formOriginal.getItem("txtElongationRate").setValue(elongation)
			self.formOriginal.getItem("txtBendingRadius").setValue(former_radius)

			self.formOriginal.getItem("ckApplyLength").setValue(true)
			let rollBending = former_radius ?? 0 >= 2000;
			self.formOriginal.getItem("ckApplyLength")[rollBending ? 'enable' : 'disable']()
			self.formOriginal.getItem("ckRollBending")[rollBending ? 'enable' : 'disable']()
		});

		self.formOriginal.getItem("ckApplyLength").events.on("change", function (value) {
			self.handleCheckboxChange(self.formOriginal, "ckRollBending", "gridOriginal", "textBendingData", value, true);
		});

		self.formOriginal.getItem("ckRollBending").events.on("change", async function (value) {
			self.handleCheckboxChange(self.formOriginal, "ckApplyLength", "gridOriginal", "textBendingData", value, false);
			if (value) {
				await self.getBendingDataStr(self.getOriginalData(), self.formOriginal.getItem("textBendingData"))
			}
		});

		self.formOriginal.getItem("btnSaveOriginal").events.on("click", async function (events) {
			await self.saveBranch()
		});

		self.formOriginal.getItem("btnDeleteOriginal").events.on("click", async function (events) {
			self.deleteBranch()
		});

		self.formOriginal.getItem("btnCalculate").events.on("click", async function (events) {
			const updateInfo = {
				"formItems": ["txtPipeCuttingLength", "inpFrontCutting", "txtBending"],
				"form": self.formOriginal,
				"grid": self.gridOriginal
			}
			await self.calculateBendingData(self.getOriginalData(), updateInfo)
		});

		self.formOriginal.getItem("btnClearOriginal").events.on("click", function (events) {
			clearGrid(self.formOriginal.getItem("txtPipeCuttingLength"), self.gridOriginal);
		});
	}

	setFormNewEvents() {
		const self = this;

		self.formNew.getItem("selMaterialTypeNew").events.on("change", function (value) {
			const diaList = self.bendingData.dia_list[value] ?? [{'content': "", 'value': ""}]
			self.formNew.getItem("selDiaNew").setOptions(diaList)
		});

		self.formNew.getItem("selDiaNew").events.on("change", function (value) {
			const bendingSetting = self.bendingData.bending_setting_list.find(item => item.id === value);

			let clamp_length = bendingSetting?.clamp_length ?? "";
			let elongation = bendingSetting?.elongation ?? "";
			let former_radius = bendingSetting?.former_radius ?? "";

			self.formNew.getItem("txtClampLengthNew").setValue(clamp_length)
			self.formNew.getItem("txtElongationRateNew").setValue(elongation)
			self.formNew.getItem("txtBendingRadiusNew").setValue(former_radius)

			self.formNew.getItem("ckApplyLengthNew").setValue(true)
			let rollBending = former_radius ?? 0 >= 2000;
			self.formNew.getItem("ckApplyLengthNew")[rollBending ? 'enable' : 'disable']()
			self.formNew.getItem("ckRollBendingNew")[rollBending ? 'enable' : 'disable']()
		});


		self.formNew.getItem("ckApplyLengthNew").events.on("change", function (value) {
			self.handleCheckboxChange(self.formNew, "ckRollBendingNew", "gridNew", "textBendingDataNew", value, true);
		});

		self.formNew.getItem("ckRollBendingNew").events.on("change", async function (value) {
			self.handleCheckboxChange(self.formNew, "ckApplyLengthNew", "gridNew", "textBendingDataNew", value, false);
			if (value) {
				await self.getBendingDataStr(self.getNewData(), self.formNew.getItem("textBendingDataNew"))
			}
		});

		self.formNew.getItem("btnCalculateNew").events.on("click", async function (events) {
			const updateInfo = {
				"formItems": ["txtPipeCuttingLengthNew", "inpFrontCuttingNew", "txtBendingNew"],
				"form": self.formNew,
				"grid": self.gridNew
			}
			await self.calculateBendingData(self.getNewData(), updateInfo)
		});

		self.formNew.getItem("btnSaveNew").events.on("click", async function () {
			await self.saveNewData()
		});

		self.formNew.getItem("btnClearNew").events.on("click", function (events) {
			clearGrid(self.formNew.getItem("txtPipeCuttingLengthNew"), self.gridNew);
		});
	}

	renderCommonInfo() {
		let rows = []

		// Common Info
		const infoCol = {
			type: "input",
			labelPosition: "left",
			labelWidth: 90,
			width: "50%"
		}

		const txtCustomer = {
			...infoCol,
			name: "txtCustomer",
			label: _t("Customer"),
		}
		const txtCreateOn = {
			...infoCol,
			css: "last_cell",
			name: "txtCreateOn",
			label: _t("Create On"),
		}
		rows.push({
			css: "origin_info",
			cols: [
				txtCustomer,
				txtCreateOn
			]
		})

		const txtShipNo = {
			...infoCol,
			name: "txtShipNo",
			label: _t("Ship No")
		}
		const txtCreateBy = {
			...infoCol,
			css: "last_cell",
			name: "txtCreateBy",
			label: _t("Create By")
		}
		rows.push({
			css: "origin_info",
			cols: [
				txtShipNo,
				txtCreateBy
			]
		})

		const txtPorNo = {
			...infoCol,
			name: "txtPorNo",
			label: _t("POR"),
		}
		const txtPieceNo = {
			...infoCol,
			css: "last_cell",
			name: "txtPieceNo",
			label: _t("Piece #")
		}

		rows.push({
			css: "origin_info",
			cols: [
				txtPorNo,
				txtPieceNo
			]
		})

		return {
			css: "form_info",
			rows: rows
		}
	}


	getNewData() {
		return getGridData(this.formNew, this.gridNew, true)
	}

	getOriginalData() {
		return getGridData(this.formOriginal, this.gridOriginal, false)
	}

	async getBendingDataStr(data, textItem) {
		const self = this;
		this.rpc.query({
			route: '/bending/get_bending_data_str',
			params: {data: data},
		}).then(async function (response) {
			textItem.setValue(response.result)
		}).catch(function (reason) {
			self.showWarningMessage(reason?.message?.data?.message)
		});
	}

	showWarningMessage(message) {
		this.notification.add(_t(message ?? ""), {
			title: _t("Warning"),
			type: 'warning'
		});
	}

	async reloadAfterSave(branchId) {
		await this.loadData()
		this.updateBranchOptions()
		this.updateNewData()
		this.formOriginal.getItem("selDia").setValue(branchId)
	}

	async saveNewData() {
		const self = this;

		try {
			const data = self.getNewData();
			const branchId = await this.rpc.query({
				model: self.model,
				method: 'save_bending_data',
				args: ["", data],
			});

			await self.reloadAfterSave(branchId);
		} catch (error) {
			console.log(error);
			self.showWarningMessage(error?.message?.data?.message || 'An error occurred');
		}
	}


	async saveBranch() {
		const self = this;
		if (!self.branchId) return;
		try {
			const data = self.getOriginalData();
			const savedBranchId = await this.rpc.query({
				model: self.model,
				method: 'save_bending_branch',
				args: [self.branchId, data],
			});
			await self.reloadAfterSave(savedBranchId);
			self.updateOriginalData(savedBranchId)
		} catch (error) {
			console.log(error);
			self.showWarningMessage(error?.message?.data?.message || 'An error occurred');
		}
	}

	deleteBranch() {
		const self = this;
		if (!self.branchId) return;
		this.rpc.query({
			model: self.model,
			method: 'delete_bending_branch',
			args: [self.branchId],
		}).then(async function () {
			await self.reload()
		}).catch(function (error) {
			console.log(error)
			self.showWarningMessage(error?.message?.data?.message)
		});

	}

	async calculateBendingData(data, updateInfo) {
		const self = this;
		this.rpc.query({
			route: '/bending/calculate_bending_data',
			params: {data: data},
		}).then(async function (response) {
			if (response.result) {
				updateDataAfterCalculate(response.result, updateInfo);
			} else {
				self.showWarningMessage(response.message)
			}
		}).catch(function (error) {
			console.log(error)
			self.showWarningMessage(error?.message?.data?.message)
		});
	}

	handleCheckboxChange(form, checkboxToToggle, gridItem, textItem, value, hideGrid) {
		if (this.isChanging) return;

		this.isChanging = true;

		form.getItem(checkboxToToggle).setValue(!value);
		let show = value ? 'show' : 'hide'
		let hide = value ? 'hide' : 'show'
		form.getItem(gridItem)[hideGrid ? show : hide]();
		form.getItem(textItem)[hideGrid ? hide : show]();

		this.isChanging = false;
	}

	updateNewData() {
		const self = this;

		const materialTypeList = this.bendingData.material_type_list
		const pipeType = this.bendingData.material_type_list[0]['value']
		self.formNew.getItem("selMaterialTypeNew").setOptions(materialTypeList)
		self.formNew.getItem("selMaterialTypeNew").setValue(pipeType)

		// Set default values
		const defaultFields = {
			"inpFrontFlangeNew": 0,
			"inpBackFlangeNew": 0,
			"inpFrontCuttingNew": 0,
			"inpBackCuttingNew": 0,
			"txtBendingNew": "",
			"txtPipeCuttingLengthNew": "",
			"ckFrontNew": false,
			"ckBackNew": false,
			"txtBendingRadiusNew": "",
			"txtElongationRateNew": "",
			"txtClampLengthNew": "",
			"textBendingDataNew": "",
			"ckApplyLengthNew": true,
			"ckRollBendingNew": false,
		};

		const diaList = this.bendingData.dia_list[pipeType]
		if (diaList) {
			self.formNew.getItem("selDiaNew").setOptions(diaList)
			const diaValue = diaList[0]['value']
			self.formNew.getItem("selDiaNew").setValue(diaValue)
			const bendingSetting = this.bendingData.bending_setting_list.find(item => item.id === diaValue);

			let clamp_length = bendingSetting?.clamp_length ?? "";
			let elongation = bendingSetting?.elongation ?? "";
			let former_radius = bendingSetting?.former_radius ?? 0;
			defaultFields["txtBendingRadiusNew"] = former_radius || "";
			defaultFields["txtElongationRateNew"] = elongation;
			defaultFields["txtClampLengthNew"] = clamp_length;

			let rollBending = former_radius >= 2000;
			self.formNew.getItem("ckApplyLengthNew")[rollBending ? 'enable' : 'disable']()
			self.formNew.getItem("ckRollBendingNew")[rollBending ? 'enable' : 'disable']()
		}

		for (const [item, value] of Object.entries(defaultFields)) {
			self.formNew.getItem(item).setValue(value);
		}

		self.gridNew.data.parse(this.bendingData.new_gird_data)
	}

	updateBranchOptions() {
		this.formOriginal.getItem("selDia").setOptions(this.bendingData.branch_list)
	}

	updateOriginalData(branchId) {
		console.log("updateOriginalData")
		const self = this;

		const originalData = self.bendingData.original_data.find(o => o.id === branchId)
		self.branchId = originalData.id

		const materialTypeList = self.bendingData.material_type_list
		self.formOriginal.getItem("selMaterialType").setOptions(materialTypeList)

		const materialType = originalData.material_type
		if (materialType) {
			self.formOriginal.getItem("selMaterialType").setValue(materialType)
			console.log(self.bendingData)
			console.log(materialType, self.bendingData.dia_list)
			const diaList = self.bendingData.dia_list[materialType]
			self.formOriginal.getItem("selDiaOriginal").setOptions(diaList)
			if (originalData.bending_setting_id)
				self.formOriginal.getItem("selDiaOriginal").setValue(originalData.bending_setting_id)
		}

		const canEdit = originalData.id > 0;
		const items = [
			"selMaterialType", "selDiaOriginal", "txtBendingRadius",
			"inpFrontFlange", "inpBackFlange", "inpFrontCutting", "inpBackCutting",
			"ckFront", "ckBack", "ckWhiteRemark", "ckLeftBending", "ckRollBending", "ckApplyLength",
			"btnSaveOriginal", "btnDeleteOriginal", "btnCalculate", "btnClearOriginal"
		]
		items.forEach(item => {
			self.formOriginal.getItem(item)[canEdit ? 'enable' : 'disable']()
			// if (item.startsWith("btn")) {
			// 	self.formOriginal.getItem(item)[canEdit ? 'show' : 'hide']()
			// }
		});

		const columns = ["x_value", "y_value", "z_value"]
		columns.forEach(col => self.gridOriginal.getColumn(col).editable = canEdit);

		const fields = {
			"txtBendingRadius": "bending_radius",
			"inpFrontFlange": "front_flange",
			"inpBackFlange": "back_flange",
			"txtElongationRate": "elongation_rate",
			"inpFrontCutting": "front_cutting",
			"inpBackCutting": "back_cutting",
			"txtBending": "bending",
			"txtClampLength": "clamp_length",
			"txtPipeCuttingLength": "pipe_cutting_length",
			"ckFront": "front",
			"ckBack": "back",
			"textBendingData": "bending_data_str",
		};

		for (const [item, dataKey] of Object.entries(fields)) {
			self.formOriginal.getItem(item).setValue(originalData[dataKey]);
		}

		let bendingRadius = Number(originalData["bending_radius"]);
		let rollBending = !isNaN(bendingRadius) && bendingRadius >= 2000;
		self.formOriginal.getItem("ckApplyLength")[rollBending ? 'enable' : 'disable']()
		self.formOriginal.getItem("ckRollBending")[rollBending ? 'enable' : 'disable']()

		self.gridOriginal.data.parse(originalData.points)
	}

	updateData() {
		this.updateBranchOptions()
		this.updateNewData()
	}
}

BendingCalculationComponent.template = "bending_calculation_template";
actionRegistry.add("bending_calculation_client_action", BendingCalculationComponent);

