window.appstarter =

  initialize: () ->
      this.bindEvents();

  # Bind Event Listeners
  #
  # Bind any events that are required on startup. Common events are:
  # 'load', 'deviceready', 'offline', and 'online'.
  bindEvents: () ->
      document.addEventListener('deviceready', this.receivedEvent, false)

  # Update DOM on a Received Event
  receivedEvent: (id) ->
    DUUID = device.uuid
    navigator.notification.alert(DUUID)
    window.AAL.dispatcher = new Dispatcher DUUID


    data_object =
      one: "one"
      two: "two"
    pre_game_template = Handlebars.compile $('#pre_game').html()
    test = pre_game_template(data_object)
    container.append test

