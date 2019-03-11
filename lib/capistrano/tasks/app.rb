require 'json'

namespace :app do

  def build
    within current_path do
        execute :yarn, :build
    end
  end
  
  desc 'Build app'
  task :build do
    on roles(:app) do      
      info 'Building...'
      build
    end
  end
  
end