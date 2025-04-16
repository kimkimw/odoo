# -*- coding: utf-8 -*-

from odoo import models, fields, api
from odoo.exceptions import UserError


class MMO(models.Model):
    _inherit = 'mt.mmo'

    type = fields.Selection([('normal', 'Normal'), ('urgent', 'Urgent')], default='normal', required=True)
    create_on = fields.Date()
    pcs_qty_status = fields.Char()
    original_drawing_status = fields.Selection([('connected', 'Connected'), ('not_yet', 'Not yet')], default='not_yet')
    pcs_drawing_status = fields.Selection([('connected', 'Connected'), ('not_yet', 'Not yet')], default='not_yet')
    cutting_list = fields.Binary('Cutting List')
    cutting_list_name = fields.Char('Cutting List Name')
    data_input_complete_date = fields.Date()
    status = fields.Selection([('order', 'Order'), ('paid', 'Paid'), ('shipped', 'Shipped')], default='order')
    remark = fields.Char()
    pdf_file_ids = fields.Many2many("sale.split.pdf.page", string="Drawings")

    split_pdf_ids = fields.One2many("sale.split.pdf", "mmo_id", string="Split PDF")
    edit_drawing_selected_file = fields.Many2one("sale.split.pdf", string="Selected File")

    product_id = fields.Many2one(
        comodel_name='product.product',
        string="Product",
        change_default=True, ondelete='restrict', index='btree_not_null',
        domain="[('sale_ok', '=', True)]")

    mmo_line_ids = fields.One2many('mt.mmo.line', 'mmo_id', string='MMO Line')
    img_qty = fields.Integer("Image Qty", default=1)

    def create_mmo(self):
        pass

    def action_confirm(self):
        pass

    def download_excel_file(self):
        pass

    def download_drawing_file(self):
        pass

    def view_original_drawing(self):
        if len(self) != 1:
            raise UserError("Please select only one MMO record to print.")
        else:
            return {
                "type": "ir.actions.act_window",
                "name": "View Drawing",
                "res_model": "mt.mmo.line",
                "view_mode": "tree",
                "target": "new",
                "domain": [("id", "in", self.mmo_line_ids.ids)],
                "view_id": self.env.ref("autonsi_mms_seyoung_eng.view_mmo_print_drawing").id,

            }

    def view_pcs_drawing(self):
        pass

    def upload_cutting_list(self):
        pass

    def open_drawing_file(self):
        self.ensure_one()
        bending_data_id = self.env["bending.drawing.file.wizard"].search([("mmo_id", "=", self.id)])

        if not bending_data_id or bending_data_id.mmo_id.id != self.id:
            data = self.env["bending.drawing.file.wizard"].create({
                "mmo_id": self.id,
                "selection_file": self.split_pdf_ids.id,
                # "line_ids": line_ids,
                "view_type": self._context.get("view_type", "pcs"),
                "name": "Edit Drawing File" if self._context.get("view_type") == "pcs" else "Edit POR File",
            })

            line_ids = []
            for i in range(self.split_pdf_ids.count_pages):
                line = self.env["bending.drawing.file.line.wizard"].create({
                    "mmo_id": data.mmo_id.id,
                    "outsourcing_company_id": data.outsourcing_company_id.id,
                    "wizard_id": data.id,
                })
                line_ids.append((4, line.id))

            data.update({
                'line_ids': line_ids,
            })

        else:
            data = bending_data_id
        return {
            "type": "ir.actions.act_window",
            "name": "Edit Drawing File" if self._context.get("view_type") == "pcs" else "Edit POR File",
            "res_model": "bending.drawing.file.wizard",
            "view_mode": "form",
            "target": "current",
            # "context": {
            #     "default_order_id": self.id,
            # },
            "res_id": data.id,

        }


class MMOLine(models.Model):
    _name = 'mt.mmo.line'

    mmo_id = fields.Many2one('mt.mmo', string='MMO Line')
    ship_no = fields.Char()
    por_no = fields.Char()
    outsourcing_company_id = fields.Many2one('res.partner', string='Outsourcing Company',
                                             related="mmo_id.outsourcing_company_id", store=True)

    img_qty = fields.Integer("Image Qty", related="mmo_id.img_qty", readonly=False)
