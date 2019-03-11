require 'json'

namespace :pm2 do

  def app_status
    within current_path do
      # Dry run to prevent spawn log being sent to stdout
      execute :npx, :pm2, :list, fetch(:app_command) 
      # Get json from stdout
      ps = JSON.parse(capture :npx, :pm2, :jlist, fetch(:app_command), "--silent")
      if ps.empty?
        return nil
      else
        # status: online, errored, stopped
        return ps[0]["pm2_env"]["status"]
      end
    end
  end

  def restart_app
    within current_path do
      execute :npx, :pm2, :restart, fetch(:app_command)
    end
  end
  
  def start_app
    within current_path do
      execute :npx, :pm2, :start, fetch(:app_command)
    end
  end
  
  desc 'Restart app gracefully'
  task :restart do
    on roles(:app) do
      case app_status
      when nil
        info 'App is not registered'
        start_app
      when 'stopped'
        info 'App is stopped'
        restart_app
      when 'errored'
        info 'App has errored'
        restart_app
      when 'online'
        info 'App is online'
        restart_app
      end
    end
  end
  
end