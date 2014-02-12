module.exports = (grunt) ->
  grunt.loadNpmTasks('grunt-contrib');
  grunt.loadNpmTasks('grunt-exec')

  grunt.initConfig(
    concat:
      dist:
        src: [
          'vendor/assets/javascripts/jquery-1.10.1.min.js'
          'vendor/assets/javascripts/handlebars.js'
          'vendor/assets/javascripts/raphael-min.js'
          'vendor/assets/javascripts/flexslider.js'
          'aap-ipad/www/js/compiled_app.js'
        ]
        dest: 'aap-ipad/www/js/aerialamericaplayer.js'
    coffee:
      compile:
        options:
          bare:true
        files: 'aap-ipad/www/js/compiled_app.js' : [
          'vendor/assets/javascripts/websockets-rails/websocket_rails.js.coffee'
          'vendor/assets/javascripts/websockets-rails/event.coffee'
          'vendor/assets/javascripts/websockets-rails/abstract_connection.js.coffee'
          'vendor/assets/javascripts/websockets-rails/http_connection.js.coffee'
          'vendor/assets/javascripts/websockets-rails/websocket_connection.js.coffee'
          'vendor/assets/javascripts/websockets-rails/channel.js.coffee'
          'app/assets/javascripts/modules/*.coffee',
          'app/assets/javascripts/controllers/*.coffee',
          'app/assets/javascripts/*.coffee',

        ]

    copy:
      moveCss :
        files: [
          expand: true
          cwd: "public/assets/"
          src: ["*.css"]
          dest: "aap-ipad/www/css/"
          rename:(dest, src) ->
            return dest + src.replace(/(.*)/, "app.css");

        ]
      moveJs :
        files: [
          expand:true
          cwd: "public/assets/"
          src: ["*.js"]
          dest: "aap-ipad/www/js/"
          rename:(dest,src) ->
            return dest + src.replace(/(.*)/,"app.js")
        ]


    # Exec commands for building assets, building app and emulating ios
    exec:
      build_assets:
        command : 'rake assets:precompile'
      build:
        command: 'cd aap-ipad && cordova build'
      # emulate:
      #   command: 'cd aap-ipad && cordova emulate ios'
      emulate:
        command: 'cd aap-ipad/ && cordova build && open platforms/ios/Aerial.xcodeproj && cd ../'
      deleteAssetsDir :
        command: 'rm -rf public/assets'

  )


  grunt.registerTask 'build-ipad', ['coffee','concat','copy:moveCss']
  grunt.registerTask 'default', ['exec:deleteAssetsDir', 'exec:build_assets', 'build-ipad', 'exec:emulate']
