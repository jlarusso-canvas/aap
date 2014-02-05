
if (typeof(AA) == 'undefined') AA = {}
AA.Map = (function(){
  // Private
  var Map = function(){
    this.canvas = this.render_map("map", 1000, 600);
    this.states = {};
    this.resize();
  };

  Map.prototype = {
    render_map: function(id, width, height){
      return new ScaleRaphael(id, width, height);
    },

    resize: function(width, height){
      //var $viewsContainer = AA.$doc.find('#views-container');
      var $viewsContainter = $(window).find('#views-container');
      var innerGameHeight = $(window).height() - $('.top').height() - $('footer').outerHeight();

      width  = width  || $viewsContainer.width();
      height = height || ($viewsContainer.height() - $('footer').outerHeight());

      this.canvas.changeSize(width, innerGameHeight, false, false);
      this.safariRepaint($viewsContainer);
    },

    // Under a certain width, the map SVG is not being repainted
    // unless we force Safari to repaint it here
    safariRepaint: function($el) {
      $el.css('display', 'inline-block');
      setTimeout(function() {
        $el.css('display', 'block');
      }, 0);
    },

    create_states: function(states_svg) {
      var _this = this;

      for (var state in states_svg) {
        _this.states[state] = new AA.State(_this.canvas, state, states_svg[state])
      }

      this.hide_states();
    },

    show_states: function() {
      var _this = this;
      var states_svg = AA.map_svg
      $('#map').animate({
        'opacity': 1
      }, 1000);
    },

    hide_states: function() {
      var _this = this;
      var states_svg = AA.map_svg
      $('#map').css({
        'opacity': 0
      });
    },

    animate_in: function(cb, no_anim){
      if (AA.low_performance || no_anim) {
        this.show_states();
        setTimeout(function(){
          cb();
        }, 0);
        return;
      }

      var states_svg = AA.map_svg
      var state_arr = []
      var _this = this;
      for (var state in states_svg) {
        state_arr.push(_this.states[state]);
      }

      // Randomize the state order
      state_arr.sort(function() {return 0.5 - Math.random()});

      var i=0;
      AA.render_iterator = 0;

      setInterval(function(){
        if (!state_arr[i]) return false;
        AA.render_iterator++;
        AA.RaphaelHelpers.reset_path(state_arr[i].raphael, 400);
        AA.RaphaelHelpers.reset_path(state_arr[i].raphael_texture, 400, function(){
          AA.render_iterator--;
          if (AA.render_iterator == 0) {
            if (cb) cb();
          }
        });
        i++;
      }, 20)

    },

    clear_active_states: function() {
      var states = this.states;
      $.each(states, function(){
        this.deactivate();
      });
    },

    activate_state: function(state){
      this.states[state].activate();
    },

    deactivate_state: function(state){
      this.states[state].deactivate();
    },

    show_correct: function(state) {
      this.states[state].show_correct();
    }
  }

  // Public
  return Map
})();
