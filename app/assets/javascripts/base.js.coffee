$ ->
  window.AAL = {}

  if !window.localStorage.uuid
    uuid = Math.floor(Math.random() * 10000000000000001)
    window.localStorage.uuid = uuid

  window.AAL.pre_game_slider = new PreGameSlider
  window.AAL.map = new Map
  window.AAL.dispatcher = new Dispatcher window.localStorage.uuid
  window.AAL.router = new Router
  window.AAL.stopwatch = new Stopwatch
  window.AAL.playerController = new PlayerController
