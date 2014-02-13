class @Stopwatch
  constructor: ->
    @dispatcher = window.AAL.dispatcher.dispatcher

  clearCountdown: =>
    if @counting
      @break = true

  startCountdown: (type) =>
    @counting = true
    if type is "header"
      count = 9
      @$container = $('.header-countdown .seconds')
    else if type is "main"
      count = 1
      @$container = $('.main-countdown .seconds')

    timer = =>
      if @break
        clearInterval(counter)
        @counting = null
        @break = null
      else
        @$container.text(":0" + count)
        if count <= 0
          clearInterval(counter)
          @counting = null
        count -= 1

    counter = setInterval(timer, 1000)
