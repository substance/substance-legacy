(function(exports) {

// Talk.Client
// =============

var Client = function(url) {
  this.ws = new WebSocket(url);
  this.sent = 0;

  this.handlers = {};
  this.responseHandlers = {};

  // Register handlers
  this.bindHandlers();
};

_.extend(Client.prototype, {

  // Connected
  ready: function(cb) {
    this.ws.onopen = cb;
  },

  // Handle incoming message
  handleMessage: function(rawMessage) {
    var message = JSON.parse(rawMessage.data);
    if (message[0] === "response") {
      // TODO: error handling
      // Handle direct message responses
      this.responseHandlers[message[2]](null, message[1]);
    } else {
      // Handle incoming messages
      this.handlers[message[0]](message);
    }
  },

  bindHandlers: function() {
    this.ws["onmessage"] = _.bind(this.handleMessage, this);
  },

  on: function(event, cb) {
    this.ws["on"+event] = cb;
  },

  handle: function(cmd, cb) {
    this.handlers[cmd] = cb;
    console.log('handling ... ', cmd);
  },

  // Send a message
  send: function(message, cb) {
    this.sent += 1;
    message[2] = this.sent;

    // Register response handler if callback provided
    if (cb) this.responseHandlers[this.sent] = cb;
    this.ws.send(JSON.stringify(message));
  }
});

// Export
// -------------

exports.Talk = {
  Client: Client
};

})(window);