module Admin
  class BuildsController < BaseController
    before_action :set_build, only: [ :show, :destroy ]

    def index
      @builds = Build.includes(:user, :build_components, :components).order(created_at: :desc)

      # Search by name or user
      if params[:search].present?
        search_term = "%#{params[:search].downcase}%"
        @builds = @builds.joins(:user).where("LOWER(builds.name) LIKE ? OR LOWER(users.username) LIKE ?", search_term, search_term)
      end

      # Filter by discipline
      @builds = @builds.where(discipline: params[:discipline]) if params[:discipline].present?

      # Filter by user
      @builds = @builds.where(user_id: params[:user_id]) if params[:user_id].present?

      @builds = @builds.page(params[:page]).per(20)
      @disciplines = Build::DISCIPLINES
    end

    def show
      @build_components = @build.build_components.includes(component: :manufacturer)
    end

    def destroy
      @build.destroy
      redirect_to "/admin/builds", notice: "Build deleted successfully."
    end

    private

    def set_build
      @build = Build.find(params[:id])
    end
  end
end
