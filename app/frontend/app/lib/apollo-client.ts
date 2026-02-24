import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';

// Helper to safely access localStorage (not available during SSR)
const isClient = typeof window !== 'undefined';

const getToken = (): string | null => {
  if (!isClient) return null;
  return localStorage.getItem('authToken');
};

const GRAPHQL_ENDPOINT = '/graphql';

// HTTP link to the GraphQL endpoint
const httpLink = createHttpLink({
  uri: GRAPHQL_ENDPOINT,
  credentials: 'include',
});

// Auth link that adds the JWT token to requests
const authLink = setContext((_, { headers }) => {
  // Get the authentication token from local storage (only on client)
  const token = getToken();
  
  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Create Apollo Client instance
export const apolloClient = new ApolloClient({
  link: ApolloLink.from([authLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          builds: {
            merge(existing, incoming) {
              return incoming;
            },
          },
          components: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
      Build: {
        fields: {
          buildComponents: {
            merge(existing, incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  // SSR mode: disable features that require browser APIs
  ssrMode: !isClient,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: isClient ? 'cache-and-network' : 'network-only',
    },
  },
});

export default apolloClient;
