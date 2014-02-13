if (typeof(AA) == 'undefined') AA = {}
AA.RaphaelHelpers = (function(){
  return {
    translate_to_center: function(paper, path, time, scale_string, cb){
      var cx = paper.width / 2;
      var cy = paper.height / 2;

      var path_box = path.getBBox();
      var path_cx = (path_box.x2 - path_box.x) + path_box.x;
      var path_cy = (path_box.y2 - path_box.y) + path_box.y;

      var tcx = (cx - path_cx) + ((path_box.x2 - path_box.x) / 2);
      var tcy = (cy - path_cy) + ((path_box.y2 - path_box.y) / 2);
      var t_string = 'T' + tcx + ' ' + tcy

      if (scale_string) {
        t_string = t_string + ', ' + scale_string;
      }

      path.animate({
        transform: t_string
      }, time, '<>', function(){
        if (cb) cb();
      });
    },
    get_scale_to_fit_string: function(paper, path, scale_adjustment, width, height) {
      var paper_width = (width) ? width : paper.width;
      var paper_height = (height) ? height : paper.height;
      var path_box = path.getBBox();
      var path_width = path_box.width;
      var path_height = path_box.y2 - path_box.y;
      var scale_size;

      if (path_width > path_height) {
        scale_size = paper_width / path_width;
      }
      else {
        scale_size = paper_height / path_height;
      }

      return 'S' + (scale_size + scale_adjustment);
    },
    reset_path: function(path, time, cb) {
      path.animate({
        transform: 'T0 0, S1 1'
      }, time, '<>', function(){
        if (cb) cb();
      });
    }

  }

})();
