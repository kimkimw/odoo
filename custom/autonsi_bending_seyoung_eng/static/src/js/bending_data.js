/** @odoo-module **/

import {Component, onMounted, mount, useState} from "@odoo/owl";
import {registry} from "@web/core/registry";
import {useService} from "@web/core/utils/hooks";
import {_t} from "@web/core/l10n/translation";
import {FormRenderer} from "@web/views/form/form_renderer";
import {FormView} from "@web/views/form/form_view";
import {patch} from "@web/core/utils/patch";

const actionRegistry = registry.category("actions");
import {
    createPointGrid,
    getGridData,
    updateDataAfterCalculate,
    clearGrid,
    renderBendingDataInfo,
} from './bending_functions';

export class BendingDataComponent extends Component {
    static template = "autonsi_bending_seyoung_eng.bending_data_template"
    setup() {
        const data = this.props.data;
        this.value = data.resId;
        this.model = data.model;
        this.context = data.context;
        this.bendingData = data.bendingData;

        this.layout = null;
        this.formRight = null;
        this.gridNew = null;
        this.gridOriginal = null;
        this.branchId = null;

        this.isChanging = false;

        console.log('222222222222222', this.layout)
        onMounted(() => {
            $(".close-bending").off().on("click", (e) => {
                e.preventDefault()
                $("li.o_back_button").trigger('click')
            })

            this.renderLayout()
            // this.renderRight()
        })
    }

    renderLayout() {
        console.log('đayayyyyyy')
        this.layout = new dhx.Layout("bending_data_layout", {
            type: "none",
            cols: [
                {
                    id: "iframe",
                    width: "70%",
                    resizable: true
                },
                {
                    id: "right",
                    height: "90vh"
                },
            ]
        });
    }


    // constructor(self, data) {
    //     super();
    //
    //     this.value = data.resId;
    //     this.model = data.model;
    //     this.context = data.context;
    //     this.bendingData = data.bendingData;
    //
    //     this.layout = null
    //     this.formRight = null
    //     this.gridNew = null
    //     this.gridOriginal = null
    //     this.branchId = null
    //
    //     this.isChanging = false;
    // }

    // mounted() {
    //     $(".close-bending").off().on("click", (e) => {
    //         e.preventDefault()
    //         $("li.o_back_button").trigger('click')
    //     })
    //
    //     this.renderLayout()
    //     this.renderRight()
    //
    //     this.updateData()
    // }

    // async loadData() {
    //     this.bendingData = await rpc({
    //         model: this.model,
    //         method: 'get_bending_data_info',
    //         args: [this.value],
    //         context: this.context
    //     })
    //     console.log(this.bendingData)
    // }
    //
    // async reload() {
    //     await this.loadData()
    //
    //     this.updateData()
    // }


