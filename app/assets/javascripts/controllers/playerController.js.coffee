class @PlayerController
  constructor: ->
    @server_url = window.AAL.dispatcher.url
    @_bindEvents()

  bindForm: =>
    $('#sweepstakes-submit-link').on 'click', (e) ->
      e.preventDefault()
      params = {}
      $('#sweepstakes-form input').each ->
        # params["first_name"] = "jesse"
        params[$(@).attr('id')] = $(@).val()
      console.log params


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

    # $('#sweepstakes-submit').on 'click', (e) ->
    #   e.preventDefault()

    #   form_data = $('#sweep-input').serialize()
    #   console.log form_data

    # $.post "#{@server_url}/sweepstakes", form_data
