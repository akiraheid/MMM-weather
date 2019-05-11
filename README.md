# MMM-weather
<a href="https://choosealicense.com/licenses/mit"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
<a href="https://david-dm.org/akiraheid/MMM-weather"><img src="https://david-dm.org/akiraheid/MMM-weather.svg"></a>

Display weather information, beautifully.

Default source for weather information is [weather.gov](https://weather.gov).

## Configuration
| Option           |  Default  | Description
|------------------|:---------:|------------
| `updateInterval` | `3600000` | Milliseconds until next update of weather information
| `latitude` | `36.8345528` | Latitude for weather
| `longitude`| `-82.0906869` | Longitude for weather
| `showHumidity` | `true` | Show humidity information
| `humidtyColor` | `rgba(26, 252, 22, 0.7)` | Color for humidity information
| `showTemperature` | `true` | Show temperature information
| `temperatureColor` | `rgba(255, 0, 0, 0.7)` | Color for temperature information
| `showRainChance` | `true` | Show rain chance information
| `rainColor` | `rgba(22, 255, 255, 0.7)` | Color for rain chance information
| `source` | `national-weather-service` | Name of the plugin to use. Must match the name of the folder and plugin file (without the `.js`)
| `width` | `undefined` | Width of the module (e.g. `500px`, `30em`)
