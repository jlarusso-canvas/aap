class @PlayerController
  constructor: ->
    @dispatcher = window.AAL.dispatcher.dispatcher
    @server_url = window.AAL.dispatcher.url
    @_bindEvents()

  _bindEvents: =>
    $('#sweepstakes-submit').on 'click', (e) ->
      e.preventDefault()

      form_data = $('#sweep-input').serialize()
      console.log form_data

      # $.post "#{@server_url}/sweepstakes", form_data
