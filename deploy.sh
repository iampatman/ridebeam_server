#!/bin/sh
git pull
npm install
pm2 restart 7
