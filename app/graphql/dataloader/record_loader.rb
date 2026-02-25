# frozen_string_literal: true

module Dataloader
  # Batch-loads individual ActiveRecord records by primary key.
  # Eliminates N+1 queries on belongs_to associations across all GraphQL types.
  #
  # How it works:
  #   GraphQL collects all the IDs that need to be loaded for a given model
  #   during a single query execution, then fires ONE SQL query to fetch them all.
  #
  # Usage in a type:
  #   def manufacturer
  #     dataloader.with(Dataloader::RecordLoader, Manufacturer).load(object.manufacturer_id)
  #   end
  class RecordLoader < GraphQL::Dataloader::Source
    def initialize(model_class)
      @model_class = model_class
    end

    # Called once per batch with all collected IDs.
    # Returns an array in the same order as the input ids array.
    def fetch(ids)
      records = @model_class.where(id: ids).index_by { |r| r.id.to_s }
      ids.map { |id| records[id.to_s] }
    end
  end
end
