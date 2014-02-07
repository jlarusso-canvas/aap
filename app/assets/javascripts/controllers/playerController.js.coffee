class @PlayerController
  constructor: ->
    @dispatcher = window.AAL.dispatcher.dispatcher
    @_bindEvents()

  _bindEvents: =>
    $('.state').on 'click', ->
      # unhighlight all states
      # highlight 'this'
      # use jquery to update the dom "youve selected north carolina blah blah"

    # Submit contact info to the server for raffle
