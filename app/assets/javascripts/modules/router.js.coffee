class @Router
  constructor: ->
    @clearHeaderCountdown()
    @user_type = "player"

    @countdown_template = Handlebars.compile($('#countdown').html())()
    @wait_template = Handlebars.compile($('#wait').html())()
    @map_template = Handlebars.compile($('#map').html())()

  #############################################################################
  # Public
  #############################################################################
  loadCurrentTemplate: ->
    @["_#{@current_phase}"]()


  clearContent: ->
    $('#content').empty()


  clearMap: ->
    $('svg').remove()
    $('#map').remove()


  clearHeaderCountdown: ->
    $('.header-countdown').remove()

  clearAnswer: ->
    @answer_data = null

  # Load map template and create the map
  createMap: ->
    $('.map-content').append(@map_template)
    window.AAL.map.buildMap()

  staticMap: ->
    $('.map-content').append(@map_template)
    window.AAL.map.staticMap()


  attachSubmitEvent: ->
    $('.submit').on 'click', ->
      $(@).addClass('green')
      answer_choice = parseInt $(@).attr('answer_choice')
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
            has_answer: true
            choice_id: answer_choice

          params =
            device_uuid: window.AAL.dispatcher.uuid

          window.AAL.dispatcher.dispatcher.trigger "send_answer", params

        else
          window.AAL.router.answer_data =
            answer_is_correct: false
            answer_class: "is-incorrect"
            exclamation: "Incorrect!"
            choice_name: choice_name
            has_answer: true
            choice_id: answer_choice

      else
        # TODO: tell player to select a valid state


  #############################################################################
  # Private
  #############################################################################


  _mainTemplate: (json) ->
    template = Handlebars.compile $("##{@current_phase}").html()
    template(json)

  #############################################################################
  # Game Phases
  #############################################################################

  # Phase 0
  _pre_game: ->
    @clearHeaderCountdown()
    # window.AAL.pre_game_slider.create_pre_game_slider()
    template = @_mainTemplate()
    $('#content').append(template)
    $(".pre-game-slides").flexslider
      animation: "slide"
      slideshow: false
      selector: ".slides > li"
      itemWidth: 1000
      directionNav: false
      start: ->
        $(window).trigger "resize"

  # Phase 1
  _game_start: ->
    template = @_mainTemplate()
    $('#content').append(template)
    window.AAL.stopwatch.startCountdown('main')

  # Phase 2
  _question: ->
    @clearAnswer()
    @clearMap()
    @clearHeaderCountdown()

    if @current_question
      template = @_mainTemplate(@current_question)
      $('#header').append(@countdown_template)
      window.AAL.stopwatch.startCountdown('header')
    else
      template = @wait_template
    $('#content').append(template)

    if window.AAL.map.map_data
      @createMap()
      @attachSubmitEvent()



  # Phase 3
  _round_results: ->
    @clearMap()
    if @current_question
      @answer_data = {has_answer: false} unless @answer_data
      updated_question = $.extend(@current_question, @answer_data)
      template = @_mainTemplate(updated_question)
    else
      template = @wait_template

    $('#content').append(template)
    if window.AAL.map.map_data
      @staticMap()


  # Phase 4
  _final_results: ->
    @clearMap()
    @clearHeaderCountdown()
    template = @_mainTemplate()
    $('#content').append(template)
    $('#container').addClass("final-results")
    window.AAL.playerController.bindForm()

  # Phase 5
  _post_game: ->
    template = @_mainTemplate()
    $('#content').append(template)
    $('#container').addClass("promo-page")
