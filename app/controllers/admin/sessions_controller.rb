module Admin
  class SessionsController < ActionController::Base
    layout 'admin'

    helper_method :current_user

    def new
      redirect_to '/admin' if current_user&.admin?
    end

    def create
      user = User.find_by(email: params[:email]&.downcase)

      if user&.valid_password?(params[:password]) && user.admin?
        session[:admin_user_id] = user.id
        redirect_to '/admin', notice: 'Logged in successfully.'
      else
        flash.now[:alert] = 'Invalid email/password or not an admin.'
        render :new, status: :unprocessable_entity
      end
    end

    def destroy
      session.delete(:admin_user_id)
      redirect_to '/admin/login', notice: 'Logged out successfully.'
    end

    private

    def current_user
      @current_user ||= User.find_by(id: session[:admin_user_id]) if session[:admin_user_id]
    end
  end
end
