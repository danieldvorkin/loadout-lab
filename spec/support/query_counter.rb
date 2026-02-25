# frozen_string_literal: true

# Shared helper for counting SQL queries fired during a block.
# Used in N+1 specs to assert that Dataloader batch-loads associations
# in a fixed number of queries regardless of record count.
module QueryCounter
  # Counts real SQL SELECT/INSERT/UPDATE/DELETE queries fired during the block.
  # Skips:
  #   - AR query cache hits     (name: "CACHE")
  #   - Schema reflection       (name: "SCHEMA")
  #   - Transaction boundaries  (BEGIN / COMMIT / SAVEPOINT / ROLLBACK)
  def count_queries
    count = 0
    counter = lambda do |_name, _start, _finish, _id, payload|
      next if payload[:name]&.in?(%w[CACHE SCHEMA])
      next if payload[:sql].to_s.match?(/\A\s*(BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE SAVEPOINT)/i)

      count += 1
    end
    ActiveSupport::Notifications.subscribed(counter, "sql.active_record") { yield }
    count
  end
end

RSpec.configure do |config|
  config.include QueryCounter
end
