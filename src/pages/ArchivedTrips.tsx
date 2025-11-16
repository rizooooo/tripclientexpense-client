import { useState } from "react";
import { useHistory } from "react-router-dom";
import { ArrowLeft, Users, Archive, ArchiveRestore } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useApi from "@/hooks/useApi";
import { formatDateRange } from "@/utils/date";
import { getCurrencySymbol } from "@/lib/utils";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import PullToRefresh from "@/components/PullToRefresh";

const ArchivedTrips = () => {
  const { trip: tripApi } = useApi();
  const history = useHistory();
  const queryClient = useQueryClient();
  const { currentAuth } = useAuth();

  const queryArchivedTrips = useQuery({
    queryFn: async () => {
      const basePath = import.meta.env.VITE_API;
      const token = currentAuth?.token;
      const response = await fetch(`${basePath}/api/Trips/archived`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch archived trips");
      }
      return response.json();
    },
    queryKey: ["getArchivedTrips"],
  });

  const mutationUnarchive = useMutation({
    onSuccess: () => {
      toast.success("Trip restored successfully");
      queryClient.invalidateQueries({ queryKey: ["getArchivedTrips"] });
      queryClient.invalidateQueries({ queryKey: ["getDashboardTotalShare"] });
    },
    onError: () => {
      toast.error("Failed to restore trip");
    },
    mutationFn: async (tripId: number) => {
      const basePath = import.meta.env.VITE_API;
      const token = currentAuth?.token;
      const response = await fetch(`${basePath}/api/Trips/${tripId}/unarchive`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to unarchive trip");
      }
      return response.json();
    },
  });

  const archivedTrips = queryArchivedTrips?.data || [];

  const handleRefresh = async () => {
    await queryArchivedTrips.refetch();
  };

  if (
    queryArchivedTrips?.isLoading ||
    queryArchivedTrips?.isRefetching ||
    queryArchivedTrips?.isFetching
  ) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 animate-pulse">
        <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-6 pb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-6 w-6 bg-white/20 rounded" />
            <div className="h-6 w-32 bg-white/20 rounded" />
          </div>
        </div>

        <div className="px-4 mt-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
            >
              <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-4 w-20 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-6 pb-8">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => history.replace("/")}
            className="text-white active:text-gray-100"
            aria-label="Go back to home"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <Archive size={24} />
            <h1 className="text-2xl font-bold">Archived Trips</h1>
          </div>
        </div>
        <p className="text-gray-100 text-sm ml-9">
          {archivedTrips.length} {archivedTrips.length === 1 ? "trip" : "trips"} archived
        </p>
      </div>

      {/* Archived Trips List */}
      <div className="px-4 mt-4">
        {archivedTrips.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
            <Archive className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 mb-2">No archived trips</p>
            <p className="text-gray-400 text-sm">
              Trips you archive will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {archivedTrips.map((trip: any) => (
              <div
                key={trip.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 relative"
              >
                {/* Archive Badge */}
                <div className="absolute top-2 right-2">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                    <Archive size={12} />
                    Archived
                  </span>
                </div>

                <div
                  onClick={() => history.push(`/trips/${trip.id}`)}
                  className="cursor-pointer active:opacity-70 transition"
                >
                  {/* Trip Name and Currency */}
                  <div className="flex items-start justify-between mb-2 pr-20">
                    <h3 className="font-semibold text-gray-800">{trip.name}</h3>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      {trip.currency || "PHP"}
                    </span>
                  </div>

                  {/* Trip Details */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users size={16} />
                        {trip.memberCount} members
                      </span>
                      <span className="text-gray-400">•</span>
                      <span>{formatDateRange(trip?.startDate, trip?.endDate)}</span>
                    </div>

                    <span className="font-semibold text-gray-800">
                      {getCurrencySymbol(trip.currency)}
                      {trip.totalExpenses}
                    </span>
                  </div>
                </div>

                {/* Restore Button */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => mutationUnarchive.mutate(trip.id)}
                    disabled={mutationUnarchive.isPending}
                    className="w-full bg-blue-50 text-blue-600 py-2 rounded-lg flex items-center justify-center gap-2 font-medium hover:bg-blue-100 active:bg-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArchiveRestore size={18} />
                    {mutationUnarchive.isPending ? "Restoring..." : "Restore Trip"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
};

export default ArchivedTrips;

