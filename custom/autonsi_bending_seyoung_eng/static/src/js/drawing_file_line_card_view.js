/** @odoo-module **/

import { registry } from "@web/core/registry";
import { ListRenderer, ListController, ListModel } from "@web/views/list/list_view";

class DrawingLineCardRenderer extends ListRenderer {
    render() {
        return this.env.qweb.render("autonsi_bending_seyoung_eng.DrawingFileLineCardTemplate", {
            records: this.props.records,
        });
    }
}

class DrawingLineCardController extends ListController {}

class DrawingLineCardModel extends ListModel {}

export const DrawingLineCardView = {
    type: "drawing_line_card",
    display_name: "Drawing Line Card",
    icon: "fa fa-clone",
    multiRecord: true,
    Model: DrawingLineCardModel,
    Renderer: DrawingLineCardRenderer,
    Controller: DrawingLineCardController,
};

registry.category("views").add("drawing_line_card", DrawingLineCardView);
