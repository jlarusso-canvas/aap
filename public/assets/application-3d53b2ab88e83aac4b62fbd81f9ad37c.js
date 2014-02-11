
/*
WebsocketRails JavaScript Client

Setting up the dispatcher:
  var dispatcher = new WebSocketRails('localhost:3000/websocket');
  dispatcher.on_open = function() {
    // trigger a server event immediately after opening connection
    dispatcher.trigger('new_user',{user_name: 'guest'});
  })

Triggering a new event on the server
  dispatcherer.trigger('event_name',object_to_be_serialized_to_json);

Listening for new events from the server
  dispatcher.bind('event_name', function(data) {
    console.log(data.user_name);
  });
 */

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  this.WebSocketRails = (function() {
    function WebSocketRails(url, use_websockets) {
      this.url = url;
      this.use_websockets = use_websockets != null ? use_websockets : true;
      this.connection_stale = __bind(this.connection_stale, this);
      this.pong = __bind(this.pong, this);
      this.supports_websockets = __bind(this.supports_websockets, this);
      this.dispatch_channel = __bind(this.dispatch_channel, this);
      this.unsubscribe = __bind(this.unsubscribe, this);
      this.subscribe_private = __bind(this.subscribe_private, this);
      this.subscribe = __bind(this.subscribe, this);
      this.dispatch = __bind(this.dispatch, this);
      this.trigger_event = __bind(this.trigger_event, this);
      this.trigger = __bind(this.trigger, this);
      this.bind = __bind(this.bind, this);
      this.connection_established = __bind(this.connection_established, this);
      this.new_message = __bind(this.new_message, this);
      this.state = 'connecting';
      this.callbacks = {};
      this.channels = {};
      this.queue = {};
      if (!(this.supports_websockets() && this.use_websockets)) {
        this._conn = new WebSocketRails.HttpConnection(url, this);
      } else {
        this._conn = new WebSocketRails.WebSocketConnection(url, this);
      }
      this._conn.new_message = this.new_message;
    }

    WebSocketRails.prototype.new_message = function(data) {
      var event, socket_message, _i, _len, _ref, _results;
      _results = [];
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        socket_message = data[_i];
        event = new WebSocketRails.Event(socket_message);
        if (event.is_result()) {
          if ((_ref = this.queue[event.id]) != null) {
            _ref.run_callbacks(event.success, event.data);
          }
          this.queue[event.id] = null;
        } else if (event.is_channel()) {
          this.dispatch_channel(event);
        } else if (event.is_ping()) {
          this.pong();
        } else {
          this.dispatch(event);
        }
        if (this.state === 'connecting' && event.name === 'client_connected') {
          _results.push(this.connection_established(event.data));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    WebSocketRails.prototype.connection_established = function(data) {
      this.state = 'connected';
      this.connection_id = data.connection_id;
      this._conn.flush_queue(data.connection_id);
      if (this.on_open != null) {
        return this.on_open(data);
      }
    };

    WebSocketRails.prototype.bind = function(event_name, callback) {
      var _base;
      if ((_base = this.callbacks)[event_name] == null) {
        _base[event_name] = [];
      }
      return this.callbacks[event_name].push(callback);
    };

    WebSocketRails.prototype.trigger = function(event_name, data, success_callback, failure_callback) {
      var event;
      event = new WebSocketRails.Event([event_name, data, this.connection_id], success_callback, failure_callback);
      this.queue[event.id] = event;
      return this._conn.trigger(event);
    };

    WebSocketRails.prototype.trigger_event = function(event) {
      var _base, _name;
      if ((_base = this.queue)[_name = event.id] == null) {
        _base[_name] = event;
      }
      return this._conn.trigger(event);
    };

    WebSocketRails.prototype.dispatch = function(event) {
      var callback, _i, _len, _ref, _results;
      if (this.callbacks[event.name] == null) {
        return;
      }
      _ref = this.callbacks[event.name];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        callback = _ref[_i];
        _results.push(callback(event.data));
      }
      return _results;
    };

    WebSocketRails.prototype.subscribe = function(channel_name) {
      var channel;
      if (this.channels[channel_name] == null) {
        channel = new WebSocketRails.Channel(channel_name, this);
        this.channels[channel_name] = channel;
        return channel;
      } else {
        return this.channels[channel_name];
      }
    };

    WebSocketRails.prototype.subscribe_private = function(channel_name) {
      var channel;
      if (this.channels[channel_name] == null) {
        channel = new WebSocketRails.Channel(channel_name, this, true);
        this.channels[channel_name] = channel;
        return channel;
      } else {
        return this.channels[channel_name];
      }
    };

    WebSocketRails.prototype.unsubscribe = function(channel_name) {
      if (this.channels[channel_name] == null) {
        return;
      }
      this.channels[channel_name].destroy();
      return delete this.channels[channel_name];
    };

    WebSocketRails.prototype.dispatch_channel = function(event) {
      if (this.channels[event.channel] == null) {
        return;
      }
      return this.channels[event.channel].dispatch(event.name, event.data);
    };

    WebSocketRails.prototype.supports_websockets = function() {
      return typeof WebSocket === "function" || typeof WebSocket === "object";
    };

    WebSocketRails.prototype.pong = function() {
      var pong;
      pong = new WebSocketRails.Event(['websocket_rails.pong', {}, this.connection_id]);
      return this._conn.trigger(pong);
    };

    WebSocketRails.prototype.connection_stale = function() {
      return this.state !== 'connected';
    };

    return WebSocketRails;

  })();

}).call(this);

