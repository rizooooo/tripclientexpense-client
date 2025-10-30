import React, { useEffect, useState } from "react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, ReceiptRussianRuble } from "lucide-react";
import toast from "react-hot-toast";
import useApi from "@/hooks/useApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExpenseCreateDto, TripMemberDto } from "api";
import { useAuth } from "@/context/AuthContext";

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
    state: { members },
  } = useLocation<{
    members: TripMemberDto[];
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
    date: new Date().toISOString().split("T")[0],
  });

  const [selectedMembers, setSelectedMembers] = useState(
    members.map((m) => m.userId)
  );

  const [customAmounts, setCustomAmounts] = useState(
    members.reduce((acc, m) => ({ ...acc, [m.userId]: "" }), {})
  );

  const toggleMember = (memberId: number) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
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
        expenseCreateDto: {
          ...params,
        },
      });
    },onSuccess: () => {
      queryClient.invalidateQueries([`getTripDetail`]);
      queryClient.invalidateQueries([`getTripExpenses`]);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await expenseApi.apiExpensesIdDelete({
        id: +expenseId,
      });
    },
  });

  const handleSubmit = () => {
    // Validation
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

    if (splitType === "Custom") {
      const total = calculateTotal();
      const expenseAmount = parseFloat(expenseData.amount);
      if (Math.abs(total - expenseAmount) > 0.01) {
        toast.error("Custom amounts must match total expense amount");
        return;
      }
    }
    const isSplitEqual = splitType === "Equal";

    mutation.mutate({
      amount: +expenseData?.amount,
      description: expenseData?.description,
      expenseDate: new Date(expenseData?.date),
      paidByUserId: +expenseData?.paidBy, // todo should be handled BE,
      splitType,
      tripId: +tripId,
      category: "",

      splits: isSplitEqual
        ? null
        : members?.map((item) => ({
            userId: item?.userId,
            amount:
              item && customAmounts?.[item.userId]
                ? customAmounts?.[item?.userId]
                : 0,
          })),
    });

    // TODO: Save expense to database
    toast.success(isEditMode ? "Expense updated!" : "Expense added!");
    history.goBack();
  };

  useEffect(() => {
    if (isEditMode && queryGetExpense?.isSuccess && queryGetExpense?.data) {
      setExpenseData({
        amount: queryGetExpense?.data?.amount,
        date: new Date(queryGetExpense?.data?.expenseDate)
          .toISOString()
          .split("T")[0],
        description: queryGetExpense?.data?.description,
        paidBy: queryGetExpense?.data?.paidByUserId,
      });
    }
  }, [queryGetExpense?.isSuccess, isEditMode]);

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
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
        {/* Basic Info */}
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
              Total Amount (₱) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder="0.00"
              step="0.01"
              value={expenseData.amount}
              onChange={(e) =>
                setExpenseData({ ...expenseData, amount: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl font-semibold"
            />
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={expenseData.date}
              onChange={(e) =>
                setExpenseData({ ...expenseData, date: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Split Method */}
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Split Method</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSplitType("Equal")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  splitType === "Equal"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 active:bg-gray-200"
                }`}
              >
                Equal
              </button>
              <button
                onClick={() => setSplitType("Custom")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  splitType === "Custom"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 active:bg-gray-200"
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          {splitType === "Equal" ? (
            <>
              <div className="space-y-2">
                {members.map((member) => {
                  const isSelected = selectedMembers.includes(member.userId);
                  const equalShare = expenseData.amount
                    ? (
                        parseFloat(expenseData.amount) / selectedMembers.length
                      ).toFixed(2)
                    : "0.00";

                  return (
                    <label
                      key={member.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                        isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMember(member.userId!)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                        {member.avatar}
                      </div>
                      <span className="flex-1 font-medium text-gray-800">
                        {member.name}
                      </span>
                      {isSelected && (
                        <span className="text-sm font-semibold text-gray-700">
                          ₱{equalShare}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Each person pays an equal share
              </p>
            </>
          ) : (
            <>
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
                      <span className="text-gray-600">₱</span>
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
                    ₱{calculateTotal().toFixed(2)}
                  </span>
                </div>
                {expenseData.amount &&
                  Math.abs(calculateTotal() - parseFloat(expenseData.amount)) >
                    0.01 && (
                    <p className="text-xs text-red-600 mt-2 text-center">
                      ⚠️ Split amounts must equal ₱
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

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition"
        >
          {isEditMode ? "Update Expense" : "Add Expense"}
        </button>

        {/* Delete Button (only in edit mode) */}
        {isEditMode && (
          <button
            disabled={deleteMutation.isPending}
            onClick={() => {
              if (
                window.confirm("Are you sure you want to delete this expense?")
              ) {
                deleteMutation.mutate();
                // TODO: Delete expense
                toast.success("Expense deleted");
                history.goBack();
              }
            }}
            className="w-full bg-red-50 text-red-600 py-3 rounded-lg font-medium hover:bg-red-100 active:bg-red-200 transition"
          >
            Delete Expense
          </button>
        )}
      </div>
    </div>
  );
};

export default AddExpense;
