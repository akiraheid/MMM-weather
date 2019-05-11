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
			'https://cdn.jsdelivr.net/npm/chart.js@2.8.0/dist/Chart.min.js')

		this.firstStart = true
		this.loaded = false

		const payload = {
			lat: this.config.latitude,
			lon: this.config.longitude,
			modulePath: './plugins/' + this.config.source + '/'
				+ this.config.source + '.js'
		}
		this.sendSocketNotification('INIT-MMM-WEATHER-PLUGIN', payload)
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
		// Set up the local wrapper
		const wrapper = document.createElement('div')
		wrapper.id = 'MMM-weather-wrapper'

		if (this.firstStart) {
			wrapper.innerHTML = 'Loading weather data...'

			if (this.config.width) {
				const moduleElem = document.getElementsByClassName(MODULE_NAME)[0]
				moduleElem.style['width'] = this.config.width
			}
		} else if (this.loaded) {
			const locDiv = document.createElement('div')
			locDiv.innerHTML =
				this.weatherData.loc.name + ', '
				+ this.weatherData.loc.height.height + ' '
				+ this.weatherData.loc.height.units

			wrapper.appendChild(locDiv)

			// Add chart
			const canvas = document.createElement('canvas')
			canvas.id = 'MMM-weather-chart'
			wrapper.appendChild(canvas)
			
			// Chart is defined in the browser
			// eslint-disable-next-line no-undef
			this.chart = new Chart(canvas, this.chartData)
		}

		return wrapper
	},


	socketNotificationReceived: function(notification, payload) {
		if (notification === 'GOT-WEATHER-DATA') {
			this.loaded = true
			this.firstStart = false
			this.updateData(payload.result)
		} else if (notification === 'INITIALIZED-MMM-WEATHER-PLUGIN') { 
			this.getData(this)
		}
		this.updateDom(1000)
	},


	flattenData: function(data) {
		const ret = {
			dates: [],
			windSustains: [],
			windGusts: [],
			clouds: [],
			humidities: [],
			weathers: [],
			precipProbs: [],
			windDirections: [],
			temps: [],
			dews: [],
			chills: [],
		}

		for (let i = 0; i < data.length; ++i) {
			ret.dates.push(new Date(data[i].start).getHours())
			ret.windSustains.push(data[i].windSustained)
			ret.windGusts.push(data[i].windGust)
			ret.clouds.push(data[i].cloud)
			ret.humidities.push(data[i].humidity)
			ret.weathers.push(data[i].weather)
			ret.precipProbs.push(data[i].precipProb)
			ret.windDirections.push(data[i].windDirection)
			ret.temps.push(data[i].temp)
			ret.dews.push(data[i].dew)
			ret.chills.push(data[i].chill)
		}

		return ret
	},

	updateData: function(weatherData) {
		this.weatherData = weatherData
		const flat = this.flattenData(weatherData.data)
		const data = []
		const parts = [{
			label: 'Humidity',
			data: flat.humidities,
			color: this.config.humidityColor,
		},
		{
			label: 'Temperature',
			data: flat.temps,
			color: this.config.temperatureColor,
		},
		{
			label: 'Rain',
			data: flat.precipProbs,
			color: this.config.rainColor,
		}]

		parts.map((item) => {
			item.backgroundColor = item.color
			item.borderColor = item.color
			item.borderWidth = 1
			item.fill = false
			item.pointRadius = 0
			data.push(item)
		})

		this.chartData = {
			type: 'line',
			data: {
				labels: flat.dates,
				datasets: data
			},
			options: {
				scales: {
					yAxes: [{
						ticks: {
							beginAtZero: true
						}
					}]
				}
			}
		}
	},
})
