# config valid for current version and patch releases of Capistrano
lock "~> 3.11.0"

set :application, "ecsu-server"
set :repo_url, "git@github.com:EmmanuelCollegeStudentUnion/ecsu-server.git"

# Avoid full clone to save disk space
set :git_shallow_clone, 2 

# Default branch is :master
# ask :branch, `git rev-parse --abbrev-ref HEAD`.chomp

# Default value for :format is :airbrussh.
# set :format, :airbrussh

# You can configure the Airbrussh format using :format_options.
# These are the defaults.
# set :format_options, command_output: true, log_file: "log/capistrano.log", color: :auto, truncate: :auto

# Default value for :pty is false
# set :pty, true

# Default value for :linked_files is []
append :linked_files, ".env"

# Default value for linked_dirs is []
append :linked_dirs, "user_uploads"

# Default value for default_env is {}
set :default_env, { path: "/home/jw2117/.local/bin:$PATH" }


# Default value for copy_files is []
set :copy_files, ['node_modules']

# Default value for local_user is ENV['USER']
# set :local_user, -> { `git config user.name`.chomp }

# Default value for keep_releases is 5
set :keep_releases, 1

# Uncomment the following to require manually verifying the host key before first deploy.
# set :ssh_options, verify_host_key: :secure

set :app_command, "current/ecosystem.config.js"

namespace :deploy do

    desc 'Build and restart application'
    task :restart do
      invoke 'app:build'
      invoke 'pm2:restart'
    end
  
    after :publishing, :restart   
end