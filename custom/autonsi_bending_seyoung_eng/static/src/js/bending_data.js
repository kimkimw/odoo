/** @odoo-module **/

import {Component, onMounted, mount, useState} from "@odoo/owl";
import {registry} from "@web/core/registry";
import {useService} from "@web/core/utils/hooks";
import {_t} from "@web/core/l10n/translation";

const actionRegistry = registry.category("actions");
import {
    createPointGrid,
    getGridData,
    updateDataAfterCalculate,
    clearGrid,
    renderBendingDataInfo,
} from './bending_functions';

class BendingDataComponent extends Component {
    setup() {
        this.orm = useService("orm");
        this.rpc = useService("rpc");
        this.uiService = useService("ui");
        this.notification = useService("notification");
        this.state = useState({
            searchType: "All",
            shipNo: null,
        });

        this.layout = null;
        this.formRight = null;
        this.gridNew = null;
        this.gridOriginal = null;
        this.branchId = null;

        this.isChanging = false;

        onMounted(() => {
            this.renderLayout()
            this.renderRight()
        })
    }

    renderLayout() {
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

    renderRight() {
        const self = this

        self.formRight = new dhx.Form(null, {
            css: "dhx_form_right",
            rows: [
                // Common Info
                self.renderCommonInfo(),
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
                renderBendingDataInfo().originalData,
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
                                    checked: false
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
                renderBendingDataInfo().newData,
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
                                    checked: false
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

        self.formRight.getItem("selDia").events.on("change", function (value) {
            self.updateOriginalData(value)
            self.formRight.getItem("gridOriginal").show()
            self.formRight.getItem("textBendingData").hide()
        });

        self.formRight.getItem("selMaterialType").events.on("change", function (value) {
            const diaList = self.bendingData.dia_list[value] ?? [{'content': "", 'value': ""}]
            self.formRight.getItem("selDiaOriginal").setOptions(diaList)
        });

        self.formRight.getItem("selDiaOriginal").events.on("change", function (value) {
            const material_type = self.formRight.getItem("selMaterialType").getValue()
            const bendingSetting = self.bendingData.bending_setting_list.find(item => item.id === value);

            let clamp_length = bendingSetting?.clamp_length ?? "";
            let elongation = bendingSetting?.elongation ?? "";
            let dia = bendingSetting?.dia ?? "";
            let former_radius = bendingSetting?.former_radius ?? "";

            self.formRight.getItem("txtClampLength").setValue(clamp_length)
            self.formRight.getItem("txtElongationRate").setValue(elongation)
            self.formRight.getItem("txtBendingRadius").setValue(former_radius)

            self.formRight.getItem("ckApplyLength").setValue(true)
            let rollBending = former_radius ?? 0 >= 2000;
            self.formRight.getItem("ckApplyLength")[rollBending ? 'enable' : 'disable']()
            self.formRight.getItem("ckRollBending")[rollBending ? 'enable' : 'disable']()
        });

        self.formRight.getItem("ckApplyLength").events.on("change", function (value) {
            self.handleCheckboxChange("ckRollBending", "gridOriginal", "textBendingData", value, true);
        });

        self.formRight.getItem("ckRollBending").events.on("change", async function (value) {
            self.handleCheckboxChange("ckApplyLength", "gridOriginal", "textBendingData", value, false);
            if (value) {
                await self.getBendingDataStr(self.getOriginalData(), self.formRight.getItem("textBendingData"))
            }
        });

        self.formRight.getItem("btnSaveOriginal").events.on("click", async function (events) {
            await self.saveBranch()
        });

        self.formRight.getItem("btnDeleteOriginal").events.on("click", async function (events) {
            self.deleteBranch()
        });

        self.formRight.getItem("btnCalculate").events.on("click", async function (events) {
            const updateInfo = {
                "formItems": ["txtPipeCuttingLength", "inpFrontCutting", "txtBending"],
                "form": self.formRight,
                "grid": self.gridOriginal
            }
            await self.calculateBendingData(self.getOriginalData(), updateInfo)
        });

        self.formRight.getItem("btnClearOriginal").events.on("click", function (events) {
            clearGrid(self.formRight.getItem("txtPipeCuttingLength"), self.gridOriginal);
        });

        self.formRight.getItem("selMaterialTypeNew").events.on("change", function (value) {
            const diaList = self.bendingData.dia_list[value] ?? [{'content': "", 'value': ""}]
            self.formRight.getItem("selDiaNew").setOptions(diaList)
        });

        self.formRight.getItem("selDiaNew").events.on("change", function (value) {
            const bendingSetting = self.bendingData.bending_setting_list.find(item => item.id === value);

            let clamp_length = bendingSetting?.clamp_length ?? "";
            let elongation = bendingSetting?.elongation ?? "";
            let former_radius = bendingSetting?.former_radius ?? "";

            self.formRight.getItem("txtClampLengthNew").setValue(clamp_length)
            self.formRight.getItem("txtElongationRateNew").setValue(elongation)
            self.formRight.getItem("txtBendingRadiusNew").setValue(former_radius)

            self.formRight.getItem("ckApplyLengthNew").setValue(true)
            let rollBending = former_radius ?? 0 >= 2000;
            self.formRight.getItem("ckApplyLengthNew")[rollBending ? 'enable' : 'disable']()
            self.formRight.getItem("ckRollBendingNew")[rollBending ? 'enable' : 'disable']()
        });

        self.formRight.getItem("ckApplyLengthNew").events.on("change", function (value) {
            self.handleCheckboxChange("ckRollBendingNew", "gridNew", "textBendingDataNew", value, true);
        });

        self.formRight.getItem("ckRollBendingNew").events.on("change", async function (value) {
            self.handleCheckboxChange("ckApplyLengthNew", "gridNew", "textBendingDataNew", value, false);
            if (value) {
                await self.getBendingDataStr(self.getNewData(), self.formRight.getItem("textBendingDataNew"))
            }
        });

        self.formRight.getItem("btnCalculateNew").events.on("click", async function (events) {
            const updateInfo = {
                "formItems": ["txtPipeCuttingLengthNew", "inpFrontCuttingNew", "txtBendingNew"],
                "form": self.formRight,
                "grid": self.gridNew
            }
            await self.calculateBendingData(self.getNewData(), updateInfo)
        });

        self.formRight.getItem("btnSaveNew").events.on("click", async function () {
            await self.saveNewData()
        });

        self.formRight.getItem("btnClearNew").events.on("click", function (events) {
            clearGrid(self.formRight.getItem("txtPipeCuttingLengthNew"), self.gridNew);
        });
    }


    onBendingSettingData() {

    };

    onRedraw() {

    };

    onComplete() {

    };

    onRefresh() {

    };

    onNextPage() {

    };

    onClose() {

    };

    onEdit() {

    };

}

BendingDataComponent.template = "bending_data_template";
actionRegistry.add("bending_data_client_action", BendingDataComponent);


