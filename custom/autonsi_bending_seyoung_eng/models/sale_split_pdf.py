from odoo import fields, models, api


class SaleSplitPdf(models.Model):
    _inherit = 'sale.split.pdf'

    mmo_id = fields.Many2one('mt.mmo', string='MMO')