/** @odoo-module **/

import { Component, onMounted, useRef } from "@odoo/owl";


import { jsonrpc } from "@web/core/network/rpc_service";
import { _t } from "@web/core/l10n/translation";

	export function getGridData(form, gird, isNew) {
		const point_values = gird.data.map(item => ({
			id: item.id,
			x: item.x_value === "" ? 0 : item.x_value,
			y: item.y_value === "" ? 0 : item.y_value,
			z: item.z_value === "" ? 0 : item.z_value,
			straight_length: item.straight_length,
			bending_start_point: item.bending_start_point,
			bending_angle: item.bending_angle,
			rotation_angle: item.rotation_angle,
			number: isNew ? item.number ?? 0 : item.number ?? "",
		}));


		const getValue = (key) => form.getItem(key).getValue();
		const material_type = getValue(isNew ? "selMaterialTypeNew" : "selMaterialType");
		const bending_setting_id = getValue(isNew ? "selDiaNew" : "selDiaOriginal");
		const diaSelected = form.getItem(isNew ? "selDiaNew" : "selDiaOriginal").getOptions().find(option => option.value === bending_setting_id);
		const dia = diaSelected.dia
		const dia_content = diaSelected.content
		const bending = getValue(isNew ? "txtBendingNew" : "txtBending");
		const pipe_cutting_length = getValue(isNew ? "txtPipeCuttingLengthNew" : "txtPipeCuttingLength");
		const bending_radius = getValue(isNew ? "txtBendingRadiusNew" : "txtBendingRadius");
		const front_flange = parseFloat(getValue(isNew ? "inpFrontFlangeNew" : "inpFrontFlange"));
		const back_flange = parseFloat(getValue(isNew ? "inpBackFlangeNew" : "inpBackFlange"));
		const front_cutting = parseFloat(getValue(isNew ? "inpFrontCuttingNew" : "inpFrontCutting"));
		const back_cutting = parseFloat(getValue(isNew ? "inpBackCuttingNew" : "inpBackCutting"));
		const elongation_rate = parseFloat(getValue(isNew ? "txtElongationRateNew" : "txtElongationRate"));
		const clamp_length = parseFloat(getValue(isNew ? "txtClampLengthNew" : "txtClampLength"));
		const front = getValue(isNew ? "ckFrontNew" : "ckFront");
		const back = getValue(isNew ? "ckBackNew" : "ckBack");

		let bendingRadius = Number(bending_radius);
		let rollBending = !isNaN(bendingRadius) && bendingRadius >= 2000;
		let bending_data_str = "";
		if (rollBending) {
			bending_data_str = getValue(isNew ? "textBendingDataNew" : "textBendingData");
			const matches = bending_data_str.match(/\((\d+(\.\d+)?)\)/g);
			const results = matches ? matches.map(match => parseFloat(match.replace(/[()]/g, ''))) : [];
			results.forEach((result, i) => {
				if (point_values[i]) point_values[i].number = result;
			});
		}

		return {
			material_type, dia, bending, pipe_cutting_length, bending_radius, dia_content, bending_setting_id,
			front_flange, back_flange, front_cutting, back_cutting, elongation_rate,
			clamp_length, front, back, bending_data_str, point_values
		};
	}

	export function createPointGrid(data) {
		const gridConfig = {
			css: "grid_original",
			columns: [
				{
					id: "index", header: [{text: "No", align: "center"}], width: 40, align: "center", editable: false,
					mark: function (cell, data, row, column) {
						return "first_cell"
					}
				},
				{
					id: "x_value", header: [{text: "x", align: "center", css: "original_value_header"}], width: 50, type: "number", editable: true,
					mark: function (cell, data, row, column) {
						// return cell > 0 ? "original_value_cell" : ""
						return "original_value_cell"
					}
				},
				{
					id: "y_value", header: [{text: "y", align: "center", css: "original_value_header"}], width: 50, type: "number", editable: true,
					mark: function (cell, data, row, column) {
						return "original_value_cell"
					}
				},
				{
					id: "z_value", header: [{text: "z", align: "center", css: "original_value_header"}], width: 50, type: "number", editable: true,
					mark: function (cell, data, row, column) {
						return "original_value_cell"
					}
				},
				{
					id: "straight_length", header: [{text: "CNC", align: "center", css: "auto_value_header"}],
					align: "center", editable: false,
					mark: function (cell, data, row, column) {
						return "auto_value_cell"
					}
				},
				{
					id: "bending_start_point", header: [{text: "Bending Start Point", align: "center", css: "auto_value_header"}],
					align: "center", editable: false,
					mark: function (cell, data, row, column) {
						return "auto_value_cell"
					}
				},
				{
					id: "bending_angle", header: [{text: "Bending Angle", align: "center", css: "auto_value_header"}],
					align: "center", editable: false,
					mark: function (cell, data, row, column) {
						return "auto_value_cell"
					}
				},
				{
					id: "rotation_angle", header: [{text: "Rotation Angle", align: "center", css: "auto_value_header"}],
					align: "center", editable: false,
					mark: function (cell, data, row, column) {
						return "auto_value_cell"
					}
				},
				{id: "number", header: [{text: "", align: "center"}], editable: false, hidden: true},
			],
			data: data,
			autoWidth: true,
			// autoHeight: true,
			headerAutoHeight: true,
			// headerRowHeight: 25,
			sortable: false,
			rowHeight: 25,
			selection: "cell",
			editable: true,
			keyNavigation: true,
			tooltip: false,
		}
		const grid = new dhx.Grid(null, gridConfig);

		grid.events.on("cellClick", function (row, column) {
			if (column.editable) {
				dhx.awaitRedraw().then(function () {
					grid.edit(row.id, column.id);
				})
			}
		});

		return grid
	}

	export function updateDataAfterCalculate(bendingData, updateInfo) {
		let values = [bendingData.pipeLength, bendingData.frontCutting, bendingData.bendingStep]

		const formItems = updateInfo.formItems
		const form = updateInfo.form
		const grid = updateInfo.grid

		const updateValues = formItems.reduce((acc, key, index) => {
			acc[key] = values[index];
			return acc;
		}, {});

		for (const [item, value] of Object.entries(updateValues)) {
			form.getItem(item).setValue(value);
		}

		const pointDatas = bendingData.points
		pointDatas.forEach(p => {
			grid.data.update(p.point_id, {
				straight_length: p.straight_length,
				bending_start_point: p.bending_start_point,
				bending_angle: p.bending_angle,
				rotation_angle: p.rotation_angle,
				number: p.number,
			});
		});
	}

	export function clearGrid(txt, grid) {
		txt.setValue("")
		grid.data.forEach(function (item, index, array) {
			grid.data.update(item.id,
				{
					x_value: "",
					y_value: "",
					z_value: "",
					straight_length: "",
					bending_start_point: "",
					bending_angle: "",
					rotation_angle: "",
				});
		});
	}

	export function renderBendingDataInfo() {
		let newRows = []
		let originalRows = []

		const col1_label_width = 90
		const col1_width = "34%"
		const col2_label_width = 90
		const col2_width = "34%"
		const col3_label_width = 90
		const col3_width = "32%"

		const selMaterialType = {
			type: "select",
			label: _t("Material Type"),
			labelPosition: "left",
			labelWidth: col1_label_width,
			width: col1_width,
			options: [{value: "", content: "",}]
		}
		const selDiaData = {
			type: "select",
			label: _t("Dia"),
			labelPosition: "left",
			labelWidth: col2_label_width,
			width: col2_width,
			options: [{value: "", content: "",}]
		}
		const txtBendingRadius = {
			type: "text",
			label: _t("Bending Radius"),
			labelPosition: "left",
			css: "last_cell",
			labelWidth: col3_label_width,
			width: col3_width,
			options: [{value: "", content: "",}]
		}
		newRows.push({
			css: "origin_info",
			cols: [
				{
					...selMaterialType,
					name: "selMaterialTypeNew"
				},
				{
					...selDiaData,
					name: "selDiaNew"
				},
				{
					...txtBendingRadius,
					name: "txtBendingRadiusNew"
				},
			]
		})
		originalRows.push({
			css: "origin_info",
			cols: [
				{
					...selMaterialType,
					name: "selMaterialType"
				},
				{
					...selDiaData,
					name: "selDiaOriginal",
				},
				{
					...txtBendingRadius,
					name: "txtBendingRadius",
				},
			]
		})

		const inpFrontFlange = {
			type: "input",
			label: _t("Front Flange (-)"),
			labelPosition: "left",
			labelWidth: col1_label_width,
			width: col1_width,
		}
		const inpBackFlange = {
			type: "input",
			name: "inpBackFlange",
			label: _t("Back Flange (-)"),
			labelPosition: "left",
			labelWidth: col2_label_width,
			width: col2_width,
		}
		const txtElongationRate = {
			type: "text",
			labelPosition: "left",
			css: "last_cell",
			label: _t("Elongation Rate"),
			value: "",
			labelWidth: col3_label_width,
			width: col3_width,
		}
		newRows.push({
			css: "origin_info",
			cols: [
				{
					...inpFrontFlange,
					name: "inpFrontFlangeNew",
				},
				{
					...inpBackFlange,
					name: "inpBackFlangeNew",
				},
				{
					...txtElongationRate,
					name: "txtElongationRateNew"
				},
			]
		})
		originalRows.push({
			css: "origin_info",
			cols: [
				{
					...inpFrontFlange,
					name: "inpFrontFlange",
				},
				{
					...inpBackFlange,
					name: "inpBackFlange",
				},
				{
					...txtElongationRate,
					name: "txtElongationRate",
				},
			]
		})

		const inpFrontCutting = {
			type: "input",
			label: _t("Front Cutting (+)"),
			labelPosition: "left",
			labelWidth: col1_label_width,
			width: col1_width,
		}
		const inpBackCutting = {
			type: "input",
			label: _t("Back Cutting (+)"),
			labelPosition: "left",
			labelWidth: col2_label_width,
			width: col2_width,
		}
		const txtClass = {
			type: "text",
			labelPosition: "left",
			css: "last_cell",
			label: _t("Class"),
			labelWidth: col3_label_width,
			width: col3_width,
		}
		newRows.push({
			css: "origin_info",
			cols: [
				{
					...inpFrontCutting,
					name: "inpFrontCuttingNew"
				},
				{
					...inpBackCutting,
					name: "inpBackCuttingNew"
				},
				{
					...txtClass,
					name: "txtClassNew",
				},
			]
		})
		originalRows.push({
			css: "origin_info",
			cols: [
				{
					...inpFrontCutting,
					name: "inpFrontCutting",
				},
				{
					...inpBackCutting,
					name: "inpBackCutting",
				},
				{
					...txtClass,
					name: "txtClass",
				},
			]
		})

		const txtBending = {
			type: "text",
			labelPosition: "left",
			label: _t("Bending"),
			value: "",
			labelWidth: col1_label_width,
			width: col1_width,
		}
		const txtClampLength = {
			type: "text",
			labelPosition: "left",
			label: _t("CLAMP Length"),
			value: "",
			labelWidth: col2_label_width,
			width: col2_width,
		}
		const txtPipeCuttingLength = {
			type: "text",
			labelPosition: "left",
			css: "last_cell",
			label: _t("Cutting Length"),
			value: "",
			labelWidth: col3_label_width,
			width: col3_width,
		}
		newRows.push({
			css: "origin_info",
			cols: [
				{
					...txtBending,
					name: "txtBendingNew",
				},
				{
					...txtClampLength,
					name: "txtClampLengthNew",
				},
				{
					...txtPipeCuttingLength,
					name: "txtPipeCuttingLengthNew",
				},
			]
		})
		originalRows.push({
			css: "origin_info",
			cols: [
				{
					...txtBending,
					name: "txtBending",
				},
				{
					...txtClampLength,
					name: "txtClampLength",
				},
				{
					...txtPipeCuttingLength,
					name: "txtPipeCuttingLength",
				},
			]
		})

		const txtPipeType = {
			type: "text",
			labelPosition: "left",
			label: _t("Pipe Type"),
			labelWidth: col1_label_width,
			width: col1_width,
		}
		const txtThickness = {
			type: "text",
			labelPosition: "left",
			label: _t("Thickness"),
			labelWidth: col2_label_width,
			width: col2_width,
		}
		const ckFront = {
			css: "dhx_checkbox_el",
			type: "checkbox",
			id: "ckFront",
			text: _t("Front"),
			label: "",
			labelPosition: "left",
			width: "16%"
		}
		const ckBack = {
			css: "dhx_checkbox_el last_cell",
			type: "checkbox",
			id: "ckBack",
			text: _t("Back"),
			label: "",
			labelPosition: "left",
			width: "16%"
		}
		newRows.push({
			css: "origin_info",
			cols: [
				{
					...txtPipeType,
					name: "txtPipeTypeNew",
				},
				{
					...txtThickness,
					name: "txtThicknessNew",
				},
				{
					...ckFront,
					name: "ckFrontNew",
				},
				{
					...ckBack,
					name: "ckBackNew",
				}
			]
		})
		originalRows.push({
			css: "origin_info",
			cols: [
				{
					...txtPipeType,
					name: "txtPipeType",
				},
				{
					...txtThickness,
					name: "txtThickness",
				},
				{
					...ckFront,
					name: "ckFront",
				},
				{
					...ckBack,
					name: "ckBack",
				}
			]
		})

		return {
			newData: {
				css: "form_right_row bending_data_row",
				rows: newRows
			},
			originalData: {
				css: "form_right_row bending_data_row",
				rows: originalRows
			}

		}
	}

