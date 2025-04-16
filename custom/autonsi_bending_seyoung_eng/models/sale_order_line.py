from odoo import fields, models, api


class SaleOderLine(models.Model):
    _inherit = 'sale.order.line'

    mmo_status = fields.Selection([('order', 'Order'), ('paid', 'Paid'), ('shipped', 'Shipped')], related='mmo_id.status')
    remark = fields.Char()
