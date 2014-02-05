var $doc = $(document);
if (typeof(AA) == 'undefined') AA = {}
AA = (function(){
  // Private

  return {
    render_small_state: function(paper_width, paper_height, el){
      paper_width = (paper_width) ? paper_width : 140;
      paper_height = (paper_height) ? paper_height : 140;
      if (el) {
        var state_container = $(el)
      }
      else {
        var state_container = $(AA.$doc.find('.small-state-image')[0])
      }
      var state = state_container.attr('data-state');
      var paper = new Raphael(state_container[0].id, paper_width, paper_height);

      var path = paper.path(AA.map_svg[state]).attr({
        "fill": "#87972f",
        "stroke": "#484c2c",
        "stroke-opacity": "1",
        "stroke-linejoin": "round",
        "stroke-miterlimit": "4",
        "stroke-width": "1",
        "stroke-dasharray": "none"
      });
      var path_texture = paper.path(AA.map_svg[state]).attr({
        "fill": "url(/img/state_texture.png)",
        "stroke-width": 0
      });

      var scale_string = AA.RaphaelHelpers.get_scale_to_fit_string(paper, path, 0, paper_width, paper_height);

      AA.RaphaelHelpers.translate_to_center(paper, path, false, scale_string);
      AA.RaphaelHelpers.translate_to_center(paper, path_texture, false, scale_string);
    },

    create_pre_game_slider: function() {
      console.log('pre game slider starts')
      $doc.find('.pre-game-slides').flexslider({
        animation: 'slide',
        slideshow: false,
        selector: '.slides > li',
        itemWidth: 1000,
        directionNav: false,
        start: function(){
          $doc.find('.pre-game-slides').fadeIn(500);

          // Make sure background is resized to accomodate for area occupied
          // by the slider.
          $(window).trigger('resize');
        }
      })
    }
  }
})();
