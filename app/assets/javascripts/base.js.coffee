$ ->
  window.AAL = {}
  window.AAL.pre_game_slider = new PreGameSlider
  window.AAL.map = new Map
  window.AAL.device_uid || window.AAL.device_uid = null
  window.AAL.dispatcher = new Dispatcher window.AAL.device_uid
  window.AAL.router = new Router
  window.AAL.stopwatch = new Stopwatch
  window.AAL.playerController = new PlayerController
