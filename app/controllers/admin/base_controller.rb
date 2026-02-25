module Admin
  class BaseController < ActionController::Base
    include ActionController::Cookies

    before_action :authenticate_admin!
    layout "admin"

    helper Admin::AdminHelper

    helper_method :current_user

    private

    def authenticate_admin!
      unless current_user&.admin?
        redirect_to '/admin/login', alert: 'You must be an admin to access this area.'
      end
    end

    def current_user
      return @current_user if defined?(@current_user)
      
      @current_user = nil
      
      # Check session for admin user
      if session[:admin_user_id].present?
        @current_user = User.find_by(id: session[:admin_user_id])
        
        # Verify the user is still an admin
        if @current_user && !@current_user.admin?
          session.delete(:admin_user_id)
          session.delete(:admin_token)
          @current_user = nil
        end
      end
      
      @current_user
    end
  end
end
