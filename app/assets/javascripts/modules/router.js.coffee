class @Router
  constructor: ->
    @clearHeaderCountdown()
    @user_type = "player"
    @host = "192.168.72.112"
    @port = "3000"

    @countdown_template = HandlebarsTemplates["../templates/shared/countdown"]()

    $.when(@_fetchCurrentPhase(), @_fetchQuestion()).done (phase_json, question_json) =>
      if phase_json[2].status is 200 and question_json[2].status is 200
        @current_phase = phase_json[0].current_phase
        @current_question = question_json[0]

        @clearContent()
        @loadCurrentTemplate()

        $.post "#{host}:#{port}/log/client_connect", { phase: @current_phase, question: @current_question, client_type: @user_type }


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
  _fetchQuestion: ->
    $.get "#{host}:#{port}/screen/question", (json) ->
      json


  _fetchWinners: ->
    $.get "#{host}:#{port}/screen/winners", (json) ->
      json


  _fetchCurrentPhase: ->
    $.get "#{host}:#{port}/screen/current_phase", (json) ->
      json


  _mainTemplate: (json) ->
    HandlebarsTemplates["../templates/#{@user_type}/#{@current_phase}"](json)


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
    template = @_mainTemplate(@current_question)
    @clearHeaderCountdown()
    $('#header').append(@countdown_template)
    $('#content').append(template)
    window.AAL.stopwatch.startCountdown('header')


  # Phase 3
  _round_results: ->
    console.log @current_question
    template = @_mainTemplate(@current_question)
    $('#content').append(template)


  # Phase 4
  _final_results: ->
    @clearHeaderCountdown()
    $.when(@_fetchWinners()).done (json) =>
      template = @_mainTemplate(json)
      $('#content').append(template)
