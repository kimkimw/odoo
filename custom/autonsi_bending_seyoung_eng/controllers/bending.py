from odoo import http
from odoo.http import request
from odoo.exceptions import ValidationError

from ..models.utils import BendingUtils


class BendingController(http.Controller):

	@http.route('/bending/calculate_bending_data', type='json', auth='user')
	def calculate_bending_data(self, **kwargs):
		try:
			data = kwargs.get('data')
			while True:
				result = BendingUtils.calculate_bending_data(data)
				if result['calculateAgain']:
					data['front_cutting'] = result['frontCutting']
				else:
					break
			return {'result': result}
		except ValidationError as e:
			return {'message': str(e)}
		except Exception as e:
			return {'message': str(e)}

	@http.route('/bending/get_bending_data_str', type='json', auth='user')
	def get_bending_data_str(self, **kwargs):
		try:
			data = kwargs.get('data')
			result = BendingUtils.get_bending_data_str(data)
			return {'result': result}
		except ValidationError as e:
			return {'message': str(e)}
		except Exception as e:
			return ({'message': str(e)})

	@http.route('/get_bending_data_info', type='json', auth='user')
	def get_bending_data_info(self, **kwargs):
		return {'result': True}
