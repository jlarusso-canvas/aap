class @PlayerController
  constructor: ->
    @dispatcher = window.AAL.dispatcher.dispatcher
    # @server_url = "192.168.1.34"
    @server_url = "http://localhost:3000"
    @_bindEvents()

  _bindEvents: =>
    $('#sweepstakes-submit').on 'click', (e) ->
      e.preventDefault()

      sweepstake = $('#sweep-input').serialize()

      # $.post "#{@server_url}/sweepstakes", form_data
      $.ajax
        type: "POST"
        url: "http://localhost:3000/sweepstakes"  ## @server_url not working
        data: sweepstake

  # validateForm = ->
  # x = document.forms["myForm"]["fname"].value
  # if not x? or x is ""
  #   alert "First name must be filled out"
  #   false
