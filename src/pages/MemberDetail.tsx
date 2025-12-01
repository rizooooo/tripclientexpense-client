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

  // STATE FOR TOGGLE: 'global' or 'viewer'
  // Defaulting to 'viewer' since you mentioned that's what you usually need
  const [viewMode, setViewMode] = useState<"global" | "viewer">("viewer");

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");

  const {
    data: breakdown,
    isLoading,
    isFetching,
    isRefetching,
  } = useQuery({
    // Add viewMode to key so it refetches on toggle
    queryKey: ["getMemberBreakdownTrip", { memberId, tripId, viewMode }],
    queryFn: async () => {
      const response =
        await expenseApi.apiExpensesMemberUserIdTripTripIdBreakdownGet({
          tripId: parseInt(tripId),
          userId: parseInt(memberId),
          // Pass the boolean flag based on state
          filterByViewer: viewMode === "viewer",
        });
      return response;
    },
  });

  const currency = getCurrencySymbol(breakdown?.currency);

  const setQuickAmount = (percentage: number) => {
    const netBalance = Math.abs(breakdown?.netBalance || 0);
    const amount = (netBalance * percentage).toFixed(2);
    setPaymentAmount(amount);
  };

  const createSettlementMutation = useMutation({
    mutationFn: async (amount: number) => {
      const netBalance = breakdown?.netBalance || 0;
      const isUserOwing = netBalance < 0;
      const authUserId = currentAuth?.userId;

      if (!authUserId) throw new Error("Auth error");

      return await settlementApi.apiSettlementsPost({
        settlementCreateDto: {
          tripId: parseInt(tripId),
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
      queryClient.invalidateQueries(["getMemberBreakdownTrip"]);
      queryClient.invalidateQueries(["getTripBalances"]);
      queryClient.invalidateQueries(["getUserDashboard"]);
      toast.success(`Payment recorded`);
      history.goBack();
    },
    onError: (error) => {
      toast.error("Failed to record payment.");
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
      toast.error("Invalid amount");
      return;
    }
    if (amount > netBalance) {
      toast.error(`Exceeds balance`);
      return;
    }
    createSettlementMutation.mutate(amount);
    setShowPaymentModal(false);
    setPaymentAmount("");
  };

  // Skeleton...
  if (isLoading || isFetching || isRefetching) {
    return (
      <div className="min-h-screen bg-gray-50 pb-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 h-48 animate-pulse" />
      </div>
    );
  }

  if (!breakdown) return <div>No Data</div>;

  const netBalance = breakdown.netBalance || 0;
  // If viewMode is 'viewer', NetBalance < 0 means THEY owe YOU.
  // If viewMode is 'global', NetBalance < 0 means THEY owe the GROUP.
  const isOwing = netBalance < 0;
  const isGettingBack = netBalance > 0;
  const isSettled = netBalance === 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div
        className={
          breakdown?.isArchived
            ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white p-4 pb-8"
            : "bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 pb-8"
        }
      >
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => history.replace(`/trips/${tripId}`)}
            className="text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-semibold">Member Details</h1>
        </div>

        {/* --- TOGGLE SWITCH --- */}
        <div className="flex justify-center mb-6">
          <div className="bg-black/20 p-1 rounded-lg flex items-center">
            <button
              onClick={() => setViewMode("global")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "global"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-blue-100 hover:bg-white/10"
              }`}
            >
              Group View
            </button>
            <button
              onClick={() => setViewMode("viewer")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === "viewer"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-blue-100 hover:bg-white/10"
              }`}
            >
              With Me
            </button>
          </div>
        </div>
        {/* --------------------- */}

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
            {isOwing ? "Owes" : isGettingBack ? "Gets back" : "Settled"}{" "}
            {currency}
            {Math.abs(netBalance).toFixed(2)}
          </p>

          <p className="text-blue-100 text-sm">
            {viewMode === "viewer"
              ? "Balance with You"
              : `Total in ${breakdown.tripName}`}
          </p>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Balance Card */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs uppercase tracking-wide font-semibold mb-1">
                {viewMode === "viewer" ? "Balance with You" : "Group Balance"}
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

        {/* Buttons - Only show for debts if NOT archived */}
        {isOwing && !breakdown?.isArchived && (
          <div className="space-y-3">
            {/* If in Global View, warn user that payment settles GLOBAL debt */}
            {viewMode === "global" && (
              <p className="text-xs text-center text-orange-600 font-medium">
                Note: You are viewing Global Debt. Recording a payment here
                assumes you are settling their debt to the group. Switch to
                "With Me" to settle personal debts.
              </p>
            )}
            <button
              onClick={handleFullPayment}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2 shadow-md"
            >
              <CreditCard size={20} />
              Record Full Payment ({currency}
              {Math.abs(netBalance).toFixed(2)})
            </button>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200"
            >
              Record Partial Payment
            </button>
          </div>
        )}

        {/* Transaction History */}
        <div className="pt-4">
          <h3 className="text-sm font-semibold text-gray-600 uppercase mb-3">
            {viewMode === "viewer" ? "Shared Transactions" : "All Transactions"}
          </h3>

          <div className="space-y-3">
            {breakdown.transactions?.map((transaction) => {
              const isPositive = transaction.amount > 0;
              const isExpense = transaction.type === "Expense";
              const isPayment = transaction.type === "Payment";

              return (
                <div
                  key={`${transaction.type}-${transaction.transactionId}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`p-2 rounded-lg ${
                          isExpense
                            ? isPositive
                              ? "bg-green-100"
                              : "bg-red-100"
                            : "bg-blue-100"
                        }`}
                      >
                        {isExpense ? (
                          <Receipt
                            size={18}
                            className={
                              isPositive ? "text-green-600" : "text-red-600"
                            }
                          />
                        ) : (
                          <CreditCard size={18} className="text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatRelativeDate(transaction?.date)}
                        </p>
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
                  {/* Running Balance Footer */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
                    <span className="text-xs text-gray-500">Net Balance</span>
                    <span
                      className={`text-sm font-semibold ${
                        transaction.runningBalance < 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {currency}
                      {Math.abs(transaction.runningBalance).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Code (Same as before) */}
      {showPaymentModal && !breakdown?.isArchived && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowPaymentModal(false)}
        >
          {/* ... Modal content ... */}
          <div
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold mb-6">Record Payment</h3>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-xl p-4 text-2xl font-bold mb-4"
              placeholder="0.00"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 bg-gray-100 py-3 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handlePartialPayment}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDetail;
