from odoo.exceptions import ValidationError
from odoo import _

import re
import math


class BendingUtils:
	@staticmethod
	def is_number(s):
		if isinstance(s, str):
			pattern = re.compile(r'^-?\d+(\.\d+)?$')
			return bool(pattern.match(s))
		return False

	@staticmethod
	def convert_to_number(value):
		if value is None:
			return 0
		if isinstance(value, (int, float)):
			return float(value)
		if BendingUtils.is_number(value):
			return float(value)
		return 0

	@staticmethod
	def cal_straight_length(x, y, z, bending_radius, bending_angle):
		result = round(math.sqrt(x ** 2 + y ** 2 + z ** 2) - bending_radius * math.tan(math.radians(bending_angle / 2)), 1)
		return result

	@staticmethod
	def dot_product(vec1, vec2):
		return sum(x * y for x, y in zip(vec1, vec2))

	@staticmethod
	def magnitude(vec):
		return sum(x ** 2 for x in vec) ** 0.5

	@staticmethod
	def cross_product(vec1, vec2):
		result = [
			vec1[1] * vec2[2] - vec1[2] * vec2[1],  # x component
			vec1[2] * vec2[0] - vec1[0] * vec2[2],  # y component
			vec1[0] * vec2[1] - vec1[1] * vec2[0]  # z component
		]
		return result

	@staticmethod
	def vector_cross_matrix(matrix_a, matrix_b):
		if len(matrix_a) != len(matrix_b):
			raise ValidationError(_("Vector is invalid!"))

		result = []
		for i in range(len(matrix_a)):
			result.append(BendingUtils.cross_product(matrix_a[i], matrix_b[i]))

		return result

	@staticmethod
	def create_vector_for_calculate(vec1, vec2):
		result = []
		for i in range(len(vec1)):
			if i < len(vec2):
				dot_prod = BendingUtils.dot_product(vec1[i], vec2[i])  # Inner product
				mag_1 = BendingUtils.magnitude(vec1[i])  # Magnitude of 1
				mag_2 = BendingUtils.magnitude(vec2[i])  # Magnitude of 2

				result.append([dot_prod, mag_1, mag_2])
		return result

	@staticmethod
	def get_angle(vec):
		vec_x = vec[0]
		vec_y = vec[1]
		vec_z = vec[2]

		if (vec_x > 0 and abs(vec_x - vec_y * vec_z) < 0.001) or (vec_x == 0 and (vec_z == 0 or vec_y == 0)):
			angle = 0
		elif vec_x < 0 and abs(abs(vec_x) - vec_y * vec_z) < 0.001:
			angle = 180
		else:
			angle = round(math.degrees(math.acos(vec_x / (vec_y * vec_z))), 1)
		return angle

	@staticmethod
	def get_point_list(bending_radius, point_values):
		if bending_radius >= 2000:
			point_values = point_values[:3]

		points = point_values
		for i, point in enumerate(point_values):
			if not point['x'] and not point['y'] and not point['z']:
				points = point_values[:i]
				break
			if i == len(point_values) - 1:
				points = point_values

		return points

	@staticmethod
	def check_bending_condition(data):
		bending_radius = BendingUtils.convert_to_number(data['bending_radius'])
		point_values = data["point_values"]
		points = BendingUtils.get_point_list(bending_radius, point_values)

		clamp_length = BendingUtils.convert_to_number(data["clamp_length"]) or 0
		bending_start_point = BendingUtils.convert_to_number(points[0]['bending_start_point']) or 0
		straight_lengths = [BendingUtils.convert_to_number(point['straight_length']) for point in points[1:]] or 0

		if bending_start_point < clamp_length - 5:
			raise ValidationError(_("Bending Start Point must equal or greater than Clamp length!"))

		for i, straight_length in enumerate(straight_lengths):
			length_check = straight_length
			if length_check < clamp_length:
				raise ValidationError(_("Straight Length must equal or greater than Clamp length!"))

	@staticmethod
	def calculate_bending_data(data):
		bending_data = []

		bending_radius = BendingUtils.convert_to_number(data['bending_radius'])
		front_cutting = data['front_cutting'] or 0
		back_cutting = data['back_cutting'] or 0
		front_flange = data['front_flange'] or 0
		back_flange = data['back_flange'] or 0
		elongation_rate = data['elongation_rate'] or 0
		clamp_length = data['clamp_length'] or 0

		point_values = BendingUtils.get_point_list(bending_radius, data['point_values'])

		if not point_values:
			raise ValidationError(_('Please input the coordinates!'))

		front_margin_value = front_cutting - front_flange  # T1
		elongation = ((2 * math.pi * bending_radius) / 360) * elongation_rate  # V3

		# Vector a: Negated coordinates of the first three points
		vector_a = [[-p['x'], -p['y'], -p['z']] for p in point_values]

		# Vector b: Coordinates of the last three points
		vector_b = [[p['x'], p['y'], p['z']] for p in point_values[1:]]
		vector_b.append([0, 0, 0])

		vector_bending_angle = BendingUtils.create_vector_for_calculate(vector_a, vector_b)

		# Vector c: Calculations as specified
		vector_c = []
		for i in range(1, len(point_values)):
			if i == len(point_values) - 1:
				vector = [point_values[i]['x'], point_values[i]['y'], point_values[i]['z']]
			else:
				vector = [point_values[i]['x'] + point_values[i + 1]['x'],
				          point_values[i]['y'] + point_values[i + 1]['y'],
				          point_values[i]['z'] + point_values[i + 1]['z']]
			vector_c.append(vector)
		vector_c.append([0, 0, 0])

		vector_axb = BendingUtils.vector_cross_matrix(vector_a, vector_b)
		vector_cxb = BendingUtils.vector_cross_matrix(vector_c, vector_b)

		vector_rotation = BendingUtils.create_vector_for_calculate(vector_axb, vector_cxb)
		vector_rotation.insert(0, [0, 0, 0])
		vector_rotation.pop()

		vector_c = [[p['x'], p['y'], p['z']] for p in point_values[2:]]
		vector_c.extend([[0, 0, 0], [0, 0, 0]])

		vector_rl_angle = BendingUtils.create_vector_for_calculate(vector_axb, vector_c)
		vector_rl_angle.insert(0, [0, 0, 0])
		vector_rl_angle.pop()

		pre_bending_angle = 0
		pre_bending_start_point = 0
		bending_start_point_list = []
		point_length = len(point_values)
		for i in range(point_length):
			point_id = point_values[i]['id']
			x = point_values[i]['x']
			y = point_values[i]['y']
			z = point_values[i]['z']
			magnitude = math.sqrt(x ** 2 + y ** 2 + z ** 2)

			bending_angle = BendingUtils.get_angle(vector_bending_angle[i])
			bending_angle = 180 - bending_angle if bending_angle not in {0, 180} else bending_angle

			if not (x or y or z):
				rotation_angle = bending_start_point_value = bending_start_point = straight_length = 0
			else:
				# Straight Length
				tan_bending_angle = math.tan(math.radians(bending_angle / 2))
				tan_pre_bending_angle = math.tan(math.radians(pre_bending_angle / 2))
				straight_length = magnitude - bending_radius * (tan_bending_angle + tan_pre_bending_angle)

				# Bending Start Point
				if i == 0:
					bending_start_point_value = (magnitude + front_margin_value) - bending_radius * tan_bending_angle
					bending_start_point = bending_start_point_value
				else:
					a = (2 * math.pi * bending_radius * pre_bending_angle) / 360
					b = elongation * pre_bending_angle * 0.01
					bending_start_point_value = pre_bending_start_point + a + straight_length - b
					bending_start_point = bending_start_point_value

				rotation_angle = BendingUtils.get_angle(vector_rotation[i])
				rotation_angle = int(round(rotation_angle, 0))

				rl_angle = BendingUtils.get_angle(vector_rl_angle[i])

				if rl_angle == 90 and (rotation_angle == 0 or rotation_angle == 180):
					rl = "+"
				elif rl_angle < 90:
					rl = "+"
				else:
					rl = "-"

				if rotation_angle not in (0, 180):
					rotation_angle = "" if i == 0 else f"{rl}{rotation_angle}"

				pre_bending_start_point = bending_start_point_value
				pre_bending_angle = bending_angle

				straight_length = int(round(straight_length, 0))
				bending_start_point_value = int(round(bending_start_point_value, 0))
				bending_start_point = "" if i == point_length - 1 else int(round(bending_start_point, 0))
				bending_angle = int(round(bending_angle, 0))

			if bending_start_point_value == "":
				if i > 0:
					bending_data[i - 1]["bending_start_point"] = ""
			else:
				bending_start_point_list.append(float(bending_start_point_value))

			if i > 0:
				bending_data[i - 1]['rotation_angle'] = rotation_angle

			bending_data.append({
				'point_id': point_id,
				'bending_start_point_value': bending_start_point_value,
				'bending_start_point': bending_start_point,
				'bending_angle': bending_angle,
				'straight_length': straight_length,
				'rotation_angle': rotation_angle
			})

		bending_start_point_first = bending_data[0]['bending_start_point']
		calculate_again = False

		while bending_start_point_first < clamp_length - 5:
			calculate_again = True
			rate = (clamp_length - 5 - bending_start_point_first) // 100 + 1
			front_cutting += 100 * rate
			bending_start_point_first += front_cutting

		first_straight_length = bending_data[0]['straight_length']
		last_straight_length = bending_data[-1:][0]['straight_length']
		bending_data[0]['straight_length'] = first_straight_length - front_flange + front_cutting
		bending_data[-1:][0]['straight_length'] = last_straight_length - back_flange + back_cutting

		max_bending_start_point = max(bending_start_point_list) if bending_start_point_list else 0
		pipe_cutting_length = max_bending_start_point + (back_cutting - back_flange)
		return {
			'calculateAgain': calculate_again,
			'pipeLength': pipe_cutting_length,
			'frontCutting': front_cutting,
			'bendingStep': len(point_values) - 1,
			'points': bending_data
		}

	@staticmethod
	def get_bending_obj(data):
		return {
			"name": data["dia_content"],
			"material_type": data["material_type"],
			"bending_setting_id": data["bending_setting_id"],
			"dia": data["dia"],
			"bending_radius": data["bending_radius"],
			"front_flange": data["front_flange"],
			"back_flange": data["back_flange"],
			"elongation_rate": data["elongation_rate"],
			"front_cutting": data["front_cutting"],
			"back_cutting": data["back_cutting"],
			"bending": data["bending"],
			"clamp_length": data["clamp_length"],
			"pipe_cutting_length": data["pipe_cutting_length"],
			"front": data["front"],
			"back": data["back"],
			"bending_data_str": data["bending_data_str"]
		}

	@staticmethod
	def get_point_obj(point):
		return {
			"x_point": point['x'],
			"y_point": point['y'],
			"z_point": point['z'],
			"straight_length": point['straight_length'],
			"bending_start_point": point['bending_start_point'],
			"bending_angle": point['bending_angle'],
			"rotation_angle": point['rotation_angle'],
			"number": point['number'],
		}

	@staticmethod
	def get_bending_data_str(data):
		latest_data = BendingUtils.get_bending_data_latest(data)

		bending_data_str = ""
		bending_step = int(latest_data['bending']) if latest_data['bending'] else 0
		points = latest_data['point_values'][:bending_step]
		constant = 0.01745
		ct_first = latest_data['front_cutting'] or 0 > 0
		ct_last = latest_data['back_cutting'] or 0 > 0
		bending_radius = BendingUtils.convert_to_number(latest_data['bending_radius'])

		for i, point in enumerate(points):
			if i == 0:
				bending_data_str += "CT \t" if ct_first else "\t"
			else:
				bending_data_str += "\t"
			bending_data_str += f"{str(point['bending_start_point'])}\t"
			bending_data_str += f"{str(point['bending_angle'])}\t"
			if i == len(points) - 1:
				bending_data_str += "CT" if ct_last else ""
			else:
				bending_data_str += f"{str(points[i]['rotation_angle'])}"
			bending_angle = BendingUtils.convert_to_number(point['bending_angle'])
			bending_start_point = BendingUtils.convert_to_number(point['bending_start_point'])

			number = int(round((constant * bending_radius * bending_angle) + bending_start_point, 0))
			bending_data_str += "\n"
			bending_data_str += f"({str(number)})"
			bending_data_str += "\n"

		dia = latest_data['dia']
		bending_radius = latest_data['bending_radius']
		pipe_cutting_length = latest_data['pipe_cutting_length']
		back = "V" if latest_data['back'] else ""
		front = "V" if latest_data['front'] else ""
		bending_data_str += f"{dia}A\tR{bending_radius}\tL={pipe_cutting_length}\t[{front}]/[{back}]"

		return str(bending_data_str)

	@staticmethod
	def get_point_data(point=None):
		points = []
		for index in range(5):
			points.append({
				"id": point[index].id if point else index + 1,
				"index": index + 1,
				"x_value": point[index].x_point or "" if point else "",
				"y_value": point[index].y_point or "" if point else "",
				"z_value": point[index].z_point or "" if point else "",
				"straight_length": point[index].straight_length or "" if point else "",
				"bending_start_point": point[index].bending_start_point or "" if point else "",
				"bending_angle": point[index].bending_angle or "" if point else "",
				"rotation_angle": point[index].rotation_angle or "" if point else "",
				"number": point[index].number or "" if point else "",
			})
		return points

	@staticmethod
	def get_branches_data(branches):
		branch_list = [{
			'value': branch.id,
			'content': branch.name,
		} for branch in branches] if branches else [{'value': 0, 'content': ""}]

		branch_data_list = branches if branches else [None]

		original_data = []
		for branch in branch_data_list:
			points = BendingUtils.get_point_data(branch.points if branch else None)
			branch_obj = {
				"id": branch.id if branch else 0,
				'name': branch.name or "" if branch else "",
				'material_type': branch.material_type or "" if branch else "",
				'bending_setting_id': branch.bending_setting_id or "" if branch else "",
				'dia': branch.dia or "" if branch else "",
				'bending_radius': branch.bending_radius or "" if branch else "",
				'front_flange': branch.front_flange or "" if branch else "",
				'back_flange': branch.back_flange or "" if branch else "",
				'elongation_rate': branch.elongation_rate or "" if branch else "",
				'front_cutting': branch.front_cutting or "" if branch else "",
				'back_cutting': branch.back_cutting or "" if branch else "",
				'bending': branch.bending or "" if branch else "",
				'clamp_length': branch.clamp_length or "" if branch else "",
				'pipe_cutting_length': branch.pipe_cutting_length or "" if branch else "",
				'front': branch.front if branch else False,
				'back': branch.back if branch else False,
				'bending_data_str': branch.bending_data_str if branch else "",
				'points': points
			}

			if branch and branch._name == "bending.branch":
				branch_obj['current_cutting_piece'] = branch.cutting_piece_list_id.material_id.display_name or "" if branch else ""
				branch_obj['current_cutting_piece_id'] = branch.cutting_piece_list_id.id or "" if branch else ""
			original_data.append(branch_obj)

		return branch_list, original_data

	@staticmethod
	def get_material_type_list():
		material_type_list = [
			{'content': "STEEL", 'value': "steel"},
			{'content': "SUS", 'value': "sus"},
			{'content': "FRAMO", 'value': "framo"},
		]
		return material_type_list

	@staticmethod
	def get_bending_setting_select_list(bending_settings):
		bending_setting_list = []
		material_dia_list = {}
		for bending_setting in bending_settings:
			# bending setting list
			elongation_percent = f"{round(float(bending_setting.elongation) * 100, 2)}%"
			bending_setting_list.append({
				'id': bending_setting.id,
				'common_type': bending_setting.common_type,
				'dia': bending_setting.dia,
				'dia_num': bending_setting.dia_num,
				'sch': bending_setting.sch,
				'former_radius': bending_setting.former_radius,
				'clamp_length': bending_setting.clamp_length,
				'elongation': round(float(bending_setting.elongation), 2),
				'elongation_percent': elongation_percent,
				'remark': bending_setting.remark,
			})

			material_type = bending_setting.common_type
			dia = bending_setting.dia
			bending_setting_id = bending_setting.id

			# bending setting dia list by material type
			if material_type not in material_dia_list:
				material_dia_list[material_type] = []
			# Add the size if it's not already in the list
			material_dia_list[material_type].append(
				{'dia': dia, 'content': f'{dia} {bending_setting.remark or ""}', 'value': bending_setting_id})

		return material_dia_list, bending_setting_list

	@staticmethod
	def get_bending_data_latest(data):
		while True:
			calculated_data = BendingUtils.calculate_bending_data(data)
			if calculated_data['calculateAgain']:
				data['front_cutting'] = calculated_data['frontCutting']
			else:
				break

		# update calculated data
		data['pipe_cutting_length'] = calculated_data['pipeLength']
		data['front_cutting'] = calculated_data['frontCutting']
		for point in calculated_data['points']:
			point_data = next((p for p in data['point_values'] if p['id'] == point['point_id']), None)
			if point_data:
				point_data['straight_length'] = point['straight_length']
				point_data['bending_start_point'] = point['bending_start_point']
				point_data['bending_angle'] = point['bending_angle']
				point_data['rotation_angle'] = point['rotation_angle']

		return data

	@staticmethod
	def save_bending_data(data):
		calculated_data = BendingUtils.get_bending_data_latest(data)
		# save
		BendingUtils.check_bending_condition(calculated_data)
		bending_obj = BendingUtils.get_bending_obj(calculated_data)
		point_values = calculated_data['point_values']

		return bending_obj, point_values
