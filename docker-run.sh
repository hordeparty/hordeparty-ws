#!/bin/bash
docker run -d --rm --name socketio-chat -p 3000:3000 -v "$PWD":/src node:18.14.1-alpine3.17 ash -c "cd src && npm install && node index.js"
