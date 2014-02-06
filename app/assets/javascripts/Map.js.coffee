# # map

# # 1. read the map.svg.js file
# # 2. create path objects
# # 3. make sure each path object has a state_id
# # 3. append path object to dom (with default styles)
# # 4. attach event handlers to states
# # 5.
window.onload = ->
  w = 900
  h = 700
  R = Raphael("map")
  R.setViewBox(0, 0, w, h, true)
  attr =
    fill: "#d3d3d3"
    stroke: "#fff"
    "stroke-opacity": "1"
    "stroke-linejoin": "round"
    "stroke-miterlimit": "4"
    "stroke-width": "0.75"
    "stroke-dasharray": "none"

  usRaphael = {}
  translate_to_center = (r, time, scale_string) ->
    cx = R.width / 2
    cy = R.height / 2
    r_box = r.getBBox()
    rcx = (r_box.x2 - r_box.x) + r_box.x
    rcy = (r_box.y2 - r_box.y) + r_box.y
    tcx = (cx - rcx) + ((r_box.x2 - r_box.x) / 2)
    tcy = (cy - rcy) + ((r_box.y2 - r_box.y) / 2)
    t_string = "T" + tcx + " " + tcy
    t_string = t_string + ", " + scale_string  if scale_string
    r.animate
      transform: t_string
    , time, "<>"
    return

  get_scale_to_fit_string = (r) ->
    pw = R.width
    rw = r.getBBox().width
    scale_size = (pw / rw)
    "S" + scale_size

  reset_state = (r, time) ->
    r.animate
      transform: "T0 0, S1 1"
    , time, "<>"
    return


  #Draw Map and store Raphael paths
  animate_in_map = ->
    for state of AA.map_svg
      usRaphael[state] = R.path(AA.map_svg[state]).attr(attr).attr("transform", "S0 0")
    state_arr = []
    for state of AA.map_svg
      state_arr.push usRaphael[state]

    # Randomize the state order
    state_arr.sort ->
      0.5 - Math.random()

    i = 0
    setInterval (->
      return false  unless state_arr[i]
      reset_state state_arr[i], 500
      i++
      return
    ), 5
    return

  # Animate the map rendoring
  animate_in_map()

  #Do Work on Map
  for state of usRaphael
    usRaphael[state].color = Raphael.getColor()

    # console.log(state);
    # $state.data('state', state);
    ((st, state) ->
      st[0].style.cursor = "pointer"
      st[0].setAttribute "data-state", state
      st[0].onmouseover = ->
        st.animate
          fill: st.color
        , 500
        st.toFront()
        R.safari()
        return

      st[0].onmouseout = ->
        st.animate
          fill: "#d3d3d3"
        , 500
        st.toFront()
        R.safari()
        return

      $state = $(st[0])
      $this = $(this)
      $state.on "click", ->
        answer = $this.data("state")
        console.log $(this).data("state")
        return

      return
    ) usRaphael[state], state
  return