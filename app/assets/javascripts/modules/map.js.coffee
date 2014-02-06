class @Map
  constructor: ->
    # $.when($.getJSON('states.json')).then (json) ->
    #   @map_svg = json
    #   console.log @map_svg
    @$map = $('#map')
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
    @paper = Raphael("map", 1000, 900)

    $.each @map_data, (index, state) =>
      path = @paper.path(state.path_data)
      path.attr(@path_attrs)
      debugger
      # state.id
      # state.abbreviation

 # svg data should go in rails database then reveal as full object to client
 # get raphael library referenced
 # create and append path objects with correct properties
 # bind events to the path objects





