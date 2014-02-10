class @Dispatcher
  constructor: (device_uuid) ->
    url = "192.168.72.112:3000/websocket"
    connection_params = "?device_uuid=#{device_uuid}"

    # fyi, you can do queried params in websocket requests
    # we may want to do this for identifying particular clients
    @dispatcher = new WebSocketRails(url + connection_params, true)
    @_bindEvents()

    # For now, client id is stubbed by setting it in the console.
    # TODO: use an identifier from model number of device and send it
    # to the server during the initial websocket connection (as queried param)
    # The server will use this to allocate the proper score to the proper client.


  #############################################################################
  # Private
  #############################################################################
  # Bindings receive messages from a websockets connection
  _bindEvents: =>
    @dispatcher.bind 'current_question', @_currentQuestion
    @dispatcher.bind 'current_phase', @_currentPhase
    @dispatcher.bind 'map_data', @_mapData
    @dispatcher.bind 'answer_response', @_answerResponse


  # Events execute an action when a binding is activated
  _currentQuestion: (message) =>
    window.AAL.router.current_question = @_unSerialize message['current_question']
    console.log window.AAL.router.current_question

  _currentPhase: (message) =>
    @current_phase = message['current_phase']
    window.AAL.router.current_phase = @current_phase
    window.AAL.router.clearContent()
    window.AAL.router.loadCurrentTemplate()


  _mapData: (message) =>
    window.AAL.map.map_data = message['map_data']


  _answerResponse: (message) =>
    window.AAL.router.has_correct_answer = message['is_correct']


  _unSerialize: (question) =>
    choice_ary = question.choices.split(",")
    question.choices = $.map choice_ary, (id) ->
      parseInt id
    question