/*
The Event object stores all the relevant event information.
 */

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  WebSocketRails.Event = (function() {
    function Event(data, success_callback, failure_callback) {
      var attr;
      this.success_callback = success_callback;
      this.failure_callback = failure_callback;
      this.run_callbacks = __bind(this.run_callbacks, this);
      this.attributes = __bind(this.attributes, this);
      this.serialize = __bind(this.serialize, this);
      this.is_ping = __bind(this.is_ping, this);
      this.is_result = __bind(this.is_result, this);
      this.is_channel = __bind(this.is_channel, this);
      this.name = data[0];
      attr = data[1];
      if (attr != null) {
        this.id = attr['id'] != null ? attr['id'] : ((1 + Math.random()) * 0x10000) | 0;
        this.channel = attr.channel != null ? attr.channel : void 0;
        this.data = attr.data != null ? attr.data : attr;
        this.connection_id = data[2];
        if (attr.success != null) {
          this.result = true;
          this.success = attr.success;
        }
      }
    }

    Event.prototype.is_channel = function() {
      return this.channel != null;
    };

    Event.prototype.is_result = function() {
      return this.result === true;
    };

    Event.prototype.is_ping = function() {
      return this.name === 'websocket_rails.ping';
    };

    Event.prototype.serialize = function() {
      return JSON.stringify([this.name, this.attributes()]);
    };

    Event.prototype.attributes = function() {
      return {
        id: this.id,
        channel: this.channel,
        data: this.data
      };
    };

    Event.prototype.run_callbacks = function(success, data) {
      if (success === true) {
        return typeof this.success_callback === "function" ? this.success_callback(data) : void 0;
      } else {
        return typeof this.failure_callback === "function" ? this.failure_callback(data) : void 0;
      }
    };

    return Event;

  })();

}).call(this);

