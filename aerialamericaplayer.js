/*
The Event object stores all the relevant event information.
*/

WebSocketRails.Event = (function() {
  function Event(data, success_callback, failure_callback) {
    var attr;
    this.success_callback = success_callback;
    this.failure_callback = failure_callback;
    this.name = data[0];
    attr = data[1];
    if (attr != null) {
      this.id = attr['id'] != null ? attr['id'] : ((1 + Math.random()) * 0x10000) | 0;
      this.channel = attr.channel != null ? attr.channel : void 0;
      this.data = attr.data != null ? attr.data : attr;
      this.token = attr.token != null ? attr.token : void 0;
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
    return typeof this.result !== 'undefined';
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
      data: this.data,
      token: this.token
    };
  };

  Event.prototype.run_callbacks = function(success, result) {
    this.success = success;
    this.result = result;
    if (this.success === true) {
      return typeof this.success_callback === "function" ? this.success_callback(this.result) : void 0;
    } else {
      return typeof this.failure_callback === "function" ? this.failure_callback(this.result) : void 0;
    }
  };

  return Event;

})();

/*
 Abstract Interface for the WebSocketRails client.
*/

WebSocketRails.AbstractConnection = (function() {
  function AbstractConnection(url, dispatcher) {
    this.dispatcher = dispatcher;
    this.message_queue = [];
  }

  AbstractConnection.prototype.close = function() {};

  AbstractConnection.prototype.trigger = function(event) {
    if (this.dispatcher.state !== 'connected') {
      return this.message_queue.push(event);
    } else {
      return this.send_event(event);
    }
  };

  AbstractConnection.prototype.send_event = function(event) {
    if (this.connection_id != null) {
      return event.connection_id = this.connection_id;
    }
  };

  AbstractConnection.prototype.on_close = function(event) {
    var close_event;
    if (this.dispatcher && this.dispatcher._conn === this) {
      close_event = new WebSocketRails.Event(['connection_closed', event]);
      this.dispatcher.state = 'disconnected';
      return this.dispatcher.dispatch(close_event);
    }
  };

  AbstractConnection.prototype.on_error = function(event) {
    var error_event;
    if (this.dispatcher && this.dispatcher._conn === this) {
      error_event = new WebSocketRails.Event(['connection_error', event]);
      this.dispatcher.state = 'disconnected';
      return this.dispatcher.dispatch(error_event);
    }
  };

  AbstractConnection.prototype.on_message = function(event_data) {
    if (this.dispatcher && this.dispatcher._conn === this) {
      return this.dispatcher.new_message(event_data);
    }
  };

  AbstractConnection.prototype.setConnectionId = function(connection_id) {
    this.connection_id = connection_id;
  };

  AbstractConnection.prototype.flush_queue = function() {
    var event, _i, _len, _ref;
    _ref = this.message_queue;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      event = _ref[_i];
      this.trigger(event);
    }
    return this.message_queue = [];
  };

  return AbstractConnection;

})();

/*
 HTTP Interface for the WebSocketRails client.
*/

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

