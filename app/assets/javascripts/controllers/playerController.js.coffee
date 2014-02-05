class @PlayerController
  constructor: ->
    @dispatcher = window.AAL.dispatcher.dispatcher
    @_bindEvents()

  _bindEvents: =>
    $('.state').on 'click', ->
      # unhighlight all states
      # highlight 'this'
      # use jquery to update the dom "youve selected north carolina blah blah"


    $('#pick').on 'click', =>
      # get state_id from the highlighted state

      client_id = window.AAL.dispatcher.client_id

      if client_id
        answer =
          client_id: client_id
          question_id: 94
          answer_index: 18

        @dispatcher.trigger "send_answer", answer
      else
        console.log "ERROR: window.AAL.dispatcher.client_id not found."





    # Tell the server you want to play again


    # Submit contact info to the server for raffle
