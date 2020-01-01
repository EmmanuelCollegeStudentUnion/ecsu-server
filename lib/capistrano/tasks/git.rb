# Taken from https://gist.github.com/corny/7459729
# Thanks corny

namespace :git do
    desc 'Copy repo to releases'
    task create_release: :'git:update' do
      on roles(:all) do
        with fetch(:git_environmental_variables) do
          within repo_path do
            execute :git, :submodule, :init
          end
        end
      end
    end
  end