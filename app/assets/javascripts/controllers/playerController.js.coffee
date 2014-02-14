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

      $.ajax
        type: "POST"
        url: "http://localhost:3000/sweepstakes"  ## @server_url not working
        data: sweepstake
        complete: ->
          $('#sweep-form').hide()
          $('.top-message h3').hide()
          $('.top-message h1').text('Thank you for entering!').addClass("thank-you")
          $('.top-message p').hide()

    $('.no-thanks').on 'click', (e) ->
      e.preventDefault()
      $('#sweep-form').hide()
      $('.top-message h3').hide()
      $('.top-message h1').text('Thank you for playing!').addClass("thank-you")
      $('.top-message p').hide()