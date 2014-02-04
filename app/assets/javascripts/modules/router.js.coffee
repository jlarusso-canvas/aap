class @Router
  constructor: ->
    @clearHeaderCountdown()
    @user_type = "player"

    @countdown_template = HandlebarsTemplates["shared/countdown"]()


    # Make socket -> $.post "#{host}:#{port}/log/client_connect", { phase: @current_phase, question: @current_question, client_type: @user_type }


  #############################################################################
  # Public
  #############################################################################
  loadCurrentTemplate: ->
    @["_#{@current_phase}"]()


  clearContent: ->
    $('#content').empty()


  clearHeaderCountdown: ->
    $('.header-countdown').remove()


  #############################################################################
  # Private
  #############################################################################


  _mainTemplate: (json) ->
    HandlebarsTemplates["#{@user_type}/#{@current_phase}"](json)


  #############################################################################
  # Game Phases
  #############################################################################

  # Phase 0
  _pre_game: ->
    @clearHeaderCountdown()
    console.log "rendering pregame template", @current_phase
    template = @_mainTemplate()
    $('#content').append(template)


  # Phase 1
  _game_start: ->
    console.log "rendering gamestart template", @current_phase
    template = @_mainTemplate()
    $('#content').append(template)
    window.AAL.stopwatch.startCountdown('main')


  # Phase 2
  _question: ->
    console.log "rendering question template", @current_phase
    @clearHeaderCountdown()

    if @current_question
      template = @_mainTemplate(@current_question)
      $('#header').append(@countdown_template)
    else
      template = @_waitTemplate()

    $('#content').append(template)
    window.AAL.stopwatch.startCountdown('header')


  # Phase 3
  _round_results: ->
    console.log @current_question

    if @current_question
      template = @_mainTemplate(@current_question)
    else
      template = @_waitTemplate()

    $('#content').append(template)


  # Phase 4
  _final_results: ->
    @clearHeaderCountdown()
    template = @_mainTemplate()
    $('#content').append(template)
