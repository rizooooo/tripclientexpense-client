import { useHistory } from "react-router-dom";
import { Users, Plus, Receipt, User, TrendingUp } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import useApi from "@/hooks/useApi";
import { formatDateRange } from "@/utils/date";

const Home = () => {
  const { trip } = useApi();
  const history = useHistory();

  const queryDashboard = useQuery({
    queryFn: async () => {
      const response = await trip.apiTripsUserUserIdDashboardGet({ userId: 5 });

      return response;
    },
    queryKey: ["getDashboardTotalShare"],
  });

  const queryTrips = useQuery({
    queryFn: async () => {
      const response = await trip.apiTripsGet();

      return response;
    },
    queryKey: ["getUsers"],
  });

  const trips = queryTrips?.data || [];

  const overallBalance = queryDashboard?.data?.overallBalance; // positive = owed to you, negative = you owe

  if (
    queryDashboard?.isLoading ||
    queryTrips?.isLoading ||
    queryDashboard?.isRefetching ||
    queryTrips?.isRefetching ||
    queryDashboard?.isFetching ||
    queryTrips?.isFetching
  ) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 animate-pulse">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 pb-8">
          <div className="h-6 w-32 bg-blue-400/50 rounded mb-2"></div>
          <div className="h-4 w-48 bg-blue-400/40 rounded"></div>
        </div>

        {/* Balance Summary Skeleton */}
        <div className="px-4 -mt-4 mb-4">
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-gray-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 w-24 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 w-20 bg-gray-200 rounded"></div>
              </div>
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Trips Section Header */}
        <div className="px-4 flex items-center justify-between mb-3">
          <div className="h-5 w-24 bg-gray-200 rounded"></div>
          <div className="h-8 w-24 bg-gray-300 rounded-lg"></div>
        </div>

        {/* Trip Cards Skeleton */}
        <div className="px-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="h-5 w-32 bg-gray-200 rounded"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
                <div className="h-4 w-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Navigation Skeleton */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 px-6 py-3">
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center gap-1">
              <div className="h-6 w-6 bg-gray-200 rounded"></div>
              <div className="h-3 w-10 bg-gray-200 rounded"></div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="h-6 w-6 bg-gray-200 rounded"></div>
              <div className="h-3 w-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 pb-8">
        <h1 className="text-2xl font-bold mb-2">My Trips</h1>
        <p className="text-blue-100 text-sm">
          Split expenses with friends & family
        </p>
      </div>

      {/* Balance Summary Card */}
      <div className="px-4 -mt-4 mb-4">
        <div
          className={`bg-white rounded-xl shadow-md p-4 border-l-4 ${
            overallBalance > 0
              ? "border-green-500"
              : overallBalance < 0
              ? "border-red-500"
              : "border-gray-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Your Overall Balance</p>
              <p
                className={`text-2xl font-bold ${
                  overallBalance > 0
                    ? "text-green-600"
                    : overallBalance < 0
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {overallBalance > 0 ? "+" : ""}₱
                {Math.abs(overallBalance).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {overallBalance > 0
                  ? "You are owed"
                  : overallBalance < 0
                  ? "You owe"
                  : "All settled"}
              </p>
            </div>
            <div
              className={`p-3 rounded-full ${
                overallBalance > 0
                  ? "bg-green-100"
                  : overallBalance < 0
                  ? "bg-red-100"
                  : "bg-gray-100"
              }`}
            >
              <TrendingUp
                className={
                  overallBalance > 0
                    ? "text-green-600"
                    : overallBalance < 0
                    ? "text-red-600"
                    : "text-gray-600"
                }
                size={24}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trips List */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Active Trips</h2>
          <button
            onClick={() => history.push("/trips/create")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition"
          >
            <Plus size={18} />
            New Trip
          </button>
        </div>

        {trips.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
            <Receipt className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 mb-4">No trips yet</p>
            <button
              onClick={() => history.push("/trips/create")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              Create Your First Trip
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {trips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => history.push(`/trips/${trip.id}`)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:bg-gray-50 transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{trip.name}</h3>
                  <span className="text-gray-400">›</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3 text-gray-600">
                    <span className="flex items-center gap-1">
                      <Users size={16} />
                      {trip.memberCount} members
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>
                      {formatDateRange(trip?.startDate, trip?.endDate)}
                    </span>
                  </div>
                  <span className="font-semibold text-gray-800">
                    ₱{trip.totalExpenses}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 px-6 py-3 bottom-nav-safe">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center gap-1 text-blue-600">
            <Receipt size={24} />
            <span className="text-xs font-medium">Trips</span>
          </button>
          <button
            onClick={() => history.push("/profile")}
            className="flex flex-col items-center gap-1 text-gray-400 active:text-gray-600"
          >
            <User size={24} />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
