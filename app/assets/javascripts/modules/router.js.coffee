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
      console.log "answer choice: " + answer_choice
      if answer_choice
        answer_index = window.AAL.router.current_question.answer_index

        console.log answer_index
        # It's wrong to validate the answer on the client side, but I wanted
        # to avoid a potential break point by making an extra request.
        answer_is_correct = parseInt(answer_choice) is answer_index
        window.AAL.router.answer_is_correct = answer_is_correct

        console.log "answer is correct: " + answer_is_correct

        params =
          #TODO: make device uuid dynamic
          device_uuid: 2
          answer_is_correct: answer_is_correct

        window.AAL.dispatcher.dispatcher.trigger "send_answer", params
        debugger
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
    if @current_question
      if @answer_is_correct
        answer_class = "is-correct"
        exclamation = "Correct!"
      else
        answer_class = "is-incorrect"
        exclamation = "Incorrect!"

      extend_object =
        answer_is_correct: @answer_is_correct
        answer_class: answer_class
        exclamation: exclamation

      updated_question = $.extend(@current_question, extend_object)


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
