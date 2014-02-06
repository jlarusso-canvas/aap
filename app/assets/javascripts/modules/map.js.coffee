class @Map
  constructor: ->
    # $.when($.getJSON('states.json')).then (json) ->
    #   @map_svg = json
    #   console.log @map_svg
    @$map = $('#map')

  buildMap: (map_data) ->
    console.log "building map with: ", @map_data

 # svg data should go in rails database then reveal as full object to client
 # get raphael library referenced
 # create and append path objects with correct properties
 # bind events to the path objects





