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
      path[0].setAttribute "data-name", state.name
      # debugger

      # Override default attributes
      if state.id in @choices
        path[0].setAttribute "class", "is-choice"
        path.attr
          fill: "#87a347"
        @_makeClickable(path)

  _makeClickable: (element) =>
    id = element[0].getAttribute('data-id')
    name = element[0].getAttribute('data-name')

    element.click ->
      $(".is-choice").not(@).attr
        fill: "#87a347"
      @.attr
        fill: "#ef8301"
      $submit = $('.submit')
      $submit.attr 'answer_choice', parseInt(id)
             .attr 'choice_name', name
             .addClass("is-active")
      $("#js-selected-state").html("You Selected: " + "<strong>" + name + "</strong>")
