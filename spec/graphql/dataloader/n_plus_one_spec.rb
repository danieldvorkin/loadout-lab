# frozen_string_literal: true

require "rails_helper"

# These specs verify that GraphQL::Dataloader eliminates N+1 queries by batching
# all association loads for a given field into a single SQL query, regardless of
# how many parent records are in the result set.
#
# Pattern: count SQL queries with N records, then with 2N records.
#          If the count stays the same → Dataloader is working.
#          If the count grows linearly → N+1 bug.
#
# QueryCounter helper is provided by spec/support/query_counter.rb.
RSpec.describe "Dataloader — N+1 query prevention" do
  # Execute a query directly against the schema (no HTTP / auth middleware overhead).
  def gql(query_string, variables: {}, context: {})
    PrsBuilderApiSchema.execute(query_string, variables: variables, context: context).to_h
  end

  # ─────────────────────────────────────────────────────────────────────────────
  # RecordLoader  (belongs_to associations)
  # Dataloader::RecordLoader batches multiple FK lookups into one
  # WHERE id IN (...) query.
  # ─────────────────────────────────────────────────────────────────────────────
  describe "RecordLoader (belongs_to batching)" do
    describe "listings → user" do
      let(:query) do
        <<~GQL
          {
            listings {
              id
              title
              user { id username }
            }
          }
        GQL
      end

      it "batches all user lookups into a single query for N listings" do
        # 6 listings each owned by a different user
        6.times { create(:listing, user: create(:user), component: create(:component, manufacturer: create(:manufacturer))) }

        queries = count_queries { gql(query) }

        # Expected: 1 (listings) + 1 (batch users WHERE id IN ...) = 2
        # N+1 would be: 1 + 6 = 7
        expect(queries).to eq(2)
      end

      it "does not add extra queries when more listings are created" do
        3.times { create(:listing, user: create(:user), component: create(:component, manufacturer: create(:manufacturer))) }
        baseline = count_queries { gql(query) }

        5.times { create(:listing, user: create(:user), component: create(:component, manufacturer: create(:manufacturer))) }
        with_more = count_queries { gql(query) }

        expect(with_more).to eq(baseline)
      end
    end

    describe "listings → component → manufacturer (chained RecordLoaders)" do
      let(:query) do
        <<~GQL
          {
            listings {
              id
              component {
                id
                name
                manufacturer { id name }
              }
            }
          }
        GQL
      end

      it "resolves both belongs_to hops in exactly 3 queries" do
        # 5 listings each referencing distinct components from distinct manufacturers
        5.times do
          mfr = create(:manufacturer)
          comp = create(:component, manufacturer: mfr)
          create(:listing, component: comp, user: create(:user))
        end

        queries = count_queries { gql(query) }

        # Expected:
        #   1 → SELECT listings
        #   1 → SELECT components WHERE id IN (...)   [RecordLoader]
        #   1 → SELECT manufacturers WHERE id IN (...) [RecordLoader]
        # N+1 would be: 1 + 5 + 5 = 11
        expect(queries).to eq(3)
      end

      it "query count is constant regardless of listing count" do
        3.times do
          create(:listing,
            component: create(:component, manufacturer: create(:manufacturer)),
            user: create(:user))
        end
        baseline = count_queries { gql(query) }

        6.times do
          create(:listing,
            component: create(:component, manufacturer: create(:manufacturer)),
            user: create(:user))
        end
        with_more = count_queries { gql(query) }

        expect(with_more).to eq(baseline)
      end
    end
  end

  # ─────────────────────────────────────────────────────────────────────────────
  # AssociationLoader  (has_many associations)
  # Dataloader::AssociationLoader batches collection association loading for
  # multiple parent records using ActiveRecord::Associations::Preloader — one
  # SQL query covers all parents, regardless of how many there are.
  # ─────────────────────────────────────────────────────────────────────────────
  describe "AssociationLoader (has_many batching)" do
    describe "manufacturers → components" do
      let(:query) do
        <<~GQL
          {
            manufacturers {
              id
              name
              components { id name type }
            }
          }
        GQL
      end

      it "batches component loading for all manufacturers in one query" do
        # 4 manufacturers, each with 3 components
        4.times { create_list(:component, 3, manufacturer: create(:manufacturer)) }

        queries = count_queries { gql(query) }

        # Expected: 1 (manufacturers) + 1 (batch components for all) = 2
        # N+1 would be: 1 + 4 = 5
        expect(queries).to eq(2)
      end

      it "query count does not grow as the number of manufacturers grows" do
        3.times { create_list(:component, 2, manufacturer: create(:manufacturer)) }
        baseline = count_queries { gql(query) }

        5.times { create_list(:component, 2, manufacturer: create(:manufacturer)) }
        with_more = count_queries { gql(query) }

        expect(with_more).to eq(baseline)
      end
    end

    describe "builds → build_components" do
      let(:user) { create(:user) }
      let(:query) do
        <<~GQL
          {
            builds {
              id
              name
              buildComponents { id position owned }
            }
          }
        GQL
      end

      it "batches build_component loading for all builds in one query" do
        # 4 builds each with 3 build_components (unique component per row to satisfy uniqueness constraint)
        builds = create_list(:build, 4, user: user)
        builds.each do |b|
          3.times { create(:build_component, build: b, component: create(:component, manufacturer: create(:manufacturer))) }
        end

        queries = count_queries { gql(query, context: { current_user: user }) }

        # Expected: 1 (builds) + 1 (batch build_components for all builds) = 2
        # N+1 would be: 1 + 4 = 5
        expect(queries).to eq(2)
      end

      it "query count stays constant as more builds and components are added" do
        user_a = create(:user)
        create_list(:build, 2, user: user_a).each do |b|
          2.times { create(:build_component, build: b, component: create(:component, manufacturer: create(:manufacturer))) }
        end
        baseline = count_queries { gql(query, context: { current_user: user_a }) }

        user_b = create(:user)
        create_list(:build, 6, user: user_b).each do |b|
          4.times { create(:build_component, build: b, component: create(:component, manufacturer: create(:manufacturer))) }
        end
        with_more = count_queries { gql(query, context: { current_user: user_b }) }

        expect(with_more).to eq(baseline)
      end
    end

    describe "builds → ballistic_profiles" do
      let(:user) { create(:user) }
      let(:query) do
        <<~GQL
          {
            builds {
              id
              name
              ballisticProfiles { id name caliber muzzleVelocityFps }
            }
          }
        GQL
      end

      it "batches ballistic profile loading for all builds in one query" do
        builds = create_list(:build, 3, user: user)
        builds.each { |b| create_list(:ballistic_profile, 2, build: b) }

        queries = count_queries { gql(query, context: { current_user: user }) }

        # Expected: 1 (builds) + 1 (batch ballistic_profiles for all builds) = 2
        # N+1 would be: 1 + 3 = 4
        expect(queries).to eq(2)
      end

      it "query count stays constant regardless of how many profiles per build" do
        user_a = create(:user)
        create_list(:build, 2, user: user_a).each { |b| create_list(:ballistic_profile, 2, build: b) }
        baseline = count_queries { gql(query, context: { current_user: user_a }) }

        user_b = create(:user)
        create_list(:build, 5, user: user_b).each { |b| create_list(:ballistic_profile, 5, build: b) }
        with_more = count_queries { gql(query, context: { current_user: user_b }) }

        expect(with_more).to eq(baseline)
      end
    end
  end

  # ─────────────────────────────────────────────────────────────────────────────
  # Chained Dataloaders
  # Multiple Dataloader sources fire sequentially (not N×M), because
  # GraphQL::Dataloader coordinates fibers so each "layer" of the chain
  # is batched before the next layer begins.
  # ─────────────────────────────────────────────────────────────────────────────
  describe "chained Dataloaders (multi-hop association chains)" do
    describe "builds → build_components → component → manufacturer" do
      let(:user) { create(:user) }
      let(:query) do
        <<~GQL
          {
            builds {
              id
              name
              buildComponents {
                id
                position
                component {
                  id
                  name
                  manufacturer { id name }
                }
              }
            }
          }
        GQL
      end

      it "resolves a 4-hop chain in exactly 4 queries" do
        manufacturers = create_list(:manufacturer, 3)
        components    = manufacturers.flat_map { |m| create_list(:component, 2, manufacturer: m) }
        builds        = create_list(:build, 3, user: user)
        builds.each_with_index do |b, i|
          create(:build_component, build: b, component: components[i % components.length])
          create(:build_component, build: b, component: components[(i + 1) % components.length])
        end

        queries = count_queries { gql(query, context: { current_user: user }) }

        # Expected:
        #   1 → SELECT builds WHERE user_id = X
        #   1 → SELECT build_components WHERE build_id IN (...)   [AssociationLoader]
        #   1 → SELECT components WHERE id IN (...)               [RecordLoader]
        #   1 → SELECT manufacturers WHERE id IN (...)            [RecordLoader]
        # = 4 total — not 3 + 3×n1 + 3×n2 (an N+1 cascade)
        expect(queries).to eq(4)
      end

      it "query count stays at 4 even when build/component/manufacturer counts scale up" do
        # Baseline: 2 builds
        user_a     = create(:user)
        mfrs_a     = create_list(:manufacturer, 2)
        comps_a    = mfrs_a.flat_map { |m| create_list(:component, 2, manufacturer: m) }
        builds_a   = create_list(:build, 2, user: user_a)
        builds_a.each { |b| create(:build_component, build: b, component: comps_a.sample) }
        baseline = count_queries { gql(query, context: { current_user: user_a }) }

        # With more: 8 builds, more manufacturers, more components
        # Use rotating unique components per build to avoid (build_id, component_id, position) uniqueness violation
        user_b   = create(:user)
        mfrs_b   = create_list(:manufacturer, 5)
        comps_b  = mfrs_b.flat_map { |m| create_list(:component, 6, manufacturer: m) } # 30 unique components
        builds_b = create_list(:build, 8, user: user_b)
        builds_b.each_with_index do |b, i|
          # Slice a unique window of 3 components for each build so no duplicates within a build
          comps_b.rotate(i * 3).first(3).each do |comp|
            create(:build_component, build: b, component: comp)
          end
        end
        with_more = count_queries { gql(query, context: { current_user: user_b }) }

        # An N+1 implementation would have queries_with_more >> baseline
        expect(with_more).to eq(baseline)
      end
    end

    describe "listings → component → manufacturer (public endpoint chain)" do
      let(:query) do
        <<~GQL
          {
            listings {
              id
              title
              user { id username }
              component {
                id
                name
                manufacturer { id name }
              }
            }
          }
        GQL
      end

      it "resolves user + component + manufacturer across all listings in 4 queries" do
        # 5 listings, each from a different user/component/manufacturer
        5.times do
          create(:listing,
            user: create(:user),
            component: create(:component, manufacturer: create(:manufacturer)))
        end

        queries = count_queries { gql(query) }

        # Expected:
        #   1 → SELECT listings
        #   1 → SELECT users WHERE id IN (...)         [RecordLoader: user]
        #   1 → SELECT components WHERE id IN (...)    [RecordLoader: component]
        #   1 → SELECT manufacturers WHERE id IN (...) [RecordLoader: manufacturer]
        # = 4 total — not 1 + 5 + 5 + 5 = 16
        expect(queries).to eq(4)
      end
    end
  end
end
