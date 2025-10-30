import React, { useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Receipt, Share2, Users } from "lucide-react";
import useApi from "@/hooks/useApi";
import { useMutation, useQuery } from "@tanstack/react-query";
import { formatDateRange, formatSmartDate } from "@/utils/date";
import toast from "react-hot-toast";

// Skeleton Components
const HeaderSkeleton = () => (
  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 pb-6">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-6 h-6 bg-white/20 rounded animate-pulse" />
      <div className="flex-1">
        <div className="h-6 bg-white/20 rounded w-48 mb-2 animate-pulse" />
        <div className="h-4 bg-white/20 rounded w-32 animate-pulse" />
      </div>
      <div className="w-10 h-10 bg-white/20 rounded-lg animate-pulse" />
    </div>

    <div className="grid grid-cols-2 gap-3 mt-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
        <div className="h-3 bg-white/20 rounded w-20 mb-2 animate-pulse" />
        <div className="h-8 bg-white/20 rounded w-24 animate-pulse" />
      </div>
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
        <div className="h-3 bg-white/20 rounded w-20 mb-2 animate-pulse" />
        <div className="h-8 bg-white/20 rounded w-24 animate-pulse" />
      </div>
    </div>
  </div>
);

const ExpenseItemSkeleton = () => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-32 mb-2 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
        </div>
      </div>
      <div className="text-right">
        <div className="h-5 bg-gray-200 rounded w-16 mb-2 animate-pulse ml-auto" />
        <div className="h-3 bg-gray-200 rounded w-20 animate-pulse ml-auto" />
      </div>
    </div>
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
      <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-50 pb-20">
    <HeaderSkeleton />

    {/* Tab Navigation Skeleton */}
    <div className="bg-white border-b border-gray-200 px-4 flex gap-6">
      <div className="h-4 bg-gray-200 rounded w-20 my-3 animate-pulse" />
      <div className="h-4 bg-gray-200 rounded w-20 my-3 animate-pulse" />
    </div>

    {/* Add Button Skeleton */}
    <div className="px-4 mt-4">
      <div className="w-full h-12 bg-gray-200 rounded-lg animate-pulse" />
    </div>

    {/* Expenses List Skeleton */}
    <div className="px-4 mt-4 space-y-3">
      <ExpenseItemSkeleton />
      <ExpenseItemSkeleton />
      <ExpenseItemSkeleton />
    </div>
  </div>
);

const TripDetail = () => {
  const history = useHistory();
  const { trip: tripApi, expense } = useApi();
  const { tripId } = useParams<{ tripId: string }>();

  const queryTripDetail = useQuery({
    queryKey: [`getTripDetail`, { tripId }],
    queryFn: async () => {
      const response = await tripApi.apiTripsIdDetailsGet({
        id: +tripId,
        userId: 5,
      });

      return response;
    },
    enabled: !!tripId,
  });

  const queryExpenses = useQuery({
    queryKey: [`getTripExpenses`, { tripId }],
    queryFn: async () => {
      const response = await expense.apiExpensesGet({ tripId: +tripId });

      return response;
    },
    enabled: !!tripId,
  });

  const [activeTab, setActiveTab] = useState("expenses");

  const trip = queryTripDetail?.data;
  const expenses = queryExpenses?.data || [];

  const mutationShare = useMutation({
    onSuccess: (response) => {
      navigator.clipboard.writeText(response?.inviteLink!).then(() => {
        toast.success("Link copied to clipboard!");
      });
    },
    mutationFn: async () => {
      const response = await tripApi.apiTripsIdInvitePost({
        expiryDays: 30,
        id: +tripId,
      });

      return response;
    },
  });

  const handleShare = () => {
    mutationShare.mutate();
  };

  // Show skeleton while loading
  if (
    queryTripDetail?.isLoading ||
    queryExpenses?.isLoading ||
    queryExpenses?.isFetching ||
    queryExpenses?.isRefetching ||
    queryTripDetail?.isFetching ||
    queryTripDetail?.isRefetching
  ) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => history.replace("/")}
            className="text-white active:text-blue-100"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold">{trip?.name}</h1>
            <p className="text-blue-100 text-sm">
              {formatDateRange(trip?.startDate, trip?.endDate)}
            </p>
          </div>
          <button
            onClick={handleShare}
            className="p-2 active:bg-white/20 rounded-lg"
          >
            <Share2 size={20} />
          </button>
        </div>

        {/* Trip Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <p className="text-blue-100 text-xs mb-1">Total Spent</p>
            <p className="text-2xl font-bold">₱{trip?.totalSpent}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <p className="text-blue-100 text-xs mb-1">Your Share</p>
            <p className="text-2xl font-bold">₱{trip?.yourShare}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 flex gap-6 sticky top-0 z-10">
        <button
          onClick={() => setActiveTab("expenses")}
          className={`py-3 font-medium text-sm relative ${
            activeTab === "expenses" ? "text-blue-600" : "text-gray-500"
          }`}
        >
          Expenses
          {activeTab === "expenses" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
          )}
        </button>
        <button
          onClick={() =>
            history.push({
              pathname: `/trips/${tripId}/balances`,
              state: {
                tripDetail: queryTripDetail?.data,
              },
            })
          }
          className="py-3 text-gray-500 font-medium text-sm"
        >
          Balances
        </button>
      </div>

      {/* Add Expense Button */}
      <div className="px-4 mt-4">
        <button
          onClick={() =>
            history.push({
              pathname: `/trips/${tripId}/expenses/add`,
              state: {
                members: queryTripDetail?.data?.members,
              },
            })
          }
          className="w-full bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-medium hover:bg-blue-700 active:bg-blue-800 transition"
        >
          <Plus size={20} />
          Add Expense
        </button>
      </div>

      {/* Expenses List */}
      <div className="px-4 mt-4 space-y-3">
        {expenses.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
            <Receipt className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 mb-4">No expenses yet</p>
            <button
              onClick={() => history.push(`/trips/${tripId}/expenses/add`)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              Add First Expense
            </button>
          </div>
        ) : (
          expenses &&
          expenses?.map((expense) => (
            <div
              key={expense.id}
              onClick={() =>
                history.push({
                  pathname: `/trips/${tripId}/expenses/${expense.id}/edit`,
                  state: {
                    members: queryTripDetail?.data?.members,
                  },
                })
              }
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:bg-gray-50 transition"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Receipt className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {expense?.description}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatSmartDate(expense?.expenseDate)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">₱{expense.amount}</p>
                  <p className="text-xs text-gray-500">
                    split {expense?.splitCount} ways
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-semibold text-green-700">
                  {expense?.paidByName?.[0]}
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{expense.paidByName}</span> paid
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TripDetail;