/*
 HTTP Interface for the WebSocketRails client.
 */

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  WebSocketRails.HttpConnection = (function() {
    HttpConnection.prototype.httpFactories = function() {
      return [
        function() {
          return new XMLHttpRequest();
        }, function() {
          return new ActiveXObject("Msxml2.XMLHTTP");
        }, function() {
          return new ActiveXObject("Msxml3.XMLHTTP");
        }, function() {
          return new ActiveXObject("Microsoft.XMLHTTP");
        }
      ];
    };

    HttpConnection.prototype.createXMLHttpObject = function() {
      var e, factories, factory, xmlhttp, _i, _len;
      xmlhttp = false;
      factories = this.httpFactories();
      for (_i = 0, _len = factories.length; _i < _len; _i++) {
        factory = factories[_i];
        try {
          xmlhttp = factory();
        } catch (_error) {
          e = _error;
          continue;
        }
        break;
      }
      return xmlhttp;
    };

    function HttpConnection(url, dispatcher) {
      this.url = url;
      this.dispatcher = dispatcher;
      this.connectionClosed = __bind(this.connectionClosed, this);
      this.flush_queue = __bind(this.flush_queue, this);
      this.trigger = __bind(this.trigger, this);
      this.parse_stream = __bind(this.parse_stream, this);
      this.createXMLHttpObject = __bind(this.createXMLHttpObject, this);
      this._url = this.url;
      this._conn = this.createXMLHttpObject();
      this.last_pos = 0;
      this.message_queue = [];
      this._conn.onreadystatechange = this.parse_stream;
      this._conn.addEventListener("load", this.connectionClosed, false);
      this._conn.open("GET", this._url, true);
      this._conn.send();
    }

    HttpConnection.prototype.parse_stream = function() {
      var data, decoded_data;
      if (this._conn.readyState === 3) {
        data = this._conn.responseText.substring(this.last_pos);
        this.last_pos = this._conn.responseText.length;
        data = data.replace(/\]\]\[\[/g, "],[");
        decoded_data = JSON.parse(data);
        return this.dispatcher.new_message(decoded_data);
      }
    };

    HttpConnection.prototype.trigger = function(event) {
      if (this.dispatcher.state !== 'connected') {
        return this.message_queue.push(event);
      } else {
        return this.post_data(this.dispatcher.connection_id, event.serialize());
      }
    };

    HttpConnection.prototype.post_data = function(connection_id, payload) {
      return $.ajax(this._url, {
        type: 'POST',
        data: {
          client_id: connection_id,
          data: payload
        },
        success: function() {}
      });
    };

    HttpConnection.prototype.flush_queue = function(connection_id) {
      var event, _i, _len, _ref;
      _ref = this.message_queue;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        event = _ref[_i];
        if (connection_id != null) {
          event.connection_id = this.dispatcher.connection_id;
        }
        this.trigger(event);
      }
      return this.message_queue = [];
    };

    HttpConnection.prototype.connectionClosed = function(event) {
      var close_event;
      close_event = new WebSocketRails.Event(['connection_closed', event]);
      this.dispatcher.state = 'disconnected';
      return this.dispatcher.dispatch(close_event);
    };

    return HttpConnection;

  })();

}).call(this);

/*
WebSocket Interface for the WebSocketRails client.
 */

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  WebSocketRails.WebSocketConnection = (function() {
    function WebSocketConnection(url, dispatcher) {
      this.url = url;
      this.dispatcher = dispatcher;
      this.flush_queue = __bind(this.flush_queue, this);
      this.on_error = __bind(this.on_error, this);
      this.on_close = __bind(this.on_close, this);
      this.on_message = __bind(this.on_message, this);
      this.trigger = __bind(this.trigger, this);
      if (this.url.match(/^wss?:\/\//)) {
        console.log("WARNING: Using connection urls with protocol specified is depricated");
      } else if (window.location.protocol === 'http:') {
        this.url = "ws://" + this.url;
      } else {
        this.url = "wss://" + this.url;
      }
      this.message_queue = [];
      this._conn = new WebSocket(this.url);
      this._conn.onmessage = this.on_message;
      this._conn.onclose = this.on_close;
      this._conn.onerror = this.on_error;
    }

    WebSocketConnection.prototype.trigger = function(event) {
      if (this.dispatcher.state !== 'connected') {
        return this.message_queue.push(event);
      } else {
        return this._conn.send(event.serialize());
      }
    };

    WebSocketConnection.prototype.on_message = function(event) {
      var data;
      data = JSON.parse(event.data);
      return this.dispatcher.new_message(data);
    };

    WebSocketConnection.prototype.on_close = function(event) {
      var close_event;
      close_event = new WebSocketRails.Event(['connection_closed', event]);
      this.dispatcher.state = 'disconnected';
      return this.dispatcher.dispatch(close_event);
    };

    WebSocketConnection.prototype.on_error = function(event) {
      var error_event;
      error_event = new WebSocketRails.Event(['connection_error', event]);
      this.dispatcher.state = 'disconnected';
      return this.dispatcher.dispatch(error_event);
    };

    WebSocketConnection.prototype.flush_queue = function() {
      var event, _i, _len, _ref;
      _ref = this.message_queue;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        event = _ref[_i];
        this._conn.send(event.serialize());
      }
      return this.message_queue = [];
    };

    return WebSocketConnection;

  })();

}).call(this);

