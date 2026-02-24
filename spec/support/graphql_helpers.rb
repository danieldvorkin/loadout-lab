module GraphqlHelpers
  def execute_graphql(query:, variables: {}, context: {})
    PrsBuilderApiSchema.execute(
      query,
      variables: variables,
      context: context
    )
  end

  def graphql_request(query:, variables: {}, user: nil)
    headers = { "Content-Type" => "application/json" }
    
    if user
      token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
      headers["Authorization"] = "Bearer #{token}"
    end

    post "/graphql", 
      params: { query: query, variables: variables }.to_json,
      headers: headers
    
    JSON.parse(response.body)
  end
end

RSpec.configure do |config|
  config.include GraphqlHelpers, type: :request
end
