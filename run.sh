#!/bin/bash
docker-compose up -d
cd backend
npm install
node server.js