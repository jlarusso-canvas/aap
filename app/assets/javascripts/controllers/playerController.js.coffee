class @PlayerController
  constructor: ->
    @dispatcher = window.AAL.dispatcher.dispatcher
    @_bindEvents()

  _bindEvents: =>
    $('.state').on 'click', ->
      # unhighlight all states
      # highlight 'this'
      # use jquery to update the dom "youve selected north carolina blah blah"

    $('#pick').on 'click', ->
      # get state_id from the highlighted state
      #   compare that to the answer_id in the question json
      # if correct, set attribute on the player client's router to 'is_correct'








    # Tell the server you want to play again


    # Submit contact info to the server for raffle
