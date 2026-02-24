class GraphqlController < ApplicationController
  # Skip authentication for GraphQL - we handle auth in mutations
  # This allows login/register mutations to work without a token
  skip_before_action :authenticate_user!, only: [:execute], raise: false

  def execute
    result = PrsBuilderApiSchema.execute(
      params[:query],
      variables: ensure_hash(params[:variables]),
      context: {
        current_user: current_user,
        request: request,
        response: response
      },
      operation_name: params[:operationName]
    )
    render json: result
  rescue StandardError => e
    raise e unless Rails.env.development?
    handle_error_in_development(e)
  end

  private

  def ensure_hash(ambiguous_param)
    case ambiguous_param
    when String
      ambiguous_param.present? ? JSON.parse(ambiguous_param) : {}
    when Hash
      ambiguous_param
    when ActionController::Parameters
      ambiguous_param.to_unsafe_hash
    when nil
      {}
    else
      raise ArgumentError, "Unexpected parameter: #{ambiguous_param}"
    end
  end

  def handle_error_in_development(e)
    logger.error e.message
    logger.error e.backtrace.join("\n")

    render json: { errors: [{ message: e.message, backtrace: e.backtrace }], data: {} }, status: :internal_server_error
  end
end