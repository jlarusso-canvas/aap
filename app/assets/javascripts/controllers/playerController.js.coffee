class @PlayerController
  constructor: ->
    @server_url = window.AAL.dispatcher.url
    @_bindEvents()

  bindForm: =>
    $('#decline-form-link').on 'click', =>
      window.AAL.dispatcher._currentPhase {current_phase: "post_game"}

    $('#sweepstakes-submit-link').on 'click', =>
      url = @server_url.split('/')[0]

      request = $.ajax
        type: "GET"
        url: "http://#{url}/sweepstakes"
        data: $('#sweepstakes-form').serialize()
        dataType: "script"

      $.when(request).done ->
        window.AAL.dispatcher._currentPhase {current_phase: "post_game"}


  _bindEvents: =>
    # would be nice if this didnt break ios:
    # app breaks when connecting to ws
    #
    # el = document.querySelector ".player-select"
    # el.addEventListener 'touchstart', (e) ->
    #   window.AAL.dispatcher.connectWithId $(@).data('player')
    #   el.removeEventListener 'touchstart'
    #   $('#select-wrap').remove()

    $('.player-select').on 'click', ->
      $item = $(@)
      $item.css("background", 'white')
      $item.css("color", 'steelblue')

      window.AAL.dispatcher.connectWithId $item.data('player')
      $('.player-select').off 'click'
      $('#select-wrap').remove()

    $('.disconnect').on 'click', ->
      window.AAL.dispatcher.disconnect()
      $item = $(@)
      $item.css('color', 'white')

