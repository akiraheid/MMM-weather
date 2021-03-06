const MODULE_NAME = 'MMM-weather'

// Module is defined in the Magic Mirror repo
// eslint-disable-next-line no-undef
Module.register(MODULE_NAME, {

	defaults: {
		latitude: 36.8345528,
		longitude: -82.0906869, // the butt
		showHumidity: true,
		humidityColor: 'rgba(26, 252, 22, 0.7)',
		showTemperature: true,
		temperatureColor: 'rgba(255, 0, 0, 0.7)',
		showRainChance: true,
		rainColor: 'rgba(22, 255, 255, 0.7)',
		source: 'national-weather-service',
		updateInterval: 60 * 60 * 1000, // Every hour
	},


	start: function() {
		// Log is defined in the Magic Mirror repo
		// eslint-disable-next-line no-undef
		Log.info('Starting module: ' + this.name)

		if (this.data.classes === MODULE_NAME) {
			this.data.classes = 'bright medium'
		}

		// Loader is defined in the Magic Mirror repo
		// eslint-disable-next-line no-undef
		Loader.loadFile(
			'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.0.0/p5.min.js',
			this,
			this.loadp5Cb(this)
		)
	},


	// Return the callback function to use with a reference to this module
	loadp5Cb: function(that) {
		return function() {
			// p5 is loaded into global namespace by Magic Mirror
			// eslint-disable-next-line no-undef
			that.p5Canvas = new p5(that.sketch)

			const payload = {
				lat: that.config.latitude,
				lon: that.config.longitude,
				modulePath: './plugins/' + that.config.source + '/'
					+ that.config.source + '.js'
			}
			that.sendSocketNotification('INIT-MMM-WEATHER-PLUGIN', payload)
		}
	},


	getData: function(that) {
		// Notify the helper to retrieve the data
		that.sendSocketNotification('GET-WEATHER-DATA', {})
		setTimeout(that.getData, that.config.updateInterval, that)
	},


	getStyles: function() {
		return []
	},


	getDom: function() {
		// Graphics are generated by p5, so return an empty element with an
		// anchor for p5
		const wrapper = document.createElement('div')
		wrapper.id = 'MMM-weather-wrapper'

		return wrapper
	},


	socketNotificationReceived: function(notification, payload) {
		if (notification === 'GOT-WEATHER-DATA') {
			const data = this.flattenData(payload.result.data)
			this.p5Canvas.update(data)
		} else if (notification === 'INITIALIZED-MMM-WEATHER-PLUGIN') {
			this.getData(this)
		}
	},


	flattenData: function(data) {
		const ret = {
			hours: [],
			windSustains: [],
			windGusts: [],
			clouds: [],
			humidities: [],
			weathers: [],
			rainChance: [],
			windDirections: [],
			temperature: [],
			dews: [],
			chills: [],
		}

		for (let i = 0; i < data.length; ++i) {
			ret.hours.push(new Date(data[i].start).getHours())
			ret.windSustains.push(data[i].windSustained)
			ret.windGusts.push(data[i].windGust)
			ret.clouds.push(data[i].cloud)
			ret.humidities.push(data[i].humidity)
			ret.weathers.push(data[i].weather)
			ret.rainChance.push(data[i].precipProb)
			ret.windDirections.push(data[i].windDirection)
			ret.temperature.push(data[i].temp)
			ret.dews.push(data[i].dew)
			ret.chills.push(data[i].chill)
		}

		return ret
	},


	sketch: function(p) {
		const height = 400
		const width = height
		p.x = width / 2
		p.y = height / 2
		p.r = p.x

		p.setup = function() {
			const canvas = p.createCanvas(width, height)
			canvas.parent('MMM-weather-wrapper')
		}

		p.draw = function() {
			p.fill(0)
			p.stroke(255)
			p.text('Loading')
			p.noLoop()
		}

		p.update = function(data) {
			p.clear()
			const outerRadius = p.r * .7
			const innerRadius = p.r * .5

			p.renderTemp(data.temperature, innerRadius, outerRadius)
			p.renderRain(data.rainChance, innerRadius)

			// Rendering time always comes last so it's on top
			p.renderTime(data.hours, outerRadius)
		}

		p.renderRain = function(precipProbs, radius) {
			const d = radius * 2

			// Create empty circle to cover other shapes in the inner circle
			p.fill(0)
			p.noStroke()
			p.circle(p.x, p.y, d)

			// Render 50% marker line
			p.fill(0)
			p.stroke(255)
			p.strokeWeight(1)
			p.circle(p.x, p.y, radius)

			// Clear space for text
			p.fill(0)
			p.noStroke()
			p.arc(p.x, p.y, d, d, -1 * p.PI / 12, 1 * p.PI / 12)
			p.arc(p.x, p.y, d, d, 11 * p.PI / 12, 13 * p.PI / 12)

			// Render 50% marker text
			p.textSize(15)
			p.fill(255, 255, 255)
			p.text()

			const halfway = radius / 2
			let rad = 0
			let x = (p.cos(rad) * halfway) + p.x
			let y = (p.sin(rad) * halfway) + p.y
			p.textAlign(p.CENTER, p.CENTER)
			p.text('50%', x, y)

			rad = p.PI
			x = (p.cos(rad) * halfway) + p.x
			y = (p.sin(rad) * halfway) + p.y
			p.text('50%', x, y)

			// Render rain chance
			p.noStroke()
			p.color(0)
			for (let i = 0; i < 24; ++i) {
				const chance = precipProbs[i]
				const chanceD = 2 * radius * chance / 100

				const arcStart = (p.PI * i / 12) - (p.PI / 2)
				const arcEnd = (p.PI * (i + 1) / 12) - (p.PI / 2)

				p.fill(5, 252, 240)
				p.arc(p.x, p.y, chanceD, chanceD, arcStart, arcEnd)
			}
		}

		p.renderTemp = function(temps, innerRadius, outerRadius) {
			// Calculate the high and low of the data for the next 24 hours
			const tmpHigh = Math.max(...temps.slice(0, 24))
			const tmpLow = Math.min(...temps.slice(0, 24))

			// Need to show 3 rings to be able to tell temperature where 2 rings
			// show numbers to be able to represent the interval

			// Calculate the ceiling and floor as a multiple of 10 to make temp
			// easier to read
			const high = Math.ceil(tmpHigh / 10) * 10
			const low = Math.floor(tmpLow / 10) * 10
			const mid = (high + low) / 2

			// Other constants
			const outerD = outerRadius * 2
			const innerD = innerRadius * 2

			// Draw temperatures

			// In Fahrenheit
			const tempRange = {
				'freezing': 32,
				'cold': 60,
				'cool': 70,
				'warm': 80,
			}

			for (let i = 0; i < 24; ++i) {
				const temp = temps[i]
				let color = p.color(252, 181, 118) // Hot
				if (temp < tempRange.freezing) { color = p.color(118, 120, 252) }
				else if (temp < tempRange.cold) { color = p.color(118, 245, 252) }
				else if (temp < tempRange.cool) { color = p.color(118, 252, 145) }
				else if (temp < tempRange.warm) { color = p.color(169, 252, 118) }

				p.fill(color)
				p.stroke(color)
				p.strokeWeight(1)

				// diameter of the arc is a range between high and low temp
				// rings based on the temp
				const tempD = p.map(temp, low, high, innerD, outerD)
				const tempStart = (p.PI * i / 12) - (p.PI / 2)
				const tempEnd = (p.PI * (i + 1) / 12) - (p.PI / 2)
				p.arc(p.x, p.y, tempD, tempD, tempStart, tempEnd)
			}

			// Draw rings
			p.noFill()
			p.stroke(255)
			p.strokeWeight(1)
			const midD = outerD - ((outerD - innerD) / 2)
			let arcStart = -5 * p.PI / 12
			let arcStop = -1 * arcStart
			p.arc(p.x, p.y, outerD, outerD, arcStart, arcStop)
			p.arc(p.x, p.y, midD, midD, arcStart, arcStop)

			arcStart = 7 * p.PI / 12
			arcStop = -1 * arcStart
			p.arc(p.x, p.y, outerD, outerD, arcStart, arcStop)
			p.arc(p.x, p.y, midD, midD, arcStart, arcStop)

			// Draw outer ring text
			p.fill(0)
			p.stroke(255)
			p.strokeWeight(2)
			p.textAlign(p.CENTER, p.CENTER)
			p.textSize(20)
			let rad = -p.PI / 2
			let x = (p.cos(rad) * outerRadius) + p.x
			let y = (p.sin(rad) * outerRadius) + p.y
			p.text(high, x, y)

			rad = p.PI / 2
			x = (p.cos(rad) * outerRadius) + p.x
			y = (p.sin(rad) * outerRadius) + p.y
			p.text(high, x, y)

			// Draw middle ring text
			const midR = midD / 2
			rad = -p.PI / 2
			x = (p.cos(rad) * midR) + p.x
			y = (p.sin(rad) * midR) + p.y
			p.text(mid, x, y)

			rad = p.PI / 2
			x = (p.cos(rad) * midR) + p.x
			y = (p.sin(rad) * midR) + p.y
			p.text(mid, x, y)
		}

		p.renderTime = function(hours, radius) {
			const textSize = 25
			p.textSize(textSize)
			p.stroke(0)
			p.strokeWeight(1)
			p.fill(255, 255, 255)

			// Only display hours on multiples of pi/2 to make it more readable
			// and avoid scrunching text onto a graphic
			// Top
			let rad = -p.PI / 2
			let x = (p.cos(rad) * radius) + p.x
			let y = (p.sin(rad) * radius) + p.y - (textSize / 2)
			p.textAlign(p.CENTER, p.BOTTOM)
			p.text('Now', x, y)

			// Right
			rad = 0
			x = (p.cos(rad) * radius) + p.x + (textSize / 2)
			y = (p.sin(rad) * radius) + p.y
			p.textAlign(p.LEFT, p.CENTER)
			p.text(hours[6], x, y)

			// Bottom
			rad = p.PI / 2
			x = (p.cos(rad) * radius) + p.x
			y = (p.sin(rad) * radius) + p.y + (textSize / 2)
			p.textAlign(p.CENTER, p.TOP)
			p.text(hours[12], x, y)

			// Left
			rad = p.PI
			x = (p.cos(rad) * radius) + p.x - (textSize / 2)
			y = (p.sin(rad) * radius) + p.y
			p.textAlign(p.RIGHT, p.CENTER)
			p.text(hours[18], x, y)
		}

		p.renderDividers = function(radius) {
			p.stroke(0)
			for (let i = 0; i < 24; ++i) {
				const rad = (p.PI * i / 12) - (p.PI / 2)
				const is90 = (rad % (p.PI / 2)) == 0

				if (is90) {
					p.strokeWeight(4)

					const x = (p.cos(rad) * radius) + p.x
					const y = (p.sin(rad) * radius) + p.y
					p.line(p.x, p.y, x, y)
				}
			}
		}
	},
})
