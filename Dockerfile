FROM node:17-alpine

RUN apk add git

WORKDIR /app/MagicMirror

RUN git clone https://github.com/MichMich/MagicMirror .

RUN npm install

COPY package* modules/MMM-weather/

RUN cd modules/MMM-weather \
	&& npm install

COPY plugins modules/MMM-weather/plugins
COPY MMM-weather.* node_helper.js modules/MMM-weather/
COPY mmm.config.js config/config.js

ENTRYPOINT ["npm", "run", "server"]

