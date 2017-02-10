# Backend app for moving information from Trello (and elsewhere) to github.

The scripts are designed to run on Heroku or any other hosting platform with node.js support.

There are no npm dependencies.

To run locally, copy "example.env" to ".env" and edit the file to add appropriate github information and a private key if running it as a server.

You'll need a trello api key and token: https://trello.com/app-key

Create a git repo - named in .env - and an outh token: https://help.github.com/articles/creating-an-access-token-for-command-line-use/

Then start the app with `env $(cat .env | xargs) node index.js` or `./start.sh`.

To run in a docker container:
`docker run --rm -v `pwd`:/src -i -t -w /src node:alpine /bin/sh /src/start.sh`

And to test,
http://<CONTAINER-IP>:5000/v1/master?key=PRIVATE_APP_KEY&target=SHORTNAME

## Routes

The app handles a limited set of routes defined in `routes.json`.

Routes are encouraged to specify branches of the repo for versioning, (e.g. `/v1/dev` instead of `/master`) and any parameters.

## Parameters

As well as any parameters specified in `routes.json`, the app require 2 parameters to be passed when querying a route:

- key: this is used to verify that the request is legit (see example.env)
- target: this maps to a github user/organization (see example.env)

## Test data

The "trello.js" file contains the logic to retrieve test data from a Trello board arranged by lists, with cards using labels, attachments, the name and the description. This can be adapted with reference to the trello api and `libs/trello.js`. The board is at: https://trello.com/b/827WomVC/test-board - please ask to be added.

## Heroku environment variables

Run `cat .env | xargs heroku config:set` to update the environment variables.

## Adding another service

* Add any relevant keys or other config variables to .env
* Create variables for anything added above in `lib/settings.js`
* Add handler for service to `handlers` directory, using trello.js as a guide
* Add handler to `handlers` object in `index.js`
* Add handler and associated github path in `routes.json`.
