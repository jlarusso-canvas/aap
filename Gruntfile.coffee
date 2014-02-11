module.exports = (grunt) ->
  grunt.loadNpmTasks('grunt-contrib');
  grunt.loadNpmTasks('grunt-exec')

  grunt.initConfig(

    # Exec commands for building assets, building app and emulating ios
    exec:
      build_assets:
        command : 'rake assets:precompile'
      build:
        command: 'cd aap-ipad && cordova build'
      emulate:
        command: 'cd aap-ipad && cordova emulate ios'

  )


  grunt.registerTask 'build-ipad', ['exec:build_assets']
  grunt.registerTask 'default', 'exec:build_assets'
