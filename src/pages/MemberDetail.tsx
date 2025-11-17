import { useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  Receipt,
  TrendingDown,
  TrendingUp,
  X,
  LockIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import useApi from "@/hooks/useApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeDate } from "@/utils/date";
import { getCurrencySymbol } from "@/lib/utils";

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
    // Use the DTO type here
    queryKey: ["getMemberBreakdownTrip", { memberId, tripId }],
    queryFn: async () => {
      // FIX 2: Convert string IDs from URL to numbers right away to ensure type safety
      const response =
        await expenseApi.apiExpensesMemberUserIdTripTripIdBreakdownGet({
          tripId: parseInt(tripId),
          userId: parseInt(memberId),
        });
      return response;
    },
  });

  const currency = getCurrencySymbol(breakdown?.currency);

  // FIX 2: Refined handler to ensure numbers are passed
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

      // FIX 2: Use non-null assertion or conditional check for currentAuth?.userId
      // Assuming currentAuth.userId is defined when reaching this point.
      const authUserId = currentAuth?.userId;

      if (!authUserId) {
        throw new Error("Authentication error: current user ID is missing.");
      }

      return await settlementApi.apiSettlementsPost({
        settlementCreateDto: {
          tripId: parseInt(tripId), // FIX 2
          // FIX 2: The currentAuth?.userId now has a non-null check above or is handled by TypeScript's implicit casting since we used '|| 0' in the original code, but explicit handling is better.
          fromUserId: isUserOwing ? parseInt(memberId) : authUserId,
          toUserId: isUserOwing ? authUserId : parseInt(memberId),
          amount: amount,
          notes:
            amount === Math.abs(netBalance)
              ? "Full payment settlement"
              : `Partial payment: ${currency}${amount.toFixed(2)}`,
        },
      });
    },
    onSuccess: (data, amount) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries(["getMemberBreakdownTrip"]);
      queryClient.invalidateQueries(["getTripBalances"]);
      queryClient.invalidateQueries(["getUserDashboard"]);

      toast.success(
        `Recorded ${currency}${amount.toFixed(2)} payment from ${
          breakdown?.userName
        }`
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
      toast.error(`Amount cannot exceed ${currency}${netBalance.toFixed(2)}`);
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

  const netBalance = breakdown.netBalance || 0;
  // FIX 2: Ensure comparison is safe, although memberId is a string, breakdown?.userId is likely a number
  // Since we use parseInt(memberId) in the query, we assume memberId (string) or breakdown.userId (number) are correct.
  const isOwing = netBalance < 0 && breakdown?.userId !== currentAuth?.userId;
  const isGettingBack = netBalance > 0;
  const isSettled = netBalance === 0;

  // FIX 1: Get the current user's name for correct messaging
  const currentUserName = currentAuth?.userName || "You";

  // FIX 3: Prioritize the runningTransactions list if it exists

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header - Conditional Styling */}
      <div
        className={
          breakdown?.isArchived
            ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white p-4 pb-8" // Archived style
            : "bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 pb-8" // Default style
        }
      >
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => history.replace(`/trips/${tripId}`)}
            className={
              breakdown?.isArchived
                ? "text-white active:text-gray-100"
                : "text-white active:text-blue-100"
            }
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-semibold">Member Details</h1>
          {/* Optional: Add an "Archived" badge here if desired */}
        </div>

        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl mb-3 border-2 border-white/30">
            {breakdown.userAvatar}
          </div>
          <h2 className="text-2xl font-bold mb-1">{breakdown.userName}</h2>
          {/* Balance Text - Conditional Text Color */}
          <p
            className={`text-3xl font-bold mb-2 ${
              isOwing
                ? breakdown?.isArchived
                  ? "text-red-300"
                  : "text-red-200"
                : isGettingBack
                ? breakdown?.isArchived
                  ? "text-green-300"
                  : "text-green-200"
                : "text-white"
            }`}
          >
            {isOwing ? "Owes" : isGettingBack ? "Gets back" : "Settled"}{" "}
            {currency}
            {Math.abs(netBalance).toFixed(2)}
          </p>
          {/* Trip Name Text - Conditional Text Color */}
          <p
            className={
              breakdown?.isArchived
                ? "text-gray-100 text-sm"
                : "text-blue-100 text-sm"
            }
          >
            in {breakdown.tripName}
          </p>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Current Balance Card - First, most important */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs uppercase tracking-wide font-semibold mb-1">
                Current Balance
              </p>
              <p className="text-2xl font-bold text-gray-800">
                {isOwing ? "Owes" : isGettingBack ? "Gets back" : "Settled"}
              </p>
            </div>
            <p
              className={`text-4xl font-bold ${
                isOwing
                  ? "text-red-600"
                  : isGettingBack
                  ? "text-green-600"
                  : "text-gray-600"
              }`}
            >
              {currency}
              {Math.abs(netBalance).toFixed(2)}
            </p>
          </div>
        </div>

        {/* ARCHIVED MESSAGE - If trip is archived, show a message instead of buttons */}
        {breakdown?.isArchived && (
          <div className="bg-gray-100 border border-gray-300 rounded-xl p-4">
            <div className="flex items-center justify-center gap-2">
              <LockIcon size={20} className="text-gray-600" />
              <p className="text-sm text-gray-700 font-medium">
                This trip is archived. Settlements cannot be recorded.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons - HIDDEN IF ARCHIVED */}
        {isOwing && !breakdown?.isArchived && (
          <div className="space-y-3">
            <button
              onClick={handleFullPayment}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition flex items-center justify-center gap-2 shadow-md"
            >
              <CreditCard size={20} />
              Record Full Payment ({currency}
              {Math.abs(netBalance).toFixed(2)})
            </button>

            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 active:bg-gray-300 transition"
            >
              Record Partial Payment
            </button>
          </div>
        )}

        {/* Info Messages - Third, contextual help */}
        {isGettingBack && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-sm text-green-800 text-center font-medium mb-1">
              {currentUserName} owes {breakdown.userName} {currency}
              {Math.abs(netBalance).toFixed(2)}
            </p>
            <p className="text-xs text-green-600 text-center">
              {currentUserName} needs to record the payment when they pay{" "}
              {breakdown.userName} back
            </p>
          </div>
        )}

        {isSettled && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-600 text-center font-medium">
              ✓ All settled up with {breakdown.userName}
            </p>
          </div>
        )}

        {/* Transaction History - Last, detailed breakdown */}
        <div className="pt-4">
          <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">
            Transaction History
          </h3>

          <div className="space-y-3">
            {breakdown.transactions?.map((transaction) => {
              const isExpense = transaction.type === "Expense";
              const isPayment = transaction.type === "Payment";
              const isPositive = transaction.amount > 0;

              return (
                <div key={`${transaction.type}-${transaction.transactionId}`}>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`p-2 rounded-lg ${
                            isExpense
                              ? isPositive
                                ? "bg-green-100"
                                : "bg-red-100"
                              : isPayment
                              ? "bg-blue-100"
                              : "bg-purple-100"
                          }`}
                        >
                          {isExpense ? (
                            <Receipt
                              className={
                                isPositive ? "text-green-600" : "text-red-600"
                              }
                              size={18}
                            />
                          ) : (
                            <CreditCard
                              className={
                                isPayment ? "text-blue-600" : "text-purple-600"
                              }
                              size={18}
                            />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-800">
                              {transaction.description}
                            </p>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                isExpense
                                  ? "bg-gray-100 text-gray-600"
                                  : isPayment
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-purple-100 text-purple-600"
                              }`}
                            >
                              {transaction.type}
                            </span>
                          </div>

                          <p className="text-xs text-gray-500">
                            {formatRelativeDate(transaction?.date)}
                          </p>

                          {isExpense && (
                            <p className="text-xs text-gray-500 mt-1">
                              {transaction.isUserPayer
                                ? `${breakdown.userName} paid`
                                : `Paid by ${transaction.paidByName}`}
                              {transaction.totalExpenseAmount && (
                                <span className="text-gray-400">
                                  {" "}
                                  • Total: {currency}
                                  {transaction.totalExpenseAmount.toFixed(2)}
                                </span>
                              )}
                            </p>
                          )}

                          {transaction.notes && (
                            <p className="text-xs text-gray-400 mt-1">
                              {transaction.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right ml-3">
                        <p
                          className={`text-lg font-bold ${
                            isPositive ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {isPositive ? "+" : ""}
                          {currency}
                          {Math.abs(transaction.amount).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Balance after this
                        </span>
                        <div className="flex items-center gap-2">
                          {transaction.runningBalance < 0 ? (
                            <TrendingDown className="text-red-500" size={14} />
                          ) : transaction.runningBalance > 0 ? (
                            <TrendingUp className="text-green-500" size={14} />
                          ) : null}
                          <span
                            className={`text-sm font-semibold ${
                              transaction.runningBalance < 0
                                ? "text-red-600"
                                : transaction.runningBalance > 0
                                ? "text-green-600"
                                : "text-gray-600"
                            }`}
                          >
                            {currency}
                            {Math.abs(transaction.runningBalance).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Partial Payment Modal (HIDDEN IF breakdown?.isArchived, as it's only shown when buttons are clicked) */}
      {showPaymentModal && !breakdown?.isArchived && (
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
                    {currency}
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
                  Maximum: {currency}
                  {Math.abs(netBalance).toFixed(2)}
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
                      {currency}
                      {parseFloat(paymentAmount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Remaining balance:
                    </span>
                    <span className="text-lg font-bold text-gray-800">
                      {currency}
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