/*
The channel object is returned when you subscribe to a channel.

For instance:
  var dispatcher = new WebSocketRails('localhost:3000/websocket');
  var awesome_channel = dispatcher.subscribe('awesome_channel');
  awesome_channel.bind('event', function(data) { console.log('channel event!'); });
  awesome_channel.trigger('awesome_event', awesome_object);
 */

(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  WebSocketRails.Channel = (function() {
    function Channel(name, _dispatcher, is_private) {
      var event, event_name;
      this.name = name;
      this._dispatcher = _dispatcher;
      this.is_private = is_private;
      this._failure_launcher = __bind(this._failure_launcher, this);
      this._success_launcher = __bind(this._success_launcher, this);
      this.dispatch = __bind(this.dispatch, this);
      this.trigger = __bind(this.trigger, this);
      this.bind = __bind(this.bind, this);
      this.destroy = __bind(this.destroy, this);
      if (this.is_private) {
        event_name = 'websocket_rails.subscribe_private';
      } else {
        event_name = 'websocket_rails.subscribe';
      }
      event = new WebSocketRails.Event([
        event_name, {
          data: {
            channel: this.name
          }
        }, this._dispatcher.connection_id
      ], this._success_launcher, this._failure_launcher);
      this._dispatcher.trigger_event(event);
      this._callbacks = {};
    }

    Channel.prototype.destroy = function() {
      var event, event_name;
      event_name = 'websocket_rails.unsubscribe';
      event = new WebSocketRails.Event([
        event_name, {
          data: {
            channel: this.name
          }
        }, this._dispatcher.connection_id
      ]);
      this._dispatcher.trigger_event(event);
      return this._callbacks = {};
    };

    Channel.prototype.bind = function(event_name, callback) {
      var _base;
      if ((_base = this._callbacks)[event_name] == null) {
        _base[event_name] = [];
      }
      return this._callbacks[event_name].push(callback);
    };

    Channel.prototype.trigger = function(event_name, message) {
      var event;
      event = new WebSocketRails.Event([
        event_name, {
          channel: this.name,
          data: message
        }, this._dispatcher.connection_id
      ]);
      return this._dispatcher.trigger_event(event);
    };

    Channel.prototype.dispatch = function(event_name, message) {
      var callback, _i, _len, _ref, _results;
      if (this._callbacks[event_name] == null) {
        return;
      }
      _ref = this._callbacks[event_name];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        callback = _ref[_i];
        _results.push(callback(message));
      }
      return _results;
    };

    Channel.prototype._success_launcher = function(data) {
      if (this.on_success != null) {
        return this.on_success(data);
      }
    };

    Channel.prototype._failure_launcher = function(data) {
      if (this.on_failure != null) {
        return this.on_failure(data);
      }
    };

    return Channel;

  })();

}).call(this);





