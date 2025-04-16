from odoo import fields, models, api, _
import requests
import base64

from odoo.exceptions import ValidationError


class BendingDrawingFileWizard(models.TransientModel):
    _name = 'bending.drawing.file.wizard'
    _description = 'bending Drawing File'

    name = fields.Char("name", default="Bending Drawing File")
    line_ids = fields.One2many('bending.drawing.file.line.wizard', 'wizard_id', string="Detail")
    mmo_id = fields.Many2one("mt.mmo", string="MMO")
    selection_file = fields.Many2one('sale.split.pdf', string="Selection Files", domain="[('mmo_id', '=', mmo_id)]")
    total_piece = fields.Integer("Total Piece", compute="_compute_total_piece")
    total_image = fields.Integer("Total Image", compute="_compute_total_image")
    outsourcing_company_id = fields.Many2one('res.partner', string='Outsourcing Company',
                                             related="mmo_id.outsourcing_company_id", store=True)

    right_panel_html = fields.Html("Right Panel", compute="_compute_right_panel_html", sanitize=False, )

    por_drawing_file_ids = fields.Many2many("sale.split.pdf.page", string="POR Files", related="mmo_id.pdf_file_ids",
                                            readonly=False,
                                            domain="[('file_id', '=', selection_file), ('is_invisible_map_por', '=', False)]")
    view_type = fields.Selection([('pcs', 'PCS'), ('por', 'POR')], string="View Type", default="pcs")

    @api.depends('line_ids')
    def _compute_total_piece(self):
        for record in self:
            record.total_piece = len(record.line_ids)

    @api.depends('selection_file')
    def _compute_total_image(self):
        for record in self:
            page_ids = record.selection_file.page_ids.filtered(
                lambda x: not x.is_invisible_map_pcs if record.view_type == 'pcs' else not x.is_invisible_map_por)
            record.total_image = len(page_ids)

    def action_batch_images(self):
        # print("action_batch_images")

        docs_assigned = []
        page_ids = self.selection_file.page_ids.filtered(lambda x: not x.is_invisible_map_pcs)
        sorted_documents = page_ids.sorted(key=lambda x: x.id)
        for line in self.line_ids:
            line.pdf_file_ids = [(5, 0, 0)]
            for index in range(line.img_qty):
                for doc in sorted_documents:
                    if doc not in docs_assigned:
                        line.pdf_file_ids = [(4, doc.id)]
                        docs_assigned.append(doc)
                        break

    def action_reset_images(self):
        for line in self.line_ids:
            line.pdf_file_ids = [(5, 0, 0)]

    def write(self, vals):
        if 'selection_file' in vals:
            self.mmo_id.edit_drawing_selected_file = vals['selection_file']
        return super(BendingDrawingFileWizard, self).write(vals)

    @api.depends('selection_file')
    def _compute_right_panel_html(self):
        for record in self:
            right_panel_html = "<div class='list_pdf_view_widget'><div class='list_pdf_view_widget_container'>"
            page_ids = record.selection_file.page_ids.filtered(
                lambda x: not x.is_invisible_map_pcs if record.view_type == 'pcs' else not x.is_invisible_map_por)
            for pdf in page_ids:
                right_panel_html += f"""
                    <div class="thumbnail-container thumbnail-container-{pdf.id}" id="{pdf.id}" data-link="{pdf.name}">
                        <img src="/web/image?model=sale.split.pdf.page&id={pdf.id}&field=pdf_thumbnail_preview" loading="lazy" class="thumbnail-image"/>
                        <div class="thumbnail-label">{pdf.file_name}</div>
                    </div>
                """
            right_panel_html += "</div></div>"

            record.right_panel_html = right_panel_html

    def fetch_pdf_base64(self, pdf_url):
        """Fetch PDF từ link HTTP và trả về dưới dạng base64"""
        if not pdf_url:
            raise ValueError("Không có URL PDF")
        try:
            response = requests.get(pdf_url, timeout=10)
            response.raise_for_status()  # Kiểm tra lỗi HTTP
            return base64.b64encode(response.content).decode("utf-8")

        except requests.RequestException as e:
            raise ValueError(f"Lỗi khi tải PDF: {e}")


class PageBendingLineWizard(models.TransientModel):
    _name = "bending.drawing.file.line.wizard"

    wizard_id = fields.Many2one(
        "bending.drawing.file.wizard",
        string="Wizard",
        required=True,
        ondelete="cascade",
    )
    selection_file = fields.Many2one('sale.split.pdf', string="Selection Files", related="wizard_id.selection_file")
    mmo_id = fields.Many2one("mt.mmo", string="MMO")
    product_id = fields.Many2one("product.product", string="Piece", related="mmo_id.product_id")
    pdf_file_ids = fields.Many2many("sale.split.pdf.page", string="Drawings", related="mmo_id.pdf_file_ids",
                                    readonly=False,
                                    domain="[('file_id', '=', selection_file), ('is_invisible_map_pcs', '=', False)]")
    img_qty = fields.Integer("Image Qty", related="mmo_id.img_qty", readonly=False)

    outsourcing_company_id = fields.Many2one('res.partner', string='Outsourcing Company',
                                             related="mmo_id.outsourcing_company_id", store=True)

    bending_status = fields.Selection([('draft', 'Draft'), ('done', 'Done')], string="Bending Status")

    def action_bending_data(self):
        view_id = self.env.ref('autonsi_bending_seyoung_eng.piece_list_bending_form').id
        action = {
            "name": _("Bending Data"),
            "display_name": _("Bending Data"),
            "type": "ir.actions.act_window",
            "res_model": self._name,
            "views": [[view_id, "form"]],
            "res_id": self.id,
            "target": "current",
            "context": {'bending_data': True,
                        # 'current_cutting_piece': self.id,
                        # 'main_cutting_piece': self.main_cutting_piece.id,
                        }
        }
        return action

    def open_bending_setting(self):
        pass

    def redraw_bending_data(self):
        pass

    def confirm_bending_data(self):
        pass

    def refresh(self):
        pass

    def close_bending_form(self):
        pass

    def next_page(self):
        pass

    def edit_page(self):
        pass
