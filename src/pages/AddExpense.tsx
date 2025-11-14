import React, { useEffect, useState } from "react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Info, Lock, Users } from "lucide-react";
import toast from "react-hot-toast";
import useApi from "@/hooks/useApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExpenseCreateDto, TripDetailDto, TripMemberDto } from "api";
import { useAuth } from "@/context/AuthContext";
import { getCurrencySymbol } from "@/lib/utils";

const AddExpense = () => {
  const { currentAuth } = useAuth();
  const { user, expense: expenseApi } = useApi();

  const history = useHistory();
  const queryClient = useQueryClient();

  const { tripId, expenseId } = useParams<{
    tripId: string;
    expenseId: string;
  }>();

  const {
    state: { members, trip },
  } = useLocation<{
    members: TripMemberDto[];
    trip: TripDetailDto;
  }>();

  const isEditMode = !!expenseId;

  const queryGetExpense = useQuery({
    queryKey: [`getExpenseByIdEdit`, { expenseId }],
    enabled: isEditMode,
    queryFn: async () => {
      const response = await expenseApi.apiExpensesIdGet({ id: +expenseId });
      return response;
    },
  });

  const [splitType, setSplitType] = useState("Equal");
  const [expenseData, setExpenseData] = useState({
    description: "",
    amount: "",
    paidBy: "",
  });

  const [selectedMembers, setSelectedMembers] = useState(
    members.map((m) => m.userId)
  );

  const [customAmounts, setCustomAmounts] = useState(
    members.reduce((acc, m) => ({ ...acc, [m.userId]: "" }), {})
  );

  // NEW: For "Paid For" mode
  const [paidForMembers, setPaidForMembers] = useState<number[]>([]);

  const toggleMember = (memberId: number) => {
    if (splitType === "PaidFor") {
      setPaidForMembers((prev) =>
        prev.includes(memberId)
          ? prev.filter((id) => id !== memberId)
          : [...prev, memberId]
      );
    } else {
      setSelectedMembers((prev) =>
        prev.includes(memberId)
          ? prev.filter((id) => id !== memberId)
          : [...prev, memberId]
      );
    }
  };

  const updateCustomAmount = (memberId: number, value: number) => {
    setCustomAmounts((prev) => ({ ...prev, [memberId]: value }));
  };

  const calculateTotal = () => {
    return Object.values(customAmounts).reduce(
      (sum, val) => sum + (parseFloat(val) || 0),
      0
    );
  };

  const mutation = useMutation<void, Error, ExpenseCreateDto>({
    mutationFn: async (params) => {
      if (isEditMode) {
        await expenseApi.apiExpensesIdPut({
          expenseCreateDto: params,
          id: +expenseId,
        });
        return;
      }
      await expenseApi.apiExpensesPost({
        expenseCreateDto: params,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries([`getTripDetail`]);
      queryClient.invalidateQueries([`getTripExpenses`]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await expenseApi.apiExpensesIdDelete({
        id: +expenseId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries([`getTripDetail`]);
      queryClient.invalidateQueries([`getTripExpenses`]);
    },
  });

  const handleSubmit = async () => {
    if (
      !expenseData.description ||
      !expenseData.amount ||
      !expenseData.paidBy
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (splitType === "Equal" && selectedMembers.length === 0) {
      toast.error("Select at least one member to split with");
      return;
    }

    if (splitType === "PaidFor" && paidForMembers.length === 0) {
      toast.error("Select at least one person this was paid for");
      return;
    }

    if (splitType === "Custom") {
      const total = calculateTotal();
      const expenseAmount = parseFloat(expenseData.amount);
      if (Math.abs(total - expenseAmount) > 0.01) {
        toast.error("Custom amounts must match total expense amount");
        return;
      }
    }

    const isSplitEqual = splitType === "Equal";
    const isPaidFor = splitType === "PaidFor";

    await mutation.mutateAsync({
      amount: +expenseData?.amount,
      description: expenseData?.description,
      paidByUserId: +expenseData?.paidBy,
      splitType,
      tripId: +tripId,
      category: "",
      splits: isSplitEqual
        ? null
        : isPaidFor
        ? paidForMembers.map((userId) => ({
            userId: userId,
            amount: parseFloat(expenseData.amount) / paidForMembers.length, // Equal split among paid-for members
          }))
        : members?.map((item) => ({
            userId: item?.userId,
            amount:
              item && customAmounts?.[item.userId]
                ? customAmounts?.[item?.userId]
                : 0,
          })),
    });

    toast.success(isEditMode ? "Expense updated!" : "Expense added!");
    history.goBack();
  };

  useEffect(() => {
    if (isEditMode && queryGetExpense?.isSuccess && queryGetExpense?.data) {
      setExpenseData({
        amount: queryGetExpense?.data?.amount,
        description: queryGetExpense?.data?.description,
        paidBy: queryGetExpense?.data?.paidByUserId,
      });
    }
  }, [queryGetExpense?.isSuccess, isEditMode]);

  const currency = getCurrencySymbol(trip?.currency);
  const equalShare = expenseData.amount
    ? (parseFloat(expenseData.amount) / selectedMembers.length).toFixed(2)
    : "0.00";
  const paidForShare =
    expenseData.amount && paidForMembers.length > 0
      ? (parseFloat(expenseData.amount) / paidForMembers.length).toFixed(2)
      : "0.00";

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => history.goBack()}
            className="text-gray-600 active:text-gray-800"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-semibold">
            {isEditMode ? "Edit Expense" : "Add Expense"}
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Warning Banner if Has Settlements */}
        {isEditMode && queryGetExpense?.data?.hasSettlements && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="bg-amber-100 p-2 rounded-lg flex-shrink-0">
                <AlertTriangle className="text-amber-600" size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800 mb-1">
                  Limited Editing
                </p>
                <p className="text-xs text-amber-700">
                  This expense has settlements recorded. You can only edit the
                  description. To change the amount or split, delete this
                  expense and create a new one.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Dinner, Gas, Tickets"
              value={expenseData.description}
              onChange={(e) =>
                setExpenseData({ ...expenseData, description: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Amount ({currency}) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="0.00"
                step="0.01"
                value={expenseData.amount}
                onChange={(e) =>
                  setExpenseData({ ...expenseData, amount: e.target.value })
                }
                disabled={isEditMode && queryGetExpense?.data?.hasSettlements}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl font-semibold ${
                  isEditMode && queryGetExpense?.data?.hasSettlements
                    ? "bg-gray-100 cursor-not-allowed text-gray-500"
                    : ""
                }`}
              />
              {isEditMode && queryGetExpense?.data?.hasSettlements && (
                <Lock
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paid by <span className="text-red-500">*</span>
            </label>
            <select
              value={expenseData.paidBy}
              onChange={(e) =>
                setExpenseData({ ...expenseData, paidBy: e.target.value })
              }
              disabled={isEditMode && queryGetExpense?.data?.hasSettlements}
              className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isEditMode && queryGetExpense?.data?.hasSettlements
                  ? "bg-gray-100 cursor-not-allowed text-gray-500"
                  : ""
              }`}
            >
              <option value="">Select member...</option>
              {members.map((member) => (
                <option key={member.id} value={member.userId}>
                  {member.name}{" "}
                  {currentAuth?.userId === member?.userId && "(You)"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Split Method - Only show if no settlements OR not in edit mode */}
        {(!isEditMode || !queryGetExpense?.data?.hasSettlements) && (
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Split Method</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setSplitType("Equal")}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                    splitType === "Equal"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 active:bg-gray-200"
                  }`}
                >
                  Equal
                </button>
                <button
                  onClick={() => setSplitType("Custom")}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                    splitType === "Custom"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 active:bg-gray-200"
                  }`}
                >
                  Custom
                </button>
                <button
                  onClick={() => setSplitType("PaidFor")}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                    splitType === "PaidFor"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 active:bg-gray-200"
                  }`}
                >
                  Paid For
                </button>
              </div>
            </div>

            {splitType === "Equal" && (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  Split equally among selected members
                </p>
                <div className="space-y-2">
                  {members.map((member) => {
                    const isSelected = selectedMembers.includes(member.userId);
                    return (
                      <label
                        key={member.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                          isSelected
                            ? "bg-blue-50 border-2 border-blue-200"
                            : "bg-gray-50 border-2 border-transparent"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleMember(member.userId!)}
                          className="w-5 h-5 text-blue-600 rounded"
                        />
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                          {member.avatar}
                        </div>
                        <span className="flex-1 font-medium text-gray-800">
                          {member.name}
                        </span>
                        {isSelected && (
                          <span className="text-sm font-semibold text-blue-600">
                            {currency}
                            {equalShare}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Each selected person pays an equal share
                </p>
              </>
            )}

            {splitType === "PaidFor" && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>
                      {members.find((m) => m.userId === +expenseData.paidBy)
                        ?.name || "Payer"}
                    </strong>{" "}
                    will cover the full amount for selected people
                  </p>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Who is this expense for?
                </p>
                <div className="space-y-2">
                  {members
                    .filter((m) => m.userId !== +expenseData.paidBy)
                    .map((member) => {
                      const isSelected = paidForMembers.includes(member.userId);
                      return (
                        <label
                          key={member.id}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                            isSelected
                              ? "bg-green-50 border-2 border-green-200"
                              : "bg-gray-50 border-2 border-transparent"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMember(member.userId!)}
                            className="w-5 h-5 text-green-600 rounded"
                          />
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm">
                            {member.avatar}
                          </div>
                          <span className="flex-1 font-medium text-gray-800">
                            {member.name}
                          </span>
                          {isSelected && (
                            <span className="text-sm font-semibold text-green-600">
                              {currency}
                              {paidForShare}
                            </span>
                          )}
                        </label>
                      );
                    })}
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Selected people will owe the payer their share
                </p>
              </>
            )}

            {splitType === "Custom" && (
              <>
                <p className="text-sm text-gray-600 mb-3">
                  Enter custom amount for each person
                </p>
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                        {member.avatar}
                      </div>
                      <span className="flex-1 font-medium text-gray-800">
                        {member.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">{currency}</span>
                        <input
                          type="number"
                          value={customAmounts[member.userId]}
                          onChange={(e) =>
                            updateCustomAmount(member.userId!, e.target.value)
                          }
                          placeholder="0.00"
                          step="0.01"
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right font-semibold"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Total Split Amount
                    </span>
                    <span
                      className={`text-lg font-bold ${
                        Math.abs(
                          calculateTotal() - parseFloat(expenseData.amount || 0)
                        ) < 0.01
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {currency}
                      {calculateTotal().toFixed(2)}
                    </span>
                  </div>
                  {expenseData.amount &&
                    Math.abs(
                      calculateTotal() - parseFloat(expenseData.amount)
                    ) > 0.01 && (
                      <p className="text-xs text-red-600 mt-2 text-center">
                        ⚠️ Split amounts must equal {currency}
                        {parseFloat(expenseData.amount).toFixed(2)}
                      </p>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Enter custom amounts for each person
                </p>
              </>
            )}
          </div>
        )}

        {/* Locked Split Info - Show if Has Settlements */}
        {/* Locked Split Info - Show if Has Settlements */}
        {isEditMode && queryGetExpense?.data?.hasSettlements && (
          <div className="bg-white rounded-xl p-5 shadow-sm border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gray-100 p-2 rounded-lg">
                <Lock className="text-gray-600" size={20} />
              </div>
              <h3 className="font-semibold text-gray-800">
                Split Details (Locked)
              </h3>
            </div>

            <div className="space-y-3">
              {/* Split Type Badge */}
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                <span className="text-sm font-medium text-gray-700">
                  Split Type
                </span>
                <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                  {queryGetExpense?.data?.splitType}
                </span>
              </div>

              {/* Members Count */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <Users className="text-gray-600" size={18} />
                  <span className="text-sm font-medium text-gray-700">
                    Split Between
                  </span>
                </div>
                <span className="text-lg font-bold text-gray-800">
                  {queryGetExpense?.data?.splitCount}{" "}
                  {queryGetExpense?.data?.splitCount === 1
                    ? "person"
                    : "people"}
                </span>
              </div>

              {/* Members List Preview (if available) */}
              {queryGetExpense?.data?.splits &&
                queryGetExpense.data.splits.length > 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase mb-2">
                      Split Details
                    </p>
                    <div className="space-y-2">
                      {queryGetExpense.data.splits.map((split) => (
                        <div
                          key={split.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                              {split.userName?.[0]}
                            </div>
                            <span className="text-sm text-gray-700">
                              {split.userName}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-gray-800">
                            {currency}
                            {split.amount?.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Info Message */}
            <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-blue-700">
                Split details are locked because settlements have been recorded
                for this expense. Delete and recreate to make changes.
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition disabled:bg-gray-400"
        >
          {mutation.isPending
            ? "Saving..."
            : isEditMode && queryGetExpense?.data?.hasSettlements
            ? "Update Description"
            : isEditMode
            ? "Update Expense"
            : "Add Expense"}
        </button>

        {isEditMode && (
          <button
            disabled={
              deleteMutation.isPending || queryGetExpense?.data?.hasSettlements
            }
            onClick={() => {
              if (queryGetExpense?.data?.hasSettlements) {
                toast.error("Cannot delete expense with settlements");
                return;
              }
              if (
                window.confirm("Are you sure you want to delete this expense?")
              ) {
                deleteMutation.mutate();
                toast.success("Expense deleted");
                history.goBack();
              }
            }}
            className={`w-full py-3 rounded-lg font-medium transition ${
              queryGetExpense?.data?.hasSettlements
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200"
            }`}
          >
            {queryGetExpense?.data?.hasSettlements
              ? "Cannot Delete (Has Settlements)"
              : "Delete Expense"}
          </button>
        )}
      </div>
    </div>
  );
};

export default AddExpense;
