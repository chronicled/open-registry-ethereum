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
    "Registry",
    "MultiAccess",
    "MultiAccessTester"
  ],
  rpc: {
    host: "104.197.248.244",
    port: 8555,
    from: "300221400d539cb5d15940c56239e6353287eba2"
  }
};
