FROM parity/parity:stable

RUN \
	apt-get update && apt-get install -y curl git npm make g++ --no-install-recommends && \
  npm install -g n pm2 && n stable

RUN \
  git clone --depth=1 https://github.com/puppeth/eth-net-intelligence-api && \
	cd eth-net-intelligence-api && npm install

ADD . etherchain-light
WORKDIR etherchain-light

RUN \
	npm install && mv config.js.example config.js && \
	sed -i '/this.bootstrapUrl/c\  this.bootstrapUrl = "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.7/css/bootstrap.min.css";' config.js

EXPOSE 3000