const request = require('request')
const DOMParser = require('xmldom').DOMParser

function getLocation(root) {
	const heightElem = root.getElementsByTagName('height')[0]
	let name = ''
	if (root.getElementsByTagName('area-description').length == 1) {
		name = root.getElementsByTagName('area-description')[0].textContent
	} else if (root.getElementsByTagName('description').length == 1) {
		name = root.getElementsByTagName('description')[0].textContent
	}

	let unit = heightElem.getAttribute('height-units')
	if (unit == '') {
		unit = 'feet'
	}

	const ret = {
		name: name,
		height: {
			datum: heightElem.getAttribute('datum'),
			height: parseInt(heightElem.textContent),
			units: unit,
		}
	}

	return ret
}

function extractValues(root) {
	const ret = []
	const values = root.getElementsByTagName('value')

	for (let i = 0; i < values.length; ++i) {
		ret.push(parseInt(values[i].textContent))
	}

	return ret
}

function getTimes(root) {
	const ends = root.getElementsByTagName('end-valid-time')
	const starts = root.getElementsByTagName('start-valid-time')

	const ret = []

	for (let i = 0; i < ends.length; ++i) {
		ret.push({
			start: new Date(starts[i].textContent),
			end: new Date(ends[i].textContent),
		})
	}

	return ret
}

function getTemps(root) {
	const ret = {}

	for (let i = 0; i < root.length; ++i) {
		const values = extractValues(root[i])
		const type = root[i].getAttribute('type')

		if (type === 'dew point') {
			ret.dew = values
		} else if (type === 'wind chill') {
			ret.chill = values
		} else if (type === 'hourly') {
			ret.hourly = values
		}
	}

	return ret
}

function getWinds(root) {
	const ret = {}

	for (let i = 0; i < root.length; ++i) {
		const values = extractValues(root[i])
		const type = root[i].getAttribute('type')

		if (type === 'sustained') {
			ret.sustained = values
		} else if (type === 'gust') {
			ret.gust = values
		}
	}

	return ret
}

function getWeathers(root) {
	const ret = []
	const conds = root.getElementsByTagName('weather-conditions')

	for (let i = 0; i < conds.length; ++i) {
		if (conds[i].childNodes.length == 0) {
			ret.push(null)
		} else {
			const elem = conds[i].getElementsByTagName('value')[0]
			ret.push({
				type: elem.getAttribute('weather-type'),
				coverage: elem.getAttribute('coverage'),
			})
		}
	}

	return ret
}

function parseData(root) {
	const ret = {}
	ret.version = 1
	ret.data = []
	ret.loc = getLocation(root.getElementsByTagName('location')[0])

	// Contains dew, wind chill, hourly
	const temps = getTemps(root.getElementsByTagName('temperature'))

	// Contains sustained, gust
	const winds = getWinds(root.getElementsByTagName('wind-speed'))

	const times = getTimes(root.getElementsByTagName('time-layout')[0])
	const clouds = extractValues(root.getElementsByTagName('cloud-amount')[0])
	const humidities = extractValues(root.getElementsByTagName('humidity')[0])
	const weathers = getWeathers(root.getElementsByTagName('weather')[0])

	const precipProbs =
		extractValues(root.getElementsByTagName(
			'probability-of-precipitation')[0])

	const windDirections =
		extractValues(root.getElementsByTagName('direction')[0])

	for (let i = 0; i < temps.hourly.length; ++i) {
		const data = {
			start: times[i].start,
			end: times[i].end,
			windSustained: winds.sustained[i],
			windGust: winds.gust[i],
			cloud: clouds[i],
			humidity: humidities[i],
			weather: weathers[i],
			precipProb: precipProbs[i],
			windDirection: windDirections[i],
			temp: temps.hourly[i],
			dewpoint: temps.dew[i],
			//chill: temps.chill[i],
			//heat-index: temps.heat[i],
		}
		ret.data.push(data)
	}

	return ret
}

module.exports = (latitude, longitude, config) => {
	const ret = {}
	ret.latitude = latitude
	ret.longitude = longitude
	ret.config = config
	ret.url = 'https://forecast.weather.gov/MapClick.php?lat=' + ret.latitude
		+ '&lon=' + ret.longitude + '&FcstType=digitalDWML'

	ret.getData = (done) => {
		let dataRet = {}
		const req = {
			url: ret.url,
			headers: {
				'User-Agent': 'request',
				'Accept': '*/*'
			}
		}

		request(req, function(err, res, body) {
			if (err || res.statusCode != 200) {
				// eslint-disable-next-line no-console
				console.error('error', err, '\n', res && res.statusCode)
			} else {
				const doc = new DOMParser().parseFromString(body)
				dataRet = parseData(doc)
			}

			done(dataRet)
		})
	}

	return ret
}
