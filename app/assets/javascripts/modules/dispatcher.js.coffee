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
    window.AAL.router.current_question = @_unSerialize message['current_question']
    console.log "Player client got current question: ", window.AAL.router.current_question

  _currentPhase: (message) =>
    @current_phase = message['current_phase']
    window.AAL.router.current_phase = @current_phase
    window.AAL.router.clearContent()
    window.AAL.router.loadCurrentTemplate()
    console.log "Player client got current phase: ", @current_phase

  _unSerialize: (question) =>
    choice_ary = question.choices.split(",")
    question.choices = $.map choice_ary, (id) ->
      parseInt id
    question
