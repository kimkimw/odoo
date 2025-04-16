# -*- coding: utf-8 -*-

{
    "name": "Auto & S.I Bending Seyoung ENG",
    "description": """
        Auto & S.I Custom module""",
    "author": "Auto & S.I",
    "maintainer": "",
    "website": "https://www.autonsi.com/",
    "category": "Extra Rights",
    "version": "1.0",
    "license": "AGPL-3",
    'depends': ['base', 'autonsi_mms_seyoung_eng','autonsi_sale_seyoung_eng'],

    # always loaded
    'data': [
        'security/ir.model.access.csv',
        'wizards/mmo_create_wizard_views.xml',
        'wizards/bending_drawing_file_views.xml',
        'views/outsourcing_order_view.xml',

        'views/menu.xml',
    ],
    # 'assets': {
	# 	'web.assets_backend': [
	# 		'autonsi_bending_seyoung_eng/static/src/js/*.js',
	# 		'autonsi_bending_seyoung_eng/static/src/css/*.css'
	# 	],
	# 	'web.assets_qweb': {
	# 		'autonsi_bending_seyoung/static/src/xml/*.xml',
	# 	},
	# }
}