WebSocketRails.HttpConnection = (function(_super) {
  __extends(HttpConnection, _super);

  HttpConnection.prototype.connection_type = 'http';

  HttpConnection.prototype._httpFactories = function() {
    return [
      function() {
        return new XDomainRequest();
      }, function() {
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

  function HttpConnection(url, dispatcher) {
    var e,
      _this = this;
    this.dispatcher = dispatcher;
    HttpConnection.__super__.constructor.apply(this, arguments);
    this._url = "http://" + url;
    this._conn = this._createXMLHttpObject();
    this.last_pos = 0;
    try {
      this._conn.onreadystatechange = function() {
        return _this._parse_stream();
      };
      this._conn.addEventListener("load", this.on_close, false);
    } catch (_error) {
      e = _error;
      this._conn.onprogress = function() {
        return _this._parse_stream();
      };
      this._conn.onload = this.on_close;
      this._conn.readyState = 3;
    }
    this._conn.open("GET", this._url, true);
    this._conn.send();
  }

  HttpConnection.prototype.close = function() {
    return this._conn.abort();
  };

  HttpConnection.prototype.send_event = function(event) {
    HttpConnection.__super__.send_event.apply(this, arguments);
    return this._post_data(event.serialize());
  };

  HttpConnection.prototype._post_data = function(payload) {
    return $.ajax(this._url, {
      type: 'POST',
      data: {
        client_id: this.connection_id,
        data: payload
      },
      success: function() {}
    });
  };

  HttpConnection.prototype._createXMLHttpObject = function() {
    var e, factories, factory, xmlhttp, _i, _len;
    xmlhttp = false;
    factories = this._httpFactories();
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

  HttpConnection.prototype._parse_stream = function() {
    var data, e, event_data;
    if (this._conn.readyState === 3) {
      data = this._conn.responseText.substring(this.last_pos);
      this.last_pos = this._conn.responseText.length;
      data = data.replace(/\]\]\[\[/g, "],[");
      try {
        event_data = JSON.parse(data);
        return this.on_message(event_data);
      } catch (_error) {
        e = _error;
      }
    }
  };

  return HttpConnection;

})(WebSocketRails.AbstractConnection);

/*
WebSocket Interface for the WebSocketRails client.
*/

var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

WebSocketRails.WebSocketConnection = (function(_super) {
  __extends(WebSocketConnection, _super);

  WebSocketConnection.prototype.connection_type = 'websocket';

  function WebSocketConnection(url, dispatcher) {
    var _this = this;
    this.url = url;
    this.dispatcher = dispatcher;
    WebSocketConnection.__super__.constructor.apply(this, arguments);
    if (this.url.match(/^wss?:\/\//)) {
      console.log("WARNING: Using connection urls with protocol specified is depricated");
    } else if (window.location.protocol === 'https:') {
      this.url = "wss://" + this.url;
    } else {
      this.url = "ws://" + this.url;
    }
    this._conn = new WebSocket(this.url);
    this._conn.onmessage = function(event) {
      var event_data;
      event_data = JSON.parse(event.data);
      return _this.on_message(event_data);
    };
    this._conn.onclose = function(event) {
      return _this.on_close(event);
    };
    this._conn.onerror = function(event) {
      return _this.on_error(event);
    };
  }

  WebSocketConnection.prototype.close = function() {
    return this._conn.close();
  };

  WebSocketConnection.prototype.send_event = function(event) {
    WebSocketConnection.__super__.send_event.apply(this, arguments);
    return this._conn.send(event.serialize());
  };

  return WebSocketConnection;

})(WebSocketRails.AbstractConnection);

/*
The channel object is returned when you subscribe to a channel.

For instance:
  var dispatcher = new WebSocketRails('localhost:3000/websocket');
  var awesome_channel = dispatcher.subscribe('awesome_channel');
  awesome_channel.bind('event', function(data) { console.log('channel event!'); });
  awesome_channel.trigger('awesome_event', awesome_object);
*/

var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

WebSocketRails.Channel = (function() {
  function Channel(name, _dispatcher, is_private, on_success, on_failure) {
    var event, event_name, _ref;
    this.name = name;
    this._dispatcher = _dispatcher;
    this.is_private = is_private != null ? is_private : false;
    this.on_success = on_success;
    this.on_failure = on_failure;
    this._failure_launcher = __bind(this._failure_launcher, this);
    this._success_launcher = __bind(this._success_launcher, this);
    this._callbacks = {};
    this._token = void 0;
    this._queue = [];
    if (this.is_private) {
      event_name = 'websocket_rails.subscribe_private';
    } else {
      event_name = 'websocket_rails.subscribe';
    }
    this.connection_id = (_ref = this._dispatcher._conn) != null ? _ref.connection_id : void 0;
    event = new WebSocketRails.Event([
      event_name, {
        data: {
          channel: this.name
        }
      }, this.connection_id
    ], this._success_launcher, this._failure_launcher);
    this._dispatcher.trigger_event(event);
  }

  Channel.prototype.destroy = function() {
    var event, event_name, _ref;
    if (this.connection_id === ((_ref = this._dispatcher._conn) != null ? _ref.connection_id : void 0)) {
      event_name = 'websocket_rails.unsubscribe';
      event = new WebSocketRails.Event([
        event_name, {
          data: {
            channel: this.name
          }
        }, this.connection_id
      ]);
      this._dispatcher.trigger_event(event);
    }
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
        data: message,
        token: this._token
      }, this.connection_id
    ]);
    if (!this._token) {
      return this._queue.push(event);
    } else {
      return this._dispatcher.trigger_event(event);
    }
  };

  Channel.prototype.dispatch = function(event_name, message) {
    var callback, _i, _len, _ref, _ref1, _results;
    if (event_name === 'websocket_rails.channel_token') {
      this.connection_id = (_ref = this._dispatcher._conn) != null ? _ref.connection_id : void 0;
      this._token = message['token'];
      return this.flush_queue();
    } else {
      if (this._callbacks[event_name] == null) {
        return;
      }
      _ref1 = this._callbacks[event_name];
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        callback = _ref1[_i];
        _results.push(callback(message));
      }
      return _results;
    }
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

  Channel.prototype.flush_queue = function() {
    var event, _i, _len, _ref;
    _ref = this._queue;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      event = _ref[_i];
      this._dispatcher.trigger_event(event);
    }
    return this._queue = [];
  };

  return Channel;

})();

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
    var _this = this;
    this.paper = Raphael("map", 900, 700);
    this.choices = window.AAL.router.current_question.choices;
    return $.each(this.map_data, function(index, state) {
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
    });
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
      $submit.attr('answer_choice', parseInt(id).attr('choice_name', name.addClass("is-active")));
      return $("#js-selected-state").html("You Selected: " + "<strong>" + name + "</strong>");
    });
  };

  return Map;

})();

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
    var count, counter, timer,
      _this = this;
    this.counting = true;
    if (type === "header") {
      count = 9;
      this.$container = $('.header-countdown .seconds');
    } else if (type === "main") {
      count = 3;
      this.$container = $('.main-countdown .seconds');
    }
    timer = function() {
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
    return counter = setInterval(timer, 1000);
  };

  return Stopwatch;

})();

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