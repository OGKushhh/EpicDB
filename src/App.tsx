import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, Navigate, RouterProvider, Outlet } from "react-router";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { Footer } from "~/components/Footer";
import { Header, routes } from "~/components/Header";
import { ManifestPage } from "~/pages/ManifestPage";
import { GraphQLPage } from "~/pages/GraphQLPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/** Layout — header + main + footer with an error boundary around the page. */
function Layout() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: routes.home,
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to={routes.manifests} replace /> },
      { path: "manifests", element: <ManifestPage /> },
      { path: "graphql", element: <GraphQLPage /> },
    ],
  },
  { path: "*", element: <Navigate to={routes.home} replace /> },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
