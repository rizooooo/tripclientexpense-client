import React from "react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, CreditCard } from "lucide-react";
import toast from "react-hot-toast";
import type { TripDto } from "api";
import { useQuery } from "@tanstack/react-query";
import useApi from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton"; // 👈 make sure you have this component

const Balances = () => {
  const history = useHistory();
  const { currentAuth } = useAuth();
  const { tripId } = useParams<{ tripId: string }>();
  const { trip: tripApi } = useApi();
  const { state } = useLocation<{ tripDetail: TripDto }>();

  const { tripDetail } = state || {};

  const trip = tripDetail;

  const queryBalance = useQuery({
    queryKey: [`getBalanceByTrip`, { trip }],
    queryFn: async () => {
      const response = await tripApi.apiTripsIdBalancesGet({
        id: +tripDetail?.id,
      });
      return response;
    },
  });

  const settlements = [
    { from: "Marc", fromId: 1, to: "Darrell", toId: 5, amount: 150 },
    { from: "Elsie", fromId: 3, to: "Joy", toId: 2, amount: 50 },
  ];

  const handleRecordPayment = (settlement) => {
    toast.success(`Payment recorded: ${settlement.from} → ${settlement.to}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => history.push(`/`)}
            className="text-white active:text-blue-100"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{trip.name}</h1>
            <p className="text-blue-100 text-sm">Balances</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 flex gap-6 sticky top-0 z-10">
        <button
          onClick={() => history.push(`/trips/${tripId}`)}
          className="py-3 text-gray-500 font-medium text-sm"
        >
          Expenses
        </button>
        <button className="py-3 font-medium text-sm text-blue-600 relative">
          Balances
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
        </button>
      </div>

      {/* Member Balances */}
      <div className="px-4 mt-4 space-y-2">
        <h2 className="text-sm font-semibold text-gray-600 uppercase mb-3">
          Member Balances
        </h2>

        {queryBalance.isLoading ||
        queryBalance?.isFetching ||
        queryBalance?.isRefetching ? (
          // 🦴 Skeleton Loader
          <>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </>
        ) : (
          queryBalance?.data?.map((member) => (
            <div
              key={member.userId}
              onClick={() => {
                if (currentAuth?.userId !== member?.userId) {
                  history.push(`/trips/${tripId}/members/${member.userId}`);
                }
              }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center justify-between active:bg-gray-50 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {member.avatar}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {member.name}{" "}
                    {currentAuth?.userId === member?.userId && (
                      <small className="text-xs text-gray-500">(You)</small>
                    )}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {member?.balance > 0
                      ? "Gets back"
                      : member.balance < 0
                      ? "Owes"
                      : "Settled up"}
                  </p>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <p
                  className={`text-lg font-bold ${
                    member.balance > 0
                      ? "text-green-600"
                      : member.balance < 0
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {member.balance > 0 ? "+" : ""}₱{Math.abs(member.balance)}
                </p>

                {currentAuth?.userId !== member?.userId && (
                  <span className="text-gray-400">›</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Settlement Suggestions */}
      {/* <div className="px-4 mt-6">
        <h2 className="text-sm font-semibold text-gray-600 uppercase mb-3">
          Suggested Settlements
        </h2>
        <div className="space-y-3">
          {settlements.map((settlement, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <CreditCard className="text-blue-600" size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">{settlement.from}</span>{" "}
                    pays <span className="font-semibold">{settlement.to}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    This settles {settlement.from}'s balance
                  </p>
                </div>
                <p className="font-bold text-gray-800">₱{settlement.amount}</p>
              </div>
              <button
                onClick={() => handleRecordPayment(settlement)}
                className="w-full bg-blue-50 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 active:bg-blue-200 transition"
              >
                Record Payment
              </button>
            </div>
          ))}

          {settlements.length === 0 && (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
              <p className="text-gray-500">
                All balanced! No settlements needed.
              </p>
            </div>
          )}
        </div>
      </div> */}
    </div>
  );
};

export default Balances;