    renderRight() {
        const self = this

        self.formRight = new dhx.Form(null, {
            css: "dhx_form_right",
            rows: [
                // Common Info
                // self.renderCommonInfo(),
                // Bending Data Header
                {
                    css: "form_right_row",
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
                            options: [{value: "", content: "",}],
                            hidden: true
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

                // renderBendingDataInfo().originalData,

                // Bending Data Original Clear
                {
                    css: "form_right_row",
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
                    css: "form_right_row",
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
                // Bending Data New Header
                {
                    css: "form_right_row",
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

                // renderBendingDataInfo().newData,

                // Bending Data New Clear
                {
                    css: "form_right_row",
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

        self.setFormRightEvent();
        self.renderGrid();

        this.layout.getCell("right").attach(self.formRight);
    }

    renderCommonInfo() {
        let rows = []
        // Common Info
        const infoCol = {
            type: "text",
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
        const txtUpdateOn = {
            ...infoCol,
            css: "last_cell",
            name: "txtUpdateOn",
            label: _t("Update On")
        }
        rows.push({
            css: "origin_info",
            cols: [
                txtPorNo,
                txtUpdateOn
            ]
        })

        const txtPieceNo = {
            ...infoCol,
            type: "text",
            name: "txtPieceNo",
            label: _t("Piece #")
        }
        const txtUpdateBy = {
            ...infoCol,
            css: "last_cell",
            name: "txtUpdateBy",
            label: _t("Update By")
        }
        rows.push({
            css: "origin_info",
            cols: [
                txtPieceNo,
                txtUpdateBy
            ]
        },)

        return {
            css: "form_right_row",
            rows: rows
        }
    }

    renderGrid() {
        const self = this;

        self.gridOriginal = createPointGrid(this.gridOriginalData)
        self.gridNew = createPointGrid(this.gridNewData)

        self.formRight.getItem("gridOriginal").attach(self.gridOriginal);
        self.formRight.getItem("gridNew").attach(self.gridNew);
    }

    setFormRightEvent() {
        const self = this;
        //
        // self.formRight.getItem("selDia").events.on("change", function (value) {
        //     self.updateOriginalData(value)
        //     self.formRight.getItem("gridOriginal").show()
        //     self.formRight.getItem("textBendingData").hide()
        // });
        //
        // self.formRight.getItem("selMaterialType").events.on("change", function (value) {
        //     const diaList = self.bendingData.dia_list[value] ?? [{'content': "", 'value': ""}]
        //     self.formRight.getItem("selDiaOriginal").setOptions(diaList)
        // });
        //
        // self.formRight.getItem("selDiaOriginal").events.on("change", function (value) {
        //     const material_type = self.formRight.getItem("selMaterialType").getValue()
        //     // const bendingSetting = self.bendingData.bending_setting_list.find(item => item.id === value);
        //     //
        //     // let clamp_length = bendingSetting?.clamp_length ?? "";
        //     // let elongation = bendingSetting?.elongation ?? "";
        //     // let dia = bendingSetting?.dia ?? "";
        //     // let former_radius = bendingSetting?.former_radius ?? "";
        //
        //     // self.formRight.getItem("txtClampLength").setValue(clamp_length)
        //     // self.formRight.getItem("txtElongationRate").setValue(elongation)
        //     // self.formRight.getItem("txtBendingRadius").setValue(former_radius)
        //
        //     self.formRight.getItem("ckApplyLength").setValue(true)
        //     // let rollBending = former_radius ?? 0 >= 2000;
        //     // self.formRight.getItem("ckApplyLength")[rollBending ? 'enable' : 'disable']()
        //     // self.formRight.getItem("ckRollBending")[rollBending ? 'enable' : 'disable']()
        // });
        //
        // self.formRight.getItem("ckApplyLength").events.on("change", function (value) {
        //     self.handleCheckboxChange("ckRollBending", "gridOriginal", "textBendingData", value, true);
        // });
        //
        // self.formRight.getItem("ckRollBending").events.on("change", async function (value) {
        //     self.handleCheckboxChange("ckApplyLength", "gridOriginal", "textBendingData", value, false);
        //     if (value) {
        //         await self.getBendingDataStr(self.getOriginalData(), self.formRight.getItem("textBendingData"))
        //     }
        // });
        //
        // self.formRight.getItem("btnSaveOriginal").events.on("click", async function (events) {
        //     await self.saveBranch()
        // });
        //
        // self.formRight.getItem("btnDeleteOriginal").events.on("click", async function (events) {
        //     self.deleteBranch()
        // });
        //
        // self.formRight.getItem("btnCalculate").events.on("click", async function (events) {
        //     const updateInfo = {
        //         "formItems": ["txtPipeCuttingLength", "inpFrontCutting", "txtBending"],
        //         "form": self.formRight,
        //         "grid": self.gridOriginal
        //     }
        //     // await self.calculateBendingData(self.getOriginalData(), updateInfo)
        // });
        //
        // self.formRight.getItem("btnClearOriginal").events.on("click", function (events) {
        //     clearGrid(self.formRight.getItem("txtPipeCuttingLength"), self.gridOriginal);
        // });
        //
        // self.formRight.getItem("selMaterialTypeNew").events.on("change", function (value) {
        //     const diaList = self.bendingData.dia_list[value] ?? [{'content': "", 'value': ""}]
        //     self.formRight.getItem("selDiaNew").setOptions(diaList)
        // });
        //
        // self.formRight.getItem("selDiaNew").events.on("change", function (value) {
        //     // const bendingSetting = self.bendingData.bending_setting_list.find(item => item.id === value);
        //     //
        //     // let clamp_length = bendingSetting?.clamp_length ?? "";
        //     // let elongation = bendingSetting?.elongation ?? "";
        //     // let former_radius = bendingSetting?.former_radius ?? "";
        //
        //     // self.formRight.getItem("txtClampLengthNew").setValue(clamp_length)
        //     // self.formRight.getItem("txtElongationRateNew").setValue(elongation)
        //     // self.formRight.getItem("txtBendingRadiusNew").setValue(former_radius)
        //
        //     self.formRight.getItem("ckApplyLengthNew").setValue(true)
        //     // let rollBending = former_radius ?? 0 >= 2000;
        //     // self.formRight.getItem("ckApplyLengthNew")[rollBending ? 'enable' : 'disable']()
        //     // self.formRight.getItem("ckRollBendingNew")[rollBending ? 'enable' : 'disable']()
        // });
        //
        // self.formRight.getItem("ckApplyLengthNew").events.on("change", function (value) {
        //     self.handleCheckboxChange("ckRollBendingNew", "gridNew", "textBendingDataNew", value, true);
        // });
        //
        // self.formRight.getItem("ckRollBendingNew").events.on("change", async function (value) {
        //     self.handleCheckboxChange("ckApplyLengthNew", "gridNew", "textBendingDataNew", value, false);
        //     if (value) {
        //         await self.getBendingDataStr(self.getNewData(), self.formRight.getItem("textBendingDataNew"))
        //     }
        // });
        //
        // self.formRight.getItem("btnCalculateNew").events.on("click", async function (events) {
        //     const updateInfo = {
        //         "formItems": ["txtPipeCuttingLengthNew", "inpFrontCuttingNew", "txtBendingNew"],
        //         "form": self.formRight,
        //         "grid": self.gridNew
        //     }
        //     // await self.calculateBendingData(self.getNewData(), updateInfo)
        // });
        //
        // self.formRight.getItem("btnSaveNew").events.on("click", async function () {
        //     await self.saveNewData()
        // });
        //
        // self.formRight.getItem("btnClearNew").events.on("click", function (events) {
        //     clearGrid(self.formRight.getItem("txtPipeCuttingLengthNew"), self.gridNew);
        // });
    }

    getNewData() {
        // return getGridData(this.formRight, this.gridNew, true)
    }

    getOriginalData() {
        // return getGridData(this.formRight, this.gridOriginal, false)
    }

    async getBendingDataStr(data, textItem) {
        // const self = this;
        // rpc({
        //     route: '/bending/get_bending_data_str',
        //     params: {data: data},
        // }).then(async function (response) {
        //     textItem.setValue(response.result)
        // }).catch(function (error) {
        //     console.log(error)
        //     self.showWarningMessage(error?.message?.data?.message)
        // });
    }

    async reloadAfterSave(branchId) {
        // await this.loadData()
        // this.updateBranchOptions()
        // this.updateCommonInfo()
        // this.updateNewData()
        // this.formRight.getItem("selDia").setValue(branchId)
    }

    async saveNewData() {
        // try {
        //     const data = this.getNewData();
        //     const branchId = await rpc({
        //         model: this.model,
        //         method: 'save_bending_data',
        //         args: [this.value, data],
        //         context: this.context
        //     });
        //
        //     await this.reloadAfterSave(branchId);
        // } catch (error) {
        //     console.log(error);
        //     this.showWarningMessage(error?.message?.data?.message);
        // }
    }

    async saveBranch() {
        // if (!this.branchId) return;
        // try {
        //     const originalData = this.getOriginalData();
        //     const savedBranchId = await rpc({
        //         model: 'bending.branch',
        //         method: 'save_bending_branch',
        //         args: [this.branchId, originalData],
        //     });
        //     await this.reloadAfterSave(savedBranchId);
        //     this.updateOriginalData(savedBranchId)
        // } catch (error) {
        //     console.error(error);
        //     this.showWarningMessage(error?.message?.data?.message || "An error occurred while saving.");
        // }
    }

    deleteBranch() {
        // const self = this;
        //
        // if (!self.branchId) return;
        // rpc({
        //     model: 'bending.branch',
        //     method: 'delete_bending_branch',
        //     args: [self.branchId],
        // }).then(async function () {
        //     await self.reload()
        // }).catch(function (error) {
        //     console.log(error)
        //     self.showWarningMessage(error?.message?.data?.message)
        // });
    }


    // async calculateBendingData(data, updateInfo) {
    //     const self = this;
    //
    //     rpc({
    //         route: '/bending/calculate_bending_data',
    //         params: {data: data},
    //     }).then(async function (response) {
    //         if (response.result) {
    //             updateDataAfterCalculate(response.result, updateInfo);
    //         } else {
    //             self.showWarningMessage(response.message)
    //         }
    //
    //     }).catch(function (error) {
    //         console.log(error)
    //         self.showWarningMessage(error.message)
    //     });
    // }

    showWarningMessage(message) {
        this.env.services.notification.notify({
            title: _t("Warning"),
            message: _t(message ?? ""),
            type: 'warning',
        });
    }

    handleCheckboxChange(checkboxToToggle, gridItem, textItem, value, hideGrid) {
        // if (this.isChanging) return;
        //
        // this.isChanging = true;
        //
        // this.formRight.getItem(checkboxToToggle).setValue(!value);
        // let show = value ? 'show' : 'hide'
        // let hide = value ? 'hide' : 'show'
        // this.formRight.getItem(gridItem)[hideGrid ? show : hide]();
        // this.formRight.getItem(textItem)[hideGrid ? hide : show]();
        //
        // this.isChanging = false;
    }

    updateNewData() {
        // const self = this;
        //
        // const materialTypeList = this.bendingData.material_type_list
        // const materialType = this.bendingData.common_info.material_type
        // self.formRight.getItem("selMaterialTypeNew").setOptions(materialTypeList)
        // self.formRight.getItem("selMaterialTypeNew").setValue(materialType)
        //
        // // Set default values
        // const defaultFields = {
        //     "inpFrontFlangeNew": 0,
        //     "inpBackFlangeNew": 0,
        //     "inpFrontCuttingNew": 0,
        //     "inpBackCuttingNew": 0,
        //     "txtBendingNew": "",
        //     "txtPipeCuttingLengthNew": "",
        //     "ckFrontNew": false,
        //     "ckBackNew": false,
        //     "txtBendingRadiusNew": "",
        //     "txtElongationRateNew": "",
        //     "txtClampLengthNew": "",
        //     "textBendingDataNew": "",
        //     "ckApplyLengthNew": true,
        //     "ckRollBendingNew": false,
        // };
        //
        // const diaList = this.bendingData.dia_list[materialType]
        // if (diaList) {
        //     self.formRight.getItem("selDiaNew").setOptions(diaList)
        //     let diaValue = this.bendingData.common_info.bending_setting_id
        //     const exists = diaList.some(d => d.value === diaValue);
        //     if (!exists)
        //         diaValue = diaList[0]['value']
        //     self.formRight.getItem("selDiaNew").setValue(diaValue)
        //     const bendingSetting = this.bendingData.bending_setting_list.find(item => item.id === diaValue);
        //
        //     let clamp_length = bendingSetting?.clamp_length ?? "";
        //     let elongation = bendingSetting?.elongation ?? "";
        //     let former_radius = bendingSetting?.former_radius ?? 0;
        //     defaultFields["txtBendingRadiusNew"] = former_radius || "";
        //     defaultFields["txtElongationRateNew"] = elongation;
        //     defaultFields["txtClampLengthNew"] = clamp_length;
        //
        //     let rollBending = former_radius >= 2000;
        //     self.formRight.getItem("ckApplyLengthNew")[rollBending ? 'enable' : 'disable']()
        //     self.formRight.getItem("ckRollBendingNew")[rollBending ? 'enable' : 'disable']()
        // }
        //
        // for (const [item, value] of Object.entries(defaultFields)) {
        //     self.formRight.getItem(item).setValue(value);
        // }
        //
        // const canEdit = self.bendingData.bending_status !== 'done';
        // const buttons = ["btnCalculateNew", "btnSaveNew", "btnClearNew"]
        // buttons.forEach(btn => {
        //     self.formRight.getItem(btn)[canEdit ? 'enable' : 'disable']()
        //     // self.formRight.getItem(btn)[canEdit ? 'show' : 'hide']()
        // });
        //
        // self.gridNew.data.parse(this.bendingData.new_gird_data)
    }

    updateBranchOptions() {
        // this.formRight.getItem("selDia").setOptions(this.bendingData.branch_list)
        // // this.updateOriginalData(self.formRight.getItem("selDia").getValue())
    }

    updateOriginalData(branchId) {
        // const self = this;
        //
        // const originalData = self.bendingData.original_data.find(o => o.id === branchId)
        // this.branchId = originalData.id
        //
        //
        // // self.formRight.getItem("txtOriginal").setValue(originalData.current_cutting_piece)
        //
        // const materialTypeList = self.bendingData.material_type_list
        // self.formRight.getItem("selMaterialType").setOptions(materialTypeList)
        //
        // const materialType = originalData.material_type
        // if (materialType) {
        //     self.formRight.getItem("selMaterialType").setValue(materialType)
        //     const diaList = self.bendingData.dia_list[materialType]
        //     self.formRight.getItem("selDiaOriginal").setOptions(diaList)
        //     if (originalData.bending_setting_id)
        //         self.formRight.getItem("selDiaOriginal").setValue(originalData.bending_setting_id)
        // }
        //
        // const canEdit = originalData.id > 0 && self.bendingData.bending_status !== 'done';
        // const items = [
        //     "selMaterialType", "selDiaOriginal", "txtBendingRadius",
        //     "inpFrontFlange", "inpBackFlange", "inpFrontCutting", "inpBackCutting",
        //     "ckFront", "ckBack", "ckWhiteRemark", "ckLeftBending", "ckRollBending", "ckApplyLength",
        //     "btnSaveOriginal", "btnDeleteOriginal", "btnCalculate", "btnClearOriginal"
        // ]
        // items.forEach(item => {
        //     self.formRight.getItem(item)[canEdit ? 'enable' : 'disable']()
        //     // if (item.startsWith("btn")) {
        //     // 	self.formRight.getItem(item)[canEdit ? 'show' : 'hide']()
        //     // }
        // });
        //
        // const columns = ["x_value", "y_value", "z_value"]
        // columns.forEach(col => self.gridOriginal.getColumn(col).editable = canEdit);
        //
        // const fields = {
        //     "txtBendingRadius": "bending_radius",
        //     "inpFrontFlange": "front_flange",
        //     "inpBackFlange": "back_flange",
        //     "txtElongationRate": "elongation_rate",
        //     "inpFrontCutting": "front_cutting",
        //     "inpBackCutting": "back_cutting",
        //     "txtBending": "bending",
        //     "txtClampLength": "clamp_length",
        //     "txtPipeCuttingLength": "pipe_cutting_length",
        //     "ckFront": "front",
        //     "ckBack": "back",
        //     "textBendingData": "bending_data_str",
        // };
        //
        // for (const [item, dataKey] of Object.entries(fields)) {
        //     self.formRight.getItem(item).setValue(originalData[dataKey]);
        // }
        //
        // let bendingRadius = Number(originalData["bending_radius"]);
        // let rollBending = !isNaN(bendingRadius) && bendingRadius >= 2000;
        // self.formRight.getItem("ckApplyLength")[rollBending ? 'enable' : 'disable']()
        // self.formRight.getItem("ckRollBending")[rollBending ? 'enable' : 'disable']()
        //
        // self.gridOriginal.data.parse(originalData.points)
    }

    updateCommonInfo() {
        // const self = this;
        //
        // self.updateIframe()
        //
        // const commonInfo = this.bendingData.common_info
        // const commonInfoData = {
        //     txtCustomer: commonInfo.customer,
        //     // txtCreateOn: commonInfo.create_on,
        //     txtShipNo: commonInfo.ship_no,
        //     // txtCreateBy: commonInfo.create_by,
        //     txtPorNo: commonInfo.por_no,
        //     // txtUpdateOn: commonInfo.update_on,
        //     // txtPieceNo: commonInfo.piece_no,
        //     // txtUpdateBy: commonInfo.update_by,
        //     // txtClass: commonInfo.class_no,
        //     // txtClassNew: commonInfo.class_no,
        //     // txtPipeType: commonInfo.pipe_type,
        //     // txtPipeTypeNew: commonInfo.pipe_type,
        //     // txtThickness: commonInfo.thk_desc,
        //     // txtThicknessNew: commonInfo.thk_desc,
        // };
        //
        // // Set values based on the mappings
        // Object.entries(commonInfoData).forEach(([itemId, value]) => {
        //     self.formRight.getItem(itemId).setValue(value);
        // });
    }

    updateData() {
        // this.updateBranchOptions()
        // this.updateCommonInfo()
        // this.updateNewData()
    }

    updateIframe() {
        const self = this;
        const iframe = `
			<iframe id="frame_pdf" marginheight="0" marginwidth="0" frameborder="0" width="100%" style="height:75vh;"></iframe>
			`
        self.layout.getCell("iframe").attachHTML(iframe)

        this.env.services.rpc({
            model: this.model,
            method: 'get_iframe_data',
            args: [this.value, this.value],
        }).then(async function (response) {
            self.layout.getCell("iframe").attachHTML(response)
        })
    }
}

// BendingDataComponent.template = "bending_data_template2";


//export default BendingDataComponent
//
// class BendingDataFormRenderer extends FormRenderer {
//     setup() {
//         super.setup();
//         console.log('1111111111111111111')
//         onMounted(() => {
//             const containerList = this.root.el.querySelectorAll(".o_bending_data");
//             for (const element of containerList) {
//                 const component = new BendingDataComponent(null, {
//                     model: this.state.model,
//                     resId: this.state.res_id,
//                 });
//                 component.mount(element);
//             }
//         })
//     }
//
// // async onRender() {
// //     await super.onRender();
// //
// //     const containerList = this.el.querySelectorAll(".o_bending_data");
// //     for (const element of containerList) {
// //         const component = new BendingDataComponent(null, {
// //             model: this.state.model,
// //             resId: this.state.res_id,
// //         });
// //         await component.mount(element);
// //     }
// // }
// }

patch(FormRenderer.prototype, {
    setup() {
        super.setup(...arguments);
        this.rpc = useService("rpc");
        this.state = useState({value: this.props.value || '',});
        onMounted(async () => {
            for (const element of $(".o_bending_data")) {
                console.log('aqqqq1111', element)
                const data = await this.rpc("/get_bending_data_info", {
                    model: this.props.resModel,
                    args: [[this.props.resId]],
                    // context: context,
                });
                mount(BendingDataComponent, {
                    target: element,
                    props: {
                        data: {
                            resId: this.props.resId,
                            model: this.props.resModel,
                            // context: this.props.context,
                            bendingData: data,
                        },
                    },
                });
            }
        });
    },
});


// patch(FormRenderer.prototype, {
//     setup() {
//         super.setup(...arguments);
//         onMounted(() => {
//             setTimeout(() => {
//
//                 const containerList = $(".o_bending_data");
//                 console.log('1111', containerList)
//                 for (const element of containerList) {
//                     mount(BendingDataComponent, {
//                         model: this.state.model,
//                         resId: this.state.res_id,
//                     }, { target: element });
//                 }
//             }, 50);
//         });
//     },
// });

