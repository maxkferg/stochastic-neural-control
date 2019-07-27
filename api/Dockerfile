FROM mhart/alpine-node:11

#Create the npm install layer independently
RUN mkdir /app
COPY package.json /app
RUN cd /app && npm install

# Add app source files
WORKDIR /app
ADD . /app/

ENV NODE_ENV production
EXPOSE 8888
CMD ["node", "server.js"]