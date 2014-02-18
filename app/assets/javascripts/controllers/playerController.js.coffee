class @PlayerController
  constructor: ->
    @server_url = window.AAL.dispatcher.url
    @_bindEvents()

  bindForm: =>
    $('#sweepstakes-submit-link').on 'click', =>
      url = @server_url.split('/')
      url.splice(-1, 1)
      url.join('/')

      console.log "URL -> ", url
      $.ajax
        type: "POST"
        url: "http://#{url}/sweepstakes"
        data: $('#sweepstakes-form').serialize()
        dataType: "script"
      false


  _bindEvents: =>
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

