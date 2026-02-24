module Admin
  class ManufacturersController < BaseController
    before_action :set_manufacturer, only: [:show, :edit, :update, :destroy]

    def index
      @manufacturers = Manufacturer.order(:name)
      
      # Search by name
      if params[:search].present?
        search_term = "%#{params[:search].downcase}%"
        @manufacturers = @manufacturers.where("LOWER(name) LIKE ?", search_term)
      end
      
      @manufacturers = @manufacturers.page(params[:page]).per(20)
    end

    def show
      @components = @manufacturer.components.order(:name)
    end

    def new
      @manufacturer = Manufacturer.new
    end

    def create
      @manufacturer = Manufacturer.new(manufacturer_params)
      if @manufacturer.save
        redirect_to "/admin/manufacturers/#{@manufacturer.id}", notice: 'Manufacturer created successfully.'
      else
        render :new, status: :unprocessable_entity
      end
    end

    def edit
    end

    def update
      if @manufacturer.update(manufacturer_params)
        redirect_to "/admin/manufacturers/#{@manufacturer.id}", notice: 'Manufacturer updated successfully.'
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @manufacturer.destroy
      redirect_to '/admin/manufacturers', notice: 'Manufacturer deleted successfully.'
    end

    private

    def set_manufacturer
      @manufacturer = Manufacturer.find(params[:id])
    end

    def manufacturer_params
      params.require(:manufacturer).permit(:name, :country, :website)
    end
  end
end
