import { Switch, Route, Link } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import SofiaLeads from "@/pages/SofiaLeads";
import SofiaLogs from "@/pages/SofiaLogs";
import HybridAdmin from "@/pages/HybridAdmin";
import { SocketProvider } from "./lib/socket";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/sofia-leads" component={SofiaLeads} />
      <Route path="/sofia-logs" component={SofiaLogs} />
      <Route path="/admin" component={HybridAdmin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <Router />
        <Toaster />
      </SocketProvider>
    </QueryClientProvider>
  );
}

export default App;