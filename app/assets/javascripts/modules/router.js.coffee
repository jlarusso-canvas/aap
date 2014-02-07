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
      answer_choice = $(@).attr('answer_choice')
      choice_name = $(@).attr('choice_name')

      if answer_choice
        answer_index = window.AAL.router.current_question.answer_index

        # It's wrong to validate the answer on the client side, but I wanted
        # to avoid a potential break point by making an extra request.

        answer_is_correct = answer_choice is answer_index
        if answer_is_correct
          window.AAL.router.answer_data =
            answer_is_correct: true
            answer_class: "is-correct"
            exclamation: "Correct!"
            choice_name: choice_name
        else
          window.AAL.router.answer_data =
            answer_is_correct: false
            answer_class: "is-incorrect"
            exclamation: "Incorrect!"
            choice_name: choice_name

        params =
          #TODO: make device uuid dynamic
          device_uuid: 2
          answer_is_correct: answer_is_correct

        window.AAL.dispatcher.dispatcher.trigger "send_answer", params
      else
        # TODO: tell player to select a valid state


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
    if @current_question and @answer_data
      updated_question = $.extend(@current_question, @answer_data)
      template = @_mainTemplate(updated_question)
    else
      template = @wait_template

    $('#content').append(template)

    if @answer_is_correct
      #do some jquery stuff to insert text/classes/data
      $('.answer-text').text @current_question.correct_headline
    else
      $('.answer-text').text @current_question.incorrect_headline

      #set up for next question
      @answer_is_correct = false

  # Phase 4
  _final_results: ->
    @clearMap()
    @clearHeaderCountdown()
    template = @_mainTemplate()
    $('#content').append(template)
