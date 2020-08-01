const NodeHelper = require('node_helper')

module.exports = NodeHelper.create({

	start: function () {
		// Set up local values
		this.plugin = undefined
	},


	initPlugin: function (moduleName, lat, lon) {
		this.plugin = require(moduleName)(lat, lon)
		this.sendSocketNotification('INITIALIZED-MMM-WEATHER-PLUGIN', {})
	},


	getData: function () {
		if (this.plugin === undefined) return

		this.plugin.getData((data) => {
			this.sendSocketNotification('GOT-WEATHER-DATA', {'result': data})
		})
	},


	socketNotificationReceived: function(notification, payload) {
		if (notification === 'GET-WEATHER-DATA') {
			this.getData()
		} else if (notification === 'INIT-MMM-WEATHER-PLUGIN') {
			this.initPlugin(payload.modulePath, payload.lat, payload.lon)
		}
	},

})
