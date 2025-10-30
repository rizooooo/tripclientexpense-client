import useApi from "@/hooks/useApi";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { useHistory, useParams } from "react-router-dom";
import { XCircle, Loader } from "lucide-react";
import toast from "react-hot-toast";

const JoinTrip = () => {
  const { token } = useParams<{ token?: string }>();
  const { trip } = useApi();
  const history = useHistory();

  const { data, isLoading, isError, error, isSuccess, isFetched } = useQuery({
    queryKey: [`joinTrip`, token],
    queryFn: async () => {
      const response = await trip.apiTripsJoinPost({
        joinTripDto: {
          inviteToken: token!,
        },
      });

      return response;
    },
    enabled: !!token,
    retry: false,
  });

  // Redirect immediately on success
  React.useEffect(() => {
    if (data?.tripId && isFetched && isSuccess) {
      toast.success(data?.message!);
      history.replace(`/trips/${data.tripId}`);
    }
  }, [data, history, isFetched, isSuccess]);

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Loader className="text-blue-600 animate-spin" size={32} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Joining Trip
            </h2>
            <p className="text-gray-600 text-center text-sm">
              Please wait while we add you to the trip...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error State (only shown if join fails)
  if (isError || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="text-red-600" size={32} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Invalid Invitation
            </h2>
            <p className="text-gray-600 text-center text-sm mb-6">
              {error?.message ||
                "This invitation link is invalid or has expired. Please request a new one from the trip creator."}
            </p>
            <button
              onClick={() => history.push("/")}
              className="w-full bg-gray-600 text-white py-3 rounded-lg font-medium hover:bg-gray-700 active:bg-gray-800 transition"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // This should not be reached because of the useEffect redirect
  return null;
};

export default JoinTrip;
