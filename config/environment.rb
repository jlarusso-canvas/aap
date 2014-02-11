# Load the Rails application.
require File.expand_path('../application', __FILE__)

# Initialize the Rails application.
Tilt::CoffeeScriptTemplate.default_bare = true
AerialAmericaPlayer::Application.initialize!
