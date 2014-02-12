window.appstarter =

  # initialize: () ->
  #     this.bindEvents();

  # # Bind Event Listeners
  # #
  # # Bind any events that are required on startup. Common events are:
  # # 'load', 'deviceready', 'offline', and 'online'.
  # bindEvents: () ->
  #     document.addEventListener('deviceready', this.receivedEvent, false)

  # Update DOM on a Received Event
  start: ->
    window.AAL = {}
    window.AAL.map = new Map
    # window.AAL.pre_game_slider = new PreGameSlider
    window.AAL.dispatcher = new Dispatcher device.uuid
    window.AAL.router = new Router
    window.AAL.stopwatch = new Stopwatch
    window.AAL.playerController = new PlayerController
