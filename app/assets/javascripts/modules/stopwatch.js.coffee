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
      count = 3
      @$container = $('.main-countdown .seconds')
    else
      console.log "Error: wrong argument for startCountdown(type)"

    timer = =>
      if @break
        clearInterval(counter)
        @counting = null
        @break = null
      else
        @$container.text(count)
        if count <= 0
          clearInterval(counter)
          @counting = null
        count -= 1

    counter = setInterval(timer, 1000)
