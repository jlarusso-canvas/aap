class @Router
  constructor: ->
    @clearHeaderCountdown()
    @user_type = "player"

    @countdown_template = HandlebarsTemplates["shared/countdown"]()
    @wait_template = HandlebarsTemplates["player/wait"]()
    @map_template = HandlebarsTemplates["player/map"]()


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
    $('.main-content').append(@map_template)
    window.AAL.map.buildMap()


  attachSubmitEvent: ->
    $('.submit').on 'click', ->
      params =
        device_uuid: 2
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
    window.AAL.pre_game_slider.create_pre_game_slider()
    template = @_mainTemplate()
    $('#content').append(template)


  # Phase 1
  _game_start: ->
    template = @_mainTemplate()
    $('#content').append(template)
    window.AAL.stopwatch.startCountdown('main')


  # Phase 2
  _question: ->
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

    if @has_correct_answer
      #do some jquery stuff to insert text/classes/data

      #set up for next question
      @has_correct_answer = false

  # Phase 4
  _final_results: ->
    @clearMap()
    @clearHeaderCountdown()
    template = @_mainTemplate()
    $('#content').append(template)
