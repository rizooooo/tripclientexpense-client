import React, { useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { ArrowLeft, Receipt, CreditCard, X } from "lucide-react";
import toast from "react-hot-toast";
import useApi from "@/hooks/useApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

const MemberDetail = () => {
  const history = useHistory();
  const { expense: expenseApi, settlementApi } = useApi();
  const { tripId, memberId } = useParams<{
    tripId: string;
    memberId: string;
  }>();

  const { currentAuth } = useAuth();

  const queryClient = useQueryClient();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  const {
    data: breakdown,
    isLoading,
    isFetching,
    isRefetching,
  } = useQuery({
    queryKey: ["getMemberBreakdownTrip", { memberId, tripId }],
    queryFn: async () => {
      const response =
        await expenseApi.apiExpensesMemberUserIdTripTripIdBreakdownGet({
          tripId: +tripId,
          userId: +memberId,
        });
      return response;
    },
  });

  // const handleFullPayment = () => {
  //   // TODO: Implement full settlement creation
  //   const netBalance = breakdown?.netBalance || 0;
  //   toast.success(
  //     `Recorded ₱${Math.abs(netBalance).toFixed(2)} payment from ${
  //       breakdown?.userName
  //     }`
  //   );
  //   history.goBack();
  // };

  // const handlePartialPayment = () => {
  //   const amount = parseFloat(paymentAmount);
  //   const netBalance = Math.abs(breakdown?.netBalance || 0);

  //   if (!paymentAmount || amount <= 0) {
  //     toast.error("Please enter a valid amount");
  //     return;
  //   }

  //   if (amount > netBalance) {
  //     toast.error(`Amount cannot exceed ₱${netBalance.toFixed(2)}`);
  //     return;
  //   }

  //   // TODO: Implement partial settlement creation
  //   toast.success(
  //     `Recorded ₱${amount.toFixed(2)} partial payment from ${
  //       breakdown?.userName
  //     }`
  //   );
  //   setShowPaymentModal(false);
  //   setPaymentAmount("");
  //   history.goBack();
  // };

  const setQuickAmount = (percentage: number) => {
    const netBalance = Math.abs(breakdown?.netBalance || 0);
    const amount = (netBalance * percentage).toFixed(2);
    setPaymentAmount(amount);
  };

  const createSettlementMutation = useMutation({
    mutationFn: async (amount: number) => {
      const netBalance = breakdown?.netBalance || 0;

      // Determine who pays whom
      const isUserOwing = netBalance < 0;

      return await settlementApi.apiSettlementsPost({
        settlementCreateDto: {
          tripId: +tripId,
          fromUserId: isUserOwing ? +memberId : currentAuth?.userId, // ← You need to get current user ID
          toUserId: isUserOwing ? currentAuth?.userId : +memberId,
          amount: amount,
          notes:
            amount === Math.abs(netBalance)
              ? "Full payment settlement"
              : `Partial payment: ₱${amount.toFixed(2)}`,
        },
      });
    },
    onSuccess: (data, amount) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries(["getMemberBreakdownTrip"]);
      queryClient.invalidateQueries(["getTripBalances"]);
      queryClient.invalidateQueries(["getUserDashboard"]);

      toast.success(
        `Recorded ₱${amount.toFixed(2)} payment from ${breakdown?.userName}`
      );
      history.goBack();
    },
    onError: (error) => {
      toast.error("Failed to record payment. Please try again.");
      console.error(error);
    },
  });

  const handleFullPayment = () => {
    const netBalance = Math.abs(breakdown?.netBalance || 0);
    createSettlementMutation.mutate(netBalance);
  };

  const handlePartialPayment = () => {
    const amount = parseFloat(paymentAmount);
    const netBalance = Math.abs(breakdown?.netBalance || 0);

    if (!paymentAmount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > netBalance) {
      toast.error(`Amount cannot exceed ₱${netBalance.toFixed(2)}`);
      return;
    }

    createSettlementMutation.mutate(amount);
    setShowPaymentModal(false);
    setPaymentAmount("");
  };

  // 🦴 Skeleton Loader
  if (isLoading || isFetching || isRefetching) {
    return (
      <div className="min-h-screen bg-gray-50 pb-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 pb-8">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="w-6 h-6 bg-blue-400/40" />
            <Skeleton className="w-32 h-5 bg-blue-400/40" />
          </div>

          <div className="flex flex-col items-center">
            <Skeleton className="w-20 h-20 rounded-full bg-blue-400/30 mb-3" />
            <Skeleton className="w-32 h-5 bg-blue-400/40 mb-2" />
            <Skeleton className="w-40 h-6 bg-blue-400/40 mb-1" />
            <Skeleton className="w-28 h-4 bg-blue-400/40" />
          </div>
        </div>

        <div className="px-4 mt-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="p-4 bg-white rounded-xl border border-gray-200 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div>
                  <Skeleton className="w-32 h-4 mb-2" />
                  <Skeleton className="w-20 h-3" />
                </div>
              </div>
              <Skeleton className="w-16 h-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 🧾 Regular UI below...
  if (!breakdown) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">No data available</div>
      </div>
    );
  }

  if (!breakdown) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">No data available</div>
      </div>
    );
  }

  const netBalance = breakdown.netBalance || 0;
  const isOwing = netBalance < 0;
  const isGettingBack = netBalance > 0;
  const isSettled = netBalance === 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => history.replace(`/trips/${tripId}`)}
            className="text-white active:text-blue-100"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-semibold">Member Details</h1>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl mb-3 border-2 border-white/30">
            {breakdown.userAvatar}
          </div>
          <h2 className="text-2xl font-bold mb-1">{breakdown.userName}</h2>
          <p
            className={`text-3xl font-bold mb-2 ${
              isOwing
                ? "text-red-200"
                : isGettingBack
                ? "text-green-200"
                : "text-white"
            }`}
          >
            {isOwing ? "Owes" : isGettingBack ? "Gets back" : "Settled"} ₱
            {Math.abs(netBalance).toFixed(2)}
          </p>
          <p className="text-blue-100 text-sm">in {breakdown.tripName}</p>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="px-4 mt-4">
        <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">
          Expense Breakdown
        </h3>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
          {breakdown.expenses?.map((expense) => {
            const isPositive = expense.netAmount > 0;
            const isUserPaid = expense.paidByUserId === breakdown.userId;

            return (
              <div
                key={expense.expenseId}
                className="p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isPositive ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    <Receipt
                      className={isPositive ? "text-green-600" : "text-red-600"}
                      size={18}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {expense.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isUserPaid
                        ? `${breakdown.userName} paid`
                        : `Paid by ${expense.paidByName}`}
                    </p>
                  </div>
                </div>
                <p
                  className={`font-semibold ${
                    isPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isPositive ? "+" : ""}₱
                  {Math.abs(expense.netAmount).toFixed(2)}
                </p>
              </div>
            );
          })}

          {/* Net Balance */}
          <div className="p-4 bg-gray-50 rounded-b-xl">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-700">Net Balance</p>
              <p
                className={`text-xl font-bold ${
                  isOwing
                    ? "text-red-600"
                    : isGettingBack
                    ? "text-green-600"
                    : "text-gray-600"
                }`}
              >
                {isGettingBack ? "+" : ""}₱{Math.abs(netBalance).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons - Only show if user OWES money */}
        {isOwing && (
          <div className="space-y-3 mt-4">
            {/* Full Payment Button */}
            <button
              onClick={handleFullPayment}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition flex items-center justify-center gap-2"
            >
              <CreditCard size={20} />
              Record Full Payment (₱{Math.abs(netBalance).toFixed(2)})
            </button>

            {/* Partial Payment Button */}
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 active:bg-gray-300 transition"
            >
              Record Partial Payment
            </button>
          </div>
        )}

        {/* Info message when user is getting money back */}
        {isGettingBack && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm text-green-800 text-center font-medium mb-1">
              {breakdown.userName} owes you ₱{Math.abs(netBalance).toFixed(2)}
            </p>
            <p className="text-xs text-green-600 text-center">
              They will record the payment when they pay you back
            </p>
          </div>
        )}

        {/* Settled message */}
        {isSettled && (
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-600 text-center font-medium">
              ✓ All settled up with {breakdown.userName}
            </p>
          </div>
        )}
      </div>

      {/* Partial Payment Modal */}
      {showPaymentModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
            onClick={() => {
              setShowPaymentModal(false);
              setPaymentAmount("");
            }}
          />

          {/* Modal */}
          <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
            <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl p-6 shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  Partial Payment
                </h3>
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentAmount("");
                  }}
                  className="text-gray-400 hover:text-gray-600 active:text-gray-800 p-1"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Payment Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How much did {breakdown.userName} pay?
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-2xl font-semibold">
                    ₱
                  </span>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    max={Math.abs(netBalance)}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-2xl font-semibold"
                    autoFocus
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Maximum: ₱{Math.abs(netBalance).toFixed(2)}
                </p>
              </div>

              {/* Quick Amount Buttons */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Quick Select
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => setQuickAmount(0.25)}
                    className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 py-3 rounded-lg text-sm font-medium text-gray-700 transition"
                  >
                    25%
                  </button>
                  <button
                    onClick={() => setQuickAmount(0.5)}
                    className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 py-3 rounded-lg text-sm font-medium text-gray-700 transition"
                  >
                    50%
                  </button>
                  <button
                    onClick={() => setQuickAmount(0.75)}
                    className="bg-gray-100 hover:bg-gray-200 active:bg-gray-300 py-3 rounded-lg text-sm font-medium text-gray-700 transition"
                  >
                    75%
                  </button>
                  <button
                    onClick={() => setQuickAmount(1)}
                    className="bg-blue-100 hover:bg-blue-200 active:bg-blue-300 py-3 rounded-lg text-sm font-medium text-blue-700 transition"
                  >
                    All
                  </button>
                </div>
              </div>

              {/* Amount Preview */}
              {paymentAmount && parseFloat(paymentAmount) > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      Payment amount:
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      ₱{parseFloat(paymentAmount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Remaining balance:
                    </span>
                    <span className="text-lg font-bold text-gray-800">
                      ₱
                      {(
                        Math.abs(netBalance) - parseFloat(paymentAmount)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentAmount("");
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 active:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePartialPayment}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                >
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MemberDetail;
