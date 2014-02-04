$ ->
  window.AAL = {}
  window.AAL.dispatcher = new Dispatcher $('#socket').data('uri'), true
  window.AAL.router = new Router
  window.AAL.stopwatch = new Stopwatch
  window.AAL.playerController = new PlayerController
