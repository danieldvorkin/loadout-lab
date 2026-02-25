module Admin
  class ComponentsController < BaseController
    before_action :set_component, only: [ :show, :edit, :update, :destroy ]

    def index
      @components = Component.includes(:manufacturer).order(created_at: :desc)

      # Search by name
      if params[:search].present?
        search_term = "%#{params[:search].downcase}%"
        @components = @components.where("LOWER(components.name) LIKE ?", search_term)
      end

      # Filter by type
      @components = @components.where(type: params[:type]) if params[:type].present?

      # Filter by manufacturer
      @components = @components.where(manufacturer_id: params[:manufacturer_id]) if params[:manufacturer_id].present?

      # Filter by status
      if params[:status] == "active"
        @components = @components.where(discontinued: [ false, nil ])
      elsif params[:status] == "discontinued"
        @components = @components.where(discontinued: true)
      end

      @components = @components.page(params[:page]).per(20)
      @component_types = Component.distinct.pluck(:type).compact.sort
      @manufacturers = Manufacturer.order(:name)
    end

    def show
    end

    def new
      @component = Component.new
      @manufacturers = Manufacturer.order(:name)
    end

    def create
      @component = Component.new(component_params)
      if @component.save
        redirect_to "/admin/components/#{@component.id}", notice: "Component created successfully."
      else
        @manufacturers = Manufacturer.order(:name)
        render :new, status: :unprocessable_entity
      end
    end

    def edit
      @manufacturers = Manufacturer.order(:name)
    end

    def update
      if @component.update(component_params)
        redirect_to "/admin/components/#{@component.id}", notice: "Component updated successfully."
      else
        @manufacturers = Manufacturer.order(:name)
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @component.destroy
      redirect_to "/admin/components", notice: "Component deleted successfully."
    end

    private

    def set_component
      @component = Component.find(params[:id])
    end

    def component_params
      params.require(:component).permit(:name, :type, :manufacturer_id, :weight_oz, :msrp_cents, :discontinued, :image_url)
    end
  end
end
