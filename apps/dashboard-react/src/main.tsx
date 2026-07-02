import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TRPCProvider } from "@/trpc/client";
import { makeQueryClient } from "@/trpc/query-client";
import { makeClient } from "@/trpc/client";
import { bindQueryClient } from "@/utils/session";
import { NuqsAdapter } from "nuqs/adapters/react-router/v6";
import { I18nProviderClient } from "@/locales/client";
import App from "./App";
import "ui/globals.css";
import "./styles/globals.css";

const queryClient = makeQueryClient();
bindQueryClient(queryClient);
const trpcClient = makeClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <NuqsAdapter>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <I18nProviderClient locale="en">
            <App />
          </I18nProviderClient>
        </QueryClientProvider>
      </TRPCProvider>
    </NuqsAdapter>
  </BrowserRouter>,
);
