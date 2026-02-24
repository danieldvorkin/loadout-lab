module Admin::AdminHelper
  include Rails.application.routes.url_helpers
  
  def default_url_options
    { host: 'localhost' }
  end
end
