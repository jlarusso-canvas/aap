module.exports = (grunt) ->
  grunt.loadNpmTasks('grunt-exec')

  grunt.initConfig(
    exec:
      build:
        command: 'cd aap-ipad && cordova build'
  )



  grunt.registerTask 'default', 'exec:build'
