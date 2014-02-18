
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





var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

this.Dispatcher = (function() {
  function Dispatcher() {
    this._unSerialize = __bind(this._unSerialize, this);
    this._mapData = __bind(this._mapData, this);
    this._currentPhase = __bind(this._currentPhase, this);
    this._currentQuestion = __bind(this._currentQuestion, this);
    this._bindEvents = __bind(this._bindEvents, this);
    this.connectWithId = __bind(this.connectWithId, this);
    this.disconnect = __bind(this.disconnect, this);
    this.url = "192.168.1.2:3000/websocket";
  }

  Dispatcher.prototype.disconnect = function() {
    return this.dispatcher.disconnect;
  };

  Dispatcher.prototype.connectWithId = function(uuid) {
    this.uuid = uuid;
    this.dispatcher = new WebSocketRails("" + this.url + "?uuid=" + uuid, true);
    return this._bindEvents();
  };

  Dispatcher.prototype._bindEvents = function() {
    this.dispatcher.bind('current_question', this._currentQuestion);
    this.dispatcher.bind('current_phase', this._currentPhase);
    return this.dispatcher.bind('map_data', this._mapData);
  };

  Dispatcher.prototype._currentQuestion = function(message) {
    return window.AAL.router.current_question = this._unSerialize(message['current_question']);
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
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

this.Map = (function() {
  function Map() {
    this._makeClickable = __bind(this._makeClickable, this);
    this.buildMap = __bind(this.buildMap, this);
    this.staticMap = __bind(this.staticMap, this);
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

  Map.prototype.staticMap = function() {
    var answer_id, paper_height, paper_width, picked_id, _ref;
    paper_width = 1300;
    paper_height = 600;
    this.paper = Raphael('map');
    this.paper.setViewBox(0, 0, paper_width, paper_height, true);
    this.paper.setSize('140%', '140%');
    this.choices = window.AAL.router.current_question.choices;
    answer_id = (_ref = window.AAL.router.current_question) != null ? _ref.answer_index : void 0;
    picked_id = window.AAL.router.answer_data.choice_id;
    return $.each(this.map_data, (function(_this) {
      return function(index, state) {
        var path, _ref1;
        path = _this.paper.path(state.path_data);
        path.attr(_this.path_attrs);
        if (_ref1 = state.id, __indexOf.call(_this.choices, _ref1) >= 0) {
          path[0].setAttribute("class", "is-choice");
          path.attr({
            fill: "#87a347"
          });
        }
        if (state.id === answer_id) {
          return path.attr({
            fill: "#ef8301"
          });
        } else if (state.id === picked_id) {
          return path.attr({
            fill: "#960000"
          });
        }
      };
    })(this));
  };

  Map.prototype.buildMap = function() {
    var paper_height, paper_width;
    paper_width = 1400;
    paper_height = 600;
    this.paper = Raphael('map');
    this.choices = window.AAL.router.current_question.choices;
    this.paper.setViewBox(0, 0, paper_width, paper_height, true);
    this.paper.setSize('150%', '150%');
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
      $('.submit').removeClass('green');
      $(".is-choice").not(this).attr({
        fill: "#87a347"
      });
      this.attr({
        fill: "#ef8301"
      });
      $submit = $('.submit');
      $submit.attr('answer_choice', parseInt(id));
      $submit.attr('choice_name', name);
      $submit.addClass("is-active");
      return $("#js-selected-state").html("You Selected: " + "<strong>" + name + "</strong>");
    });
  };

  return Map;

})();
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

this.PreGameSlider = (function() {
  function PreGameSlider() {
    this.create_pre_game_slider = __bind(this.create_pre_game_slider, this);
    var place;
    place = "holder";
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
if (typeof(AA) == 'undefined') AA = {}
AA.RaphaelHelpers = (function(){
  return {
    translate_to_center: function(paper, path, time, scale_string, cb){
      var cx = paper.width / 2;
      var cy = paper.height / 2;

      var path_box = path.getBBox();
      var path_cx = (path_box.x2 - path_box.x) + path_box.x;
      var path_cy = (path_box.y2 - path_box.y) + path_box.y;

      var tcx = (cx - path_cx) + ((path_box.x2 - path_box.x) / 2);
      var tcy = (cy - path_cy) + ((path_box.y2 - path_box.y) / 2);
      var t_string = 'T' + tcx + ' ' + tcy

      if (scale_string) {
        t_string = t_string + ', ' + scale_string;
      }

      path.animate({
        transform: t_string
      }, time, '<>', function(){
        if (cb) cb();
      });
    },
    get_scale_to_fit_string: function(paper, path, scale_adjustment, width, height) {
      var paper_width = (width) ? width : paper.width;
      var paper_height = (height) ? height : paper.height;
      var path_box = path.getBBox();
      var path_width = path_box.width;
      var path_height = path_box.y2 - path_box.y;
      var scale_size;

      if (path_width > path_height) {
        scale_size = paper_width / path_width;
      }
      else {
        scale_size = paper_height / path_height;
      }

      return 'S' + (scale_size + scale_adjustment);
    },
    reset_path: function(path, time, cb) {
      path.animate({
        transform: 'T0 0, S1 1'
      }, time, '<>', function(){
        if (cb) cb();
      });
    }

  }

})();
this.Router = (function() {
  function Router() {
    this.clearHeaderCountdown();
    this.user_type = "player";
    this.countdown_template = Handlebars.compile($('#countdown').html())();
    this.wait_template = Handlebars.compile($('#wait').html())();
    this.map_template = Handlebars.compile($('#map').html())();
  }

  Router.prototype.loadCurrentTemplate = function() {
    return this["_" + this.current_phase]();
  };

  Router.prototype.clearContent = function() {
    return $('#content').empty();
  };

  Router.prototype.clearMap = function() {
    $('svg').remove();
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

  Router.prototype.staticMap = function() {
    $('.map-content').append(this.map_template);
    return window.AAL.map.staticMap();
  };

  Router.prototype.attachSubmitEvent = function() {
    return $('.submit').on('click', function() {
      var answer_choice, answer_index, answer_is_correct, choice_name, params;
      $(this).addClass('green');
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
            has_answer: true,
            choice_id: answer_choice
          };
          params = {
            device_uuid: window.AAL.dispatcher.uuid
          };
          return window.AAL.dispatcher.dispatcher.trigger("send_answer", params);
        } else {
          return window.AAL.router.answer_data = {
            answer_is_correct: false,
            answer_class: "is-incorrect",
            exclamation: "Incorrect!",
            choice_name: choice_name,
            has_answer: true,
            choice_id: answer_choice
          };
        }
      } else {

      }
    });
  };

  Router.prototype._mainTemplate = function(json) {
    var template;
    template = Handlebars.compile($("#" + this.current_phase).html());
    return template(json);
  };

  Router.prototype._pre_game = function() {
    var template;
    this.clearHeaderCountdown();
    template = this._mainTemplate();
    $('#content').append(template);
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
      window.AAL.stopwatch.startCountdown('header');
    } else {
      template = this.wait_template;
    }
    $('#content').append(template);
    if (window.AAL.map.map_data) {
      this.createMap();
      return this.attachSubmitEvent();
    }
  };

  Router.prototype._round_results = function() {
    var template, updated_question;
    this.clearMap();
    if (this.current_question) {
      if (!this.answer_data) {
        this.answer_data = {
          has_answer: false
        };
      }
      updated_question = $.extend(this.current_question, this.answer_data);
      template = this._mainTemplate(updated_question);
    } else {
      template = this.wait_template;
    }
    $('#content').append(template);
    if (window.AAL.map.map_data) {
      return this.staticMap();
    }
  };

  Router.prototype._final_results = function() {
    var template;
    this.clearMap();
    this.clearHeaderCountdown();
    template = this._mainTemplate();
    $('#content').append(template);
    $('#container').addClass("final-results");
    return window.AAL.playerController.bindForm();
  };

  Router.prototype._post_game = function() {
    var template;
    template = this._mainTemplate();
    $('#content').append(template);
    return $('#container').addClass("promo-page");
  };

  return Router;

})();
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

this.Stopwatch = (function() {
  function Stopwatch() {
    this.startCountdown = __bind(this.startCountdown, this);
    this.clearCountdown = __bind(this.clearCountdown, this);
    var place;
    place = "holder";
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
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

this.PlayerController = (function() {
  function PlayerController() {
    this._bindEvents = __bind(this._bindEvents, this);
    this.bindForm = __bind(this.bindForm, this);
    this.server_url = window.AAL.dispatcher.url;
    this._bindEvents();
  }

  PlayerController.prototype.bindForm = function() {
    return $('#sweepstakes-submit-link').on('click', (function(_this) {
      return function() {
        var url;
        url = _this.server_url.split('/');
        url.splice(-1, 1);
        url.join('/');
        console.log("URL -> ", url);
        $.ajax({
          type: "POST",
          url: "http://" + url + "/sweepstakes",
          data: $('#sweepstakes-form').serialize(),
          dataType: "script"
        });
        return false;
      };
    })(this));
  };

  PlayerController.prototype._bindEvents = function() {
    $('.player-select').on('click', function() {
      var $item;
      $item = $(this);
      $item.css("background", 'white');
      $item.css("color", 'steelblue');
      window.AAL.dispatcher.connectWithId($item.data('player'));
      $('.player-select').off('click');
      return $('#select-wrap').remove();
    });
    return $('.disconnect').on('click', function() {
      var $item;
      window.AAL.dispatcher.disconnect();
      $item = $(this);
      return $item.css('color', 'white');
    });
  };

  return PlayerController;

})();
window.appstarter = {
  start: function() {
    window.AAL = {};
    window.AAL.map = new Map;
    window.AAL.dispatcher = new Dispatcher;
    window.AAL.router = new Router;
    window.AAL.stopwatch = new Stopwatch;
    return window.AAL.playerController = new PlayerController;
  }
};
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

//= jquery-1.10.1.min
//= handlebars
//= flexslider
//= raphael-min






;