(function() {
  this.HandlebarsTemplates || (this.HandlebarsTemplates = {});
  this.HandlebarsTemplates["player/final_results"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"main-content\">\n  You won/thanks for playing!!! blah blah blah\n</div>\n";
  });
  return this.HandlebarsTemplates["player/final_results"];
}).call(this);
(function() {
  this.HandlebarsTemplates || (this.HandlebarsTemplates = {});
  this.HandlebarsTemplates["player/game_start"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"top-content\">\n  <h2>The game begins in...</h2>\n</div>\n<div class=\"main-content\">\n  <div class=\"main-countdown\">\n    <span class=\"seconds\"></span>\n  </div>\n</div>\n";
  });
  return this.HandlebarsTemplates["player/game_start"];
}).call(this);
(function() {
  this.HandlebarsTemplates || (this.HandlebarsTemplates = {});
  this.HandlebarsTemplates["player/map"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"map-container\">\n  <div id=\"map\"></div>\n</div>\n";
  });
  return this.HandlebarsTemplates["player/map"];
}).call(this);
(function() {
  this.HandlebarsTemplates || (this.HandlebarsTemplates = {});
  this.HandlebarsTemplates["player/pre_game"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<!-- Start Pre-Game Carousel -->\n  <div class=\"pre-game-content\">\n    <div class=\"pre-game-slides\">\n      <ul class=\"slides\">\n        <!-- Slide 1 -->\n        <li>\n          <figure>\n            <img src=\"assets/illinois.png\", width=\"130\">\n          </figure>\n          <h2>Each question reveals 10 states <br>as possible answers</h2>\n        </li>\n        <!-- Slide 2 -->\n        <li>\n          <figure>\n            <img src=\"assets/florida.png\", width=\"250\">\n          </figure>\n          <h2>Feeling confident? Tap the state<br> and \"Submit\" your answer.</h2>\n        </li>\n        <!-- Slide 3 -->\n        <li>\n          <figure>\n            <img src=\"assets/timer.png\", width=\"220\">\n          </figure>\n          <h2>But hurry... you've got 10 seconds<br> for each question</h2>\n        </li>\n      </ul>\n    </div>\n  </div>\n<!-- End Pre-Game Carousel -->\n\n<script type=\"text/javascript\">\n  console.log('pre game slider starts')\n  $('.pre-game-slides').flexslider({\n    animation: 'slide',\n    slideshow: false,\n    selector: '.slides > li',\n    itemWidth: 1000,\n    directionNav: false,\n    start: function(){\n\n      // Make sure background is resized to accomodate for area occupied\n      // by the slider.\n      $(window).trigger('resize');\n    }\n  })\n\n</script>\n";
  });
  return this.HandlebarsTemplates["player/pre_game"];
}).call(this);
(function() {
  this.HandlebarsTemplates || (this.HandlebarsTemplates = {});
  this.HandlebarsTemplates["player/question"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<!-- Map for Player Select -->\n<div class=\"map-content\" data-id=\"";
  if (stack1 = helpers.choices) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.choices); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n</div>\n\n<!-- Footer for Player Submit -->\n<div class=\"selection\">\n  <footer class=\"select-bar\">\n    <h3 id=\"js-selected-state\">Select a State</h3>\n    <button class=\"submit answer\">SUBMIT</button>\n  </footer>\n</div>\n";
  return buffer;
  });
  return this.HandlebarsTemplates["player/question"];
}).call(this);
(function() {
  this.HandlebarsTemplates || (this.HandlebarsTemplates = {});
  this.HandlebarsTemplates["player/round_results"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        <h4 class=\"points ";
  if (stack1 = helpers.answer_class) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.answer_class); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n          ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.answer_is_correct), {hash:{},inverse:self.program(4, program4, data),fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " points</h4>\n        <h2><span>";
  if (stack1 = helpers.exclamation) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.exclamation); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span> ";
  if (stack1 = helpers.answer_name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.answer_name); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h2>\n      ";
  return buffer;
  }
function program2(depth0,data) {
  
  
  return "\n            +10\n          ";
  }

function program4(depth0,data) {
  
  
  return "\n            +0\n          ";
  }

function program6(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        <h2><span>You didn't answer!</span> ";
  if (stack1 = helpers.answer_name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.answer_name); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h2>\n      ";
  return buffer;
  }

function program8(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n      ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.answer_is_correct), {hash:{},inverse:self.program(11, program11, data),fn:self.program(9, program9, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    ";
  return buffer;
  }
function program9(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        <p>";
  if (stack1 = helpers.correct_headline) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.correct_headline); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "</p>\n      ";
  return buffer;
  }

function program11(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        <p>";
  if (stack1 = helpers.incorrect_headline) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.incorrect_headline); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "</p>\n      ";
  return buffer;
  }

function program13(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n      <p>";
  if (stack1 = helpers.incorrect_headline) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.incorrect_headline); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "</p>\n    ";
  return buffer;
  }

