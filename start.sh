#!/usr/bin/env bash
env $(cat .env | xargs) node index.js
