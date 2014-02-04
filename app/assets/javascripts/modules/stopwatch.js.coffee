class @Stopwatch
  constructor: ->
    @dispatcher = window.AAL.dispatcher.dispatcher

  startCountdown: (type) =>
    if type is "header"
      count = 9
      @$container = $('.header-countdown .seconds')
    else if type is "main"
      count = 3
      @$container = $('.main-countdown .seconds')
    else
      console.log "Error: wrong argument for startCountdown(type)"

    timer = =>
      @$container.text(count)
      if count <= 0
        clearInterval(counter)
      count -= 1

    counter = setInterval(timer, 1000)
