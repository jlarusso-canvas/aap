class @Router
  constructor: ->
    @clearHeaderCountdown()
    @user_type = "player"

    @countdown_template = HandlebarsTemplates["shared/countdown"]()
    @wait_template = HandlebarsTemplates["player/wait"]()
    @map_template = HandlebarsTemplates["player/map"]()


    # Make socket -> $.post "#{host}:#{port}/log/client_connect", { phase: @current_phase, question: @current_question, client_type: @user_type }


  #############################################################################
  # Public
  #############################################################################
  loadCurrentTemplate: ->
    @["_#{@current_phase}"]()


  clearContent: ->
    $('#content').empty()

  clearMap: ->
    $('#map').remove()

  clearHeaderCountdown: ->
    $('.header-countdown').remove()


  # Load map template and create the map
  createMap: ->
    $('#container').append(@map_template)
    window.AAL.map.buildMap()


  attachSubmitEvent: ->
    $('.submit').on 'click', ->
      params =
        client_id: 2
        question_id: 10
        answer_index: $(@).attr('answer_index')

      window.AAL.dispatcher.dispatcher.trigger "send_answer", params

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
    @clearMap()
    @clearHeaderCountdown()


    if @current_question
      template = @_mainTemplate(@current_question)
      $('#header').append(@countdown_template)
    else
      template = @wait_template
    $('#content').append(template)

    if window.AAL.map.map_data
      @createMap()
      @attachSubmitEvent()

    window.AAL.stopwatch.startCountdown('header')


  # Phase 3
  _round_results: ->
    if @current_question
      template = @_mainTemplate(@current_question)
    else
      template = @wait_template

    $('#content').append(template)

    if @is_correct
      #do some jquery stuff to insert text/classes/data
      @is_correct = null

  # Phase 4
  _final_results: ->
    @clearMap()
    @clearHeaderCountdown()
    template = @_mainTemplate()
    $('#content').append(template)
