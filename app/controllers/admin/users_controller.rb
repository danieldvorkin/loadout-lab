module Admin
  class UsersController < BaseController
    before_action :set_user, only: [ :show, :edit, :update, :destroy ]

    def index
      @users = User.order(created_at: :desc)

      # Search by username or email
      if params[:search].present?
        search_term = "%#{params[:search].downcase}%"
        @users = @users.where("LOWER(username) LIKE ? OR LOWER(email) LIKE ?", search_term, search_term)
      end

      # Filter by role
      @users = @users.where(role: params[:role]) if params[:role].present?

      @users = @users.page(params[:page]).per(20)
    end

    def show
      @builds = @user.builds.includes(:build_components).order(created_at: :desc)
    end

    def edit
    end

    def update
      if @user.update(user_params)
        redirect_to "/admin/users/#{@user.id}", notice: "User updated successfully."
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @user.destroy
      redirect_to "/admin/users", notice: "User deleted successfully."
    end

    private

    def set_user
      @user = User.find(params[:id])
    end

    def user_params
      params.require(:user).permit(:username, :email, :full_name, :phone_number, :bio, :location, :avatar_url, :date_of_birth, :preferred_discipline, :website, :role, social_links: {}, notification_preferences: {})
    end
  end
end
