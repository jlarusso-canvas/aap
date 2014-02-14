class @PreGameSlider
  constructor: ->
    place = "holder"

  # TODO: Make this work. Stuck JS directly in Pre Game template for now
  create_pre_game_slider: =>
    $(".pre-game-slides").flexslider
      animation: "slide"
      slideshow: false
      selector: ".slides > li"
      itemWidth: 1000
      directionNav: false
      start: ->
        # Make sure background is resized to accomodate for area occupied
        # by the slider.
        $(window).trigger "resize"
