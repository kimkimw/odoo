from odoo import models, fields, api
from odoo.exceptions import UserError


class MMOCreateWizard(models.TransientModel):
    _name = 'mmo.create.wizard'

    type = fields.Selection([
        ('urgent', 'Urgent'),
        ('normal', 'Normal'),
    ], string='Type', default='urgent', required=True)

    title = fields.Char(string="MMO Title", required=True)
    outsourcing_company_id = fields.Many2one('res.partner', string="Outsourcing Company", required=True)
    original_drawing = fields.Binary(string="Original Drawing")
    original_drawing_name = fields.Char(string="Original Drawing")
    original_drawing_status = fields.Selection([('connected', 'Connected'), ('not_yet', 'Not yet')],
                                               default='connected')
    remark = fields.Text(string="Remark")

    def action_confirm(self):
        if self.original_drawing_name:
            mmo = self.env['mt.mmo'].create({
                'type': self.type,
                'name': self.title,
                'outsourcing_company_id': self.outsourcing_company_id.id,
                'original_drawing_status': self.original_drawing_status,
                'remark': self.remark,
            })
            self.env['sale.split.pdf'].create({
                'mmo_id': mmo.id,
                'file_pdf': self.original_drawing,
                'file_name': self.original_drawing_name,

            })