function program15(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n      <h3>You Selected:\n        <strong>";
  if (stack1 = helpers.choice_name) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.choice_name); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "</strong>\n      </h3>\n    ";
  return buffer;
  }

  buffer += "<!-- Answer Explanation -->\n<div class=\"main-content\">\n  <div id=\"overlay\">\n    <div class=\"round-results\">\n<!-- if Answer is correct, attach .is-correct class -->\n<!-- else attach .is-incorrect -->\n\n      ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.has_answer), {hash:{},inverse:self.program(6, program6, data),fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n    ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.has_answer), {hash:{},inverse:self.program(13, program13, data),fn:self.program(8, program8, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n\n    </div>\n  </div>\n  <!-- TODO: Replace US Map with SVG -->\n  <div class=\"map-content\" data-id=\"";
  if (stack1 = helpers.choices) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = (depth0 && depth0.choices); stack1 = typeof stack1 === functionType ? stack1.call(depth0, {hash:{},data:data}) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n  </div>\n</div>\n\n<!-- Player's Submited Answer -->\n<div class=\"selection\">\n  <footer class=\"select-bar\">\n\n    ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.has_answer), {hash:{},inverse:self.noop,fn:self.program(15, program15, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n\n  </footer>\n</div>\n\n";
  return buffer;
  });
  return this.HandlebarsTemplates["player/round_results"];
}).call(this);
(function() {
  this.HandlebarsTemplates || (this.HandlebarsTemplates = {});
  this.HandlebarsTemplates["player/wait"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"main-content\">\n  Please wait for the next round!\n</div>\n";
  });
  return this.HandlebarsTemplates["player/wait"];
}).call(this);
(function() {
  this.HandlebarsTemplates || (this.HandlebarsTemplates = {});
  this.HandlebarsTemplates["shared/countdown"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "";


  buffer += "\n<div class=\"header-countdown\">\n  <p><span class=\"seconds\"></span> Seconds Left</p>\n</div>\n";
  return buffer;
  });
  return this.HandlebarsTemplates["shared/countdown"];
}).call(this);
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  this.Dispatcher = (function() {
    function Dispatcher(uuid) {
      this._unSerialize = __bind(this._unSerialize, this);
      this._answerResponse = __bind(this._answerResponse, this);
      this._mapData = __bind(this._mapData, this);
      this._currentPhase = __bind(this._currentPhase, this);
      this._currentQuestion = __bind(this._currentQuestion, this);
      this._bindEvents = __bind(this._bindEvents, this);
      var connection_params, url;
      url = "192.168.72.112:3000/websocket";
      connection_params = "?uuid=" + uuid;
      this.dispatcher = new WebSocketRails(url + connection_params, true);
      this._bindEvents();
    }

    Dispatcher.prototype._bindEvents = function() {
      this.dispatcher.bind('current_question', this._currentQuestion);
      this.dispatcher.bind('current_phase', this._currentPhase);
      this.dispatcher.bind('map_data', this._mapData);
      return this.dispatcher.bind('answer_response', this._answerResponse);
    };

    Dispatcher.prototype._currentQuestion = function(message) {
      window.AAL.router.current_question = this._unSerialize(message['current_question']);
      return console.log(window.AAL.router.current_question);
    };

    Dispatcher.prototype._currentPhase = function(message) {
      this.current_phase = message['current_phase'];
      window.AAL.router.current_phase = this.current_phase;
      window.AAL.router.clearContent();
      return window.AAL.router.loadCurrentTemplate();
    };

    Dispatcher.prototype._mapData = function(message) {
      return window.AAL.map.map_data = message['map_data'];
    };

    Dispatcher.prototype._answerResponse = function(message) {
      return window.AAL.router.has_correct_answer = message['is_correct'];
    };

    Dispatcher.prototype._unSerialize = function(question) {
      var choice_ary;
      choice_ary = question.choices.split(",");
      question.choices = $.map(choice_ary, function(id) {
        return parseInt(id);
      });
      return question;
    };

    return Dispatcher;

  })();

}).call(this);
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  this.Map = (function() {
    function Map() {
      this._makeClickable = __bind(this._makeClickable, this);
      this.buildMap = __bind(this.buildMap, this);
      this.path_attrs = {
        fill: "#d3d3d3",
        stroke: "#fff",
        "stroke-opacity": "1",
        "stroke-linejoin": "round",
        "stroke-miterlimit": "4",
        "stroke-width": "0.75",
        "stroke-dasharray": "none"
      };
    }

    Map.prototype.buildMap = function(map_data) {
      this.paper = Raphael("map", 900, 700);
      this.choices = window.AAL.router.current_question.choices;
      return $.each(this.map_data, (function(_this) {
        return function(index, state) {
          var path, _ref;
          path = _this.paper.path(state.path_data);
          path.attr(_this.path_attrs);
          path[0].setAttribute("data-id", state.id);
          path[0].setAttribute("data-name", state.name);
          if (_ref = state.id, __indexOf.call(_this.choices, _ref) >= 0) {
            path[0].setAttribute("class", "is-choice");
            path.attr({
              fill: "#87a347"
            });
            return _this._makeClickable(path);
          }
        };
      })(this));
    };

    Map.prototype._makeClickable = function(element) {
      var id, name;
      id = element[0].getAttribute('data-id');
      name = element[0].getAttribute('data-name');
      return element.click(function() {
        var $submit;
        $(".is-choice").not(this).attr({
          fill: "#87a347"
        });
        this.attr({
          fill: "#ef8301"
        });
        $submit = $('.submit');
        $submit.attr('answer_choice', parseInt(id)).attr('choice_name', name).addClass("is-active");
        return $("#js-selected-state").html("You Selected: " + "<strong>" + name + "</strong>");
      });
    };

    return Map;

  })();

}).call(this);
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  this.PreGameSlider = (function() {
    function PreGameSlider() {
      this.create_pre_game_slider = __bind(this.create_pre_game_slider, this);
    }

    PreGameSlider.prototype.create_pre_game_slider = function() {
      return $(".pre-game-slides").flexslider({
        animation: "slide",
        slideshow: false,
        selector: ".slides > li",
        itemWidth: 1000,
        directionNav: false,
        start: function() {
          return $(window).trigger("resize");
        }
      });
    };

    return PreGameSlider;

  })();

}).call(this);
(function() {
  this.Router = (function() {
    function Router() {
      this.clearHeaderCountdown();
      this.user_type = "player";
      this.countdown_template = HandlebarsTemplates["shared/countdown"]();
      this.wait_template = HandlebarsTemplates["player/wait"]();
      this.map_template = HandlebarsTemplates["player/map"]();
    }

    Router.prototype.loadCurrentTemplate = function() {
      return this["_" + this.current_phase]();
    };

    Router.prototype.clearContent = function() {
      return $('#content').empty();
    };

    Router.prototype.clearMap = function() {
      return $('#map').remove();
    };

    Router.prototype.clearHeaderCountdown = function() {
      return $('.header-countdown').remove();
    };

    Router.prototype.clearAnswer = function() {
      return this.answer_data = null;
    };

    Router.prototype.createMap = function() {
      $('.map-content').append(this.map_template);
      return window.AAL.map.buildMap();
    };

    Router.prototype.attachSubmitEvent = function() {
      return $('.submit').on('click', function() {
        var answer_choice, answer_index, answer_is_correct, choice_name, params;
        answer_choice = parseInt($(this).attr('answer_choice'));
        choice_name = $(this).attr('choice_name');
        if (answer_choice) {
          answer_index = window.AAL.router.current_question.answer_index;
          answer_is_correct = answer_choice === answer_index;
          if (answer_is_correct) {
            window.AAL.router.answer_data = {
              answer_is_correct: true,
              answer_class: "is-correct",
              exclamation: "Correct!",
              choice_name: choice_name,
              has_answer: true
            };
          } else {
            window.AAL.router.answer_data = {
              answer_is_correct: false,
              answer_class: "is-incorrect",
              exclamation: "Incorrect!",
              choice_name: choice_name,
              has_answer: true
            };
          }
          params = {
            device_uuid: 2,
            answer_is_correct: answer_is_correct
          };
          return window.AAL.dispatcher.dispatcher.trigger("send_answer", params);
        } else {

        }
      });
    };

    Router.prototype._mainTemplate = function(json) {
      return HandlebarsTemplates["" + this.user_type + "/" + this.current_phase](json);
    };

    Router.prototype._pre_game = function() {
      var template;
      this.clearHeaderCountdown();
      window.AAL.pre_game_slider.create_pre_game_slider();
      template = this._mainTemplate();
      return $('#content').append(template);
    };

    Router.prototype._game_start = function() {
      var template;
      template = this._mainTemplate();
      $('#content').append(template);
      return window.AAL.stopwatch.startCountdown('main');
    };

    Router.prototype._question = function() {
      var template;
      this.clearAnswer();
      this.clearMap();
      this.clearHeaderCountdown();
      if (this.current_question) {
        template = this._mainTemplate(this.current_question);
        $('#header').append(this.countdown_template);
      } else {
        template = this.wait_template;
      }
      $('#content').append(template);
      if (window.AAL.map.map_data) {
        this.createMap();
        this.attachSubmitEvent();
      }
      return window.AAL.stopwatch.startCountdown('header');
    };

    Router.prototype._round_results = function() {
      var template, updated_question;
      if (this.current_question) {
        if (!this.answer_data) {
          this.answer_data = {
            has_answer: false
          };
        }
        console.log(this.answer_data.has_answer);
        updated_question = $.extend(this.current_question, this.answer_data);
        template = this._mainTemplate(updated_question);
      } else {
        template = this.wait_template;
      }
      return $('#content').append(template);
    };

    Router.prototype._final_results = function() {
      var template;
      this.clearMap();
      this.clearHeaderCountdown();
      template = this._mainTemplate();
      return $('#content').append(template);
    };

    return Router;

  })();

}).call(this);
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  this.Stopwatch = (function() {
    function Stopwatch() {
      this.startCountdown = __bind(this.startCountdown, this);
      this.clearCountdown = __bind(this.clearCountdown, this);
      this.dispatcher = window.AAL.dispatcher.dispatcher;
    }

    Stopwatch.prototype.clearCountdown = function() {
      if (this.counting) {
        return this["break"] = true;
      }
    };

    Stopwatch.prototype.startCountdown = function(type) {
      var count, counter, timer;
      this.counting = true;
      if (type === "header") {
        count = 9;
        this.$container = $('.header-countdown .seconds');
      } else if (type === "main") {
        count = 3;
        this.$container = $('.main-countdown .seconds');
      }
      timer = (function(_this) {
        return function() {
          if (_this["break"]) {
            clearInterval(counter);
            _this.counting = null;
            return _this["break"] = null;
          } else {
            _this.$container.text(":0" + count);
            if (count <= 0) {
              clearInterval(counter);
              _this.counting = null;
            }
            return count -= 1;
          }
        };
      })(this);
      return counter = setInterval(timer, 1000);
    };

    return Stopwatch;

  })();

}).call(this);
(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  this.PlayerController = (function() {
    function PlayerController() {
      this._bindEvents = __bind(this._bindEvents, this);
      this.dispatcher = window.AAL.dispatcher.dispatcher;
      this._bindEvents();
    }

    PlayerController.prototype._bindEvents = function() {
      return $('.state').on('click', function() {});
    };

    return PlayerController;

  })();

}).call(this);
(function() {
  window.app = {
    initialize: function() {
      return this.bindEvents();
    },
    bindEvents: function() {
      return document.addEventListener('deviceready', this.receivedEvent, false);
    },
    receivedEvent: function(id) {
      $(function() {
        navigator.notification.alert('this is the second item');
        window.AAL.pre_game_slider = new PreGameSlider;
        window.AAL.map = new Map;
        window.AAL.dispatcher = new Dispatcher(dUUID);
        window.AAL.router = new Router;
        window.AAL.stopwatch = new Stopwatch;
        return window.AAL.playerController = new PlayerController;
      });
      return this;
    }
  };

}).call(this);
// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/sstephenson/sprockets#sprockets-directives) for details
// about supported directives.
//









;
