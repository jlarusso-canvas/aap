class @PlayerController
  constructor: ->
    @dispatcher = window.AAL.dispatcher.dispatcher
    @_bindEvents()

  _bindEvents: =>
    $('.state').on 'click', ->
      # unhighlight all states
      # highlight 'this'
      # use jquery to update the dom "youve selected north carolina blah blah"


    $('#pick').hide()
    $('#pick').on 'click', =>
      # get state_id from the highlighted state

      device_uuid = window.AAL.dispatcher.device_uuid

      if device_uuid
        params =
          device_uuid: device_uuid
          question_id: 94
          answer_index: 18

        @dispatcher.trigger "send_answer", params
      else
        console.log "ERROR: window.AAL.dispatcher.device_uuid not found."



    # Submit contact info to the server for raffle
