class @Map
  constructor: ->
    @path_attrs =
      fill: "#d3d3d3"
      stroke: "#fff"
      "stroke-opacity": "1"
      "stroke-linejoin": "round"
      "stroke-miterlimit": "4"
      "stroke-width": "0.75"
      "stroke-dasharray": "none"

  buildMap: (map_data) =>
    console.log "Building map"
    @paper = Raphael("map", 900, 700)

    $.each @map_data, (index, state) =>
      path = @paper.path(state.path_data)
      path.attr @path_attrs
      path.attr
        fill: "#ef8301"
      path[0].setAttribute "data-id", state.id
      console.log path
      debugger
      # state.id
      # state.abbreviation

      path.data("identifier": state.id)
      @attachEvents(path)

  attachEvents: (element) =>
    element.click ->
      $('.submit').attr 'answer_index', @data('identifier')
