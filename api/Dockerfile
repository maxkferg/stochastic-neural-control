FROM mhart/alpine-node:11

RUN apk update && apk add python g++ make && rm -rf /var/cache/apk/*

#Create the npm install layer independently
RUN mkdir /app
COPY package.json /app
RUN cd /app && npm install --quiet

# Add app source files
WORKDIR /app
ADD . /app/

ENV NODE_ENV production
EXPOSE 8888
CMD ["node", "server.js"]