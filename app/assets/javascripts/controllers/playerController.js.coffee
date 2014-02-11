class @PlayerController
  constructor: ->
    @dispatcher = window.AAL.dispatcher.dispatcher
    @server_url = "192.168.1.34"
    @_bindEvents()

  _bindEvents: =>
    $('#sweepstakes-submit').on 'click', (e) ->
      e.preventDefault()

      form_data = $('#sweep-input').serialize()
      console.log form_data

      # $.post "#{@server_url}/sweepstakes", form_data
