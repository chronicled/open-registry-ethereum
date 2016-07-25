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
    // "MultiAccess",
    // "MultiAccessTester",
    "Registrar",
    "Registry"
  ],
  rpc: {
    host: "localhost",
    port: 8545,
    gas: 3501592 // A bit higher that initial limit. Current one is 4M+
  }
};
