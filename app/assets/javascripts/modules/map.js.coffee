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
    @choices = window.AAL.router.current_question.choices

    $.each @map_data, (index, state) =>
      # Build each state as a path object
      # FYI you also have access to:
      # state.name => "North Carolina"
      # state.abbreviation => "NC"
      path = @paper.path(state.path_data)
      path.attr @path_attrs
      path[0].setAttribute "data-id", state.id

      # Override default attributes
      if state.id in @choices
        path.attr
          fill: "#ef8301"
        @_makeClickable(path)

  _makeClickable: (element) =>
    id = element[0].getAttribute('data-id')
    element.click ->
      $('.submit').attr 'answer_index', id

      # TODO: tell player to select a valid state
