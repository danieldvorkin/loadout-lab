module Admin
  class DashboardController < BaseController
    def index
      @users_count = User.count
      @components_count = Component.count
      @builds_count = Build.count
      @manufacturers_count = Manufacturer.count
      @recent_users = User.order(created_at: :desc).limit(5)
      @recent_builds = Build.includes(:user).order(created_at: :desc).limit(5)
    end
  end
end
