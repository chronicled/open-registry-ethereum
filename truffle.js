// Copyright (c) 2016 Chronicled, Inc. All rights reserved.

module.exports = {
  build: {
    "index.html": "index.html",
    "app.js": [
      "javascripts/app.js"
    ],
    "app.css": [
      "stylesheets/app.css"
    ],
    "images/": "images/"
  },
  deploy: [
    "Registrar",
    "Registry"
  ],
  rpc: {
    host: "localhost",
    port: 8545,
    gas: 4000000 // A bit higher that initial limit. Current one is 4M+
  }
};
