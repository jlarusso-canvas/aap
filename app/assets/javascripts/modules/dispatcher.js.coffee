class @Dispatcher
  constructor: (url, useWebSockets) ->
    @dispatcher = new WebSocketRails(url, useWebSockets)
    @_bindEvents()


  #############################################################################
  # Private
  #############################################################################
  # Bindings receive messages from a websockets connection
  _bindEvents: =>
    @dispatcher.bind 'current_question', @_currentQuestion
    @dispatcher.bind 'current_phase', @_currentPhase

  # Events execute an action when a binding is activated
  _currentQuestion: (message) =>
    # NOTICE: using ajax to GET question right now
    # @current_question = message['current_question']
    # console.log "Just got current question: ", @current_question

  _currentPhase: (message) =>
    @current_phase = message['current_phase']
    window.AAL.router.current_phase = @current_phase
    window.AAL.router.clearContent()
    # window.AAL.remoteController.selectPhase(@current_phase)
    window.AAL.router.loadCurrentTemplate()
    console.log "Just got current phase: ", @current_phase
