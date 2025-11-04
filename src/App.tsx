import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import Home from "./pages/Home";
import CreateTrip from "./pages/CreateTrip";
import TripDetail from "./pages/TripDetail";
import AddExpense from "./pages/AddExpense";
import Balances from "./pages/Balances";
import MemberDetail from "./pages/MemberDetail";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import JoinTrip from "./pages/JoinTrip";

import AuthProvider from "./providers/AuthProvider";
import PrivateRoute from "./components/PrivateRoute";
import EnterInviteCode from "./pages/EnterInviteCode";

function App() {
  const queryClient = new QueryClient();

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Switch>
            {/* Public routes */}
            <Route exact path="/login" component={Login} />
            <Route exact path="/register" component={Register} />

            {/* Protected routes */}
            <PrivateRoute exact path="/" component={Home} />
            <PrivateRoute exact path="/join/:token" component={JoinTrip} />
            <PrivateRoute exact path="/trips/create" component={CreateTrip} />
            <PrivateRoute exact path="/trips/:tripId" component={TripDetail} />
            <PrivateRoute
              exact
              path="/trips/:tripId/balances"
              component={Balances}
            />
            <PrivateRoute
              exact
              path="/trips/:tripId/expenses/add"
              component={AddExpense}
            />
            <PrivateRoute
              exact
              path="/trips/:tripId/expenses/:expenseId/edit"
              component={AddExpense}
            />
            <PrivateRoute
              exact
              path="/trips/:tripId/members/:memberId"
              component={MemberDetail}
            />
            <PrivateRoute exact path="/profile" component={Profile} />
            <PrivateRoute exact path="/join" component={EnterInviteCode} />

            {/* Catch-all */}
            <Redirect to="/" />
          </Switch>

          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: { marginTop: "10px" },
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
