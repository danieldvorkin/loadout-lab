# frozen_string_literal: true

module Dataloader
  # Batch-loads has_many associations using ActiveRecord's built-in Preloader.
  # Eliminates N+1 queries on collection associations across all GraphQL types.
  #
  # How it works:
  #   GraphQL collects all the parent records that need a given association loaded,
  #   then fires ONE preload call to fetch all children at once — identical to
  #   what `includes` does in a controller, but driven by the GraphQL query shape.
  #
  # Usage in a type:
  #   def build_components
  #     dataloader.with(Dataloader::AssociationLoader, Build, :build_components).load(object)
  #   end
  #
  # Chaining with .then for in-Ruby transformations (sorting, filtering, counting):
  #   def unread_count
  #     dataloader.with(Dataloader::AssociationLoader, Conversation, :messages).load(object).then do |msgs|
  #       msgs.count { |m| !m.read && m.user_id != context[:current_user].id }
  #     end
  #   end
  class AssociationLoader < GraphQL::Dataloader::Source
    def initialize(model_class, association_name)
      @model_class = model_class
      @association_name = association_name
    end

    # Called once per batch with all collected parent records.
    # Returns an array of loaded associations in the same order as the input records.
    def fetch(records)
      ::ActiveRecord::Associations::Preloader.new(
        records: records,
        associations: [ @association_name ]
      ).call
      records.map { |record| record.public_send(@association_name) }
    end
  end
end
