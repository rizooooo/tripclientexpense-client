import { useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Receipt,
  Share2,
  MoreVertical,
  Trash2,
  X,
  Copy,
  Check,
  Users as UsersIcon,
  PencilLine,
  ChevronRight,
  Users,
  Archive,
  Info,
  CreditCard,
} from "lucide-react";
import useApi from "@/hooks/useApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDateRange, formatRelativeDate } from "@/utils/date";
import toast from "react-hot-toast";
import copy from "copy-to-clipboard";
import { useAuth } from "@/context/AuthContext";
import { getCurrencySymbol } from "@/lib/utils";
import PullToRefresh from "@/components/PullToRefresh";
import type { TripMemberDto, ExpenseDto } from "api";

const getSplitLabel = (splitType: string, splitCount: number) => {
  switch (splitType) {
    case "Equal":
      return `split ${splitCount} ways`;
    case "Custom":
      return `${splitCount} custom splits`;
    case "PaidFor":
      return `paid for ${splitCount} ${splitCount === 1 ? "person" : "people"}`;
    case "Percentage":
      return `${splitCount} % splits`;
    default:
      return `${splitCount} splits`;
  }
};

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
  const queryClient = useQueryClient();
  const [showMembers, setShowMembers] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const { trip: tripApi, expense } = useApi();
  const { tripId } = useParams<{ tripId: string }>();

  const [activeTab, setActiveTab] = useState("expenses");
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const { currentAuth } = useAuth();

  const queryTripDetail = useQuery({
    queryKey: [`getTripDetail`, { tripId }],
    queryFn: async () => {
      const response = await tripApi.apiTripsIdDetailsGet({
        id: +tripId,
      });

      return response;
    },
    enabled: !!tripId,
  });

  const isArchived = queryTripDetail?.data?.isArchived;

  const queryExpenses = useQuery({
    queryKey: [`getTripExpenses`, { tripId }],
    queryFn: async () => {
      const response = await expense.apiExpensesGet({ tripId: +tripId });

      return response;
    },
    enabled: !!tripId,
  });

  const queryMyExpenses = useQuery({
    queryKey: [`getMyExpensesTripDetail`, { tripId }],
    queryFn: async () => {
      const response =
        await expense.apiExpensesMemberUserIdTripTripIdBreakdownGet({
          tripId: parseInt(tripId),
          userId: currentAuth?.userId,
          myExpensesOnly: true,
        });
      return response;
    },
    enabled: !!tripId && !!currentAuth?.userId && activeTab === "myExpenses",
  });

  const trip = queryTripDetail?.data;
  const expenses = queryExpenses?.data || [];
  const myExpensesData = queryMyExpenses?.data;

  const totalMyExpenses =
    myExpensesData?.transactions?.reduce(
      (sum, t) => sum + (t.totalExpenseAmount || 0),
      0
    ) || 0;
  const mutationShare = useMutation({
    onSuccess: (response) => {
      setInviteLink(response?.inviteLink || "");
      setShowInviteModal(true);
      setShowMenu(false);
    },
    onError: () => {
      toast.error("Failed to generate invite link");
    },
    mutationFn: async () => {
      const response = await tripApi.apiTripsIdInvitePost({
        expiryDays: 30,
        id: +tripId,
      });

      return response;
    },
  });

  const mutationDelete = useMutation({
    onSuccess: () => {
      toast.success("Trip deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["getTrips"] });
      history.replace("/");
    },
    onError: () => {
      toast.error("Failed to delete trip");
    },
    mutationFn: async () => {
      await tripApi.apiTripsIdDelete({ id: +tripId });
    },
  });

  const mutationArchive = useMutation({
    onSuccess: () => {
      if (trip?.isArchived) {
        toast.success("Trip unarchived successfully");
      } else {
        toast.success("Trip archived successfully");
      }

      queryClient.invalidateQueries({ queryKey: ["getDashboardTotalShare"] });
      queryClient.invalidateQueries({
        queryKey: [`getTripDetail`, { tripId }],
      });
      setShowMenu(false);
    },
    onError: () => {
      toast.error("Failed to archive trip");
    },
    mutationFn: async () => {
      const basePath = import.meta.env.VITE_API;
      const token = currentAuth?.token;

      if (trip?.isArchived) {
        const response = await tripApi.apiTripsIdUnarchivePost({
          id: +trip?.id,
        });

        return response;
      }

      const response = await tripApi?.apiTripsIdArchivePost({
        id: +trip?.id,
      });

      return response;
    },
  });

  const handleShare = () => {
    mutationShare.mutate();
  };

  const handleDeleteConfirm = () => {
    mutationDelete.mutate();
    setShowDeleteModal(false);
  };

  const handleRefresh = async () => {
    await Promise.all([queryTripDetail.refetch(), queryExpenses.refetch()]);
  };

  // Show skeleton while loading
  if (
    queryTripDetail?.isPending ||
    queryExpenses?.isPending ||
    queryExpenses?.isFetching ||
    queryExpenses?.isRefetching ||
    queryTripDetail?.isFetching ||
    queryTripDetail?.isRefetching
  ) {
    return <LoadingSkeleton />;
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header - Conditional Styling */}
        <div
          className={
            trip?.isArchived
              ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white p-4 pb-6" // Archived style
              : "bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 pb-6" // Default style
          }
        >
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => history.replace("/")}
              className={
                trip?.isArchived
                  ? "text-white active:text-gray-100" // Archived style
                  : "text-white active:text-blue-100" // Default style
              }
              aria-label="Go back to home"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-semibold">{trip?.name}</h1>
              <p
                className={
                  trip?.isArchived
                    ? "text-gray-100 text-sm"
                    : "text-blue-100 text-sm"
                }
              >
                {formatDateRange(trip?.startDate, trip?.endDate)}
              </p>
            </div>

            {/* Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 active:bg-white/20 rounded-lg transition"
                aria-label="Open menu"
              >
                <MoreVertical size={20} />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <>
                  {/* Backdrop to close menu */}
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowMenu(false)}
                  />

                  {/* Menu Items */}
                  <div className="absolute right-0 top-12 bg-white rounded-lg shadow-xl border border-gray-200 py-2 min-w-[200px] z-40 animate-fade-in">
                    {!trip?.isArchived && (
                      <>
                        <button
                          onClick={handleShare}
                          disabled={mutationShare.isPending}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition flex items-center gap-3 disabled:opacity-50"
                        >
                          <Share2 size={18} className="text-gray-600" />
                          <span className="text-gray-800 font-medium">
                            {mutationShare.isPending
                              ? "Generating..."
                              : "Share Trip"}
                          </span>
                        </button>

                        <button
                          onClick={() =>
                            history.push({
                              pathname: `/trips/edit/${trip?.id}`,
                              state: {
                                trip,
                              },
                            })
                          }
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition flex items-center gap-3 disabled:opacity-50"
                        >
                          <PencilLine size={18} className="text-gray-600" />
                          <span className="text-gray-800 font-medium">
                            Edit Trip
                          </span>
                        </button>

                        <div className="border-t border-gray-100 my-1" />
                      </>
                    )}

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        mutationArchive.mutate();
                      }}
                      disabled={mutationArchive.isPending}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 transition flex items-center gap-3 disabled:opacity-50"
                    >
                      <Archive size={18} className="text-gray-600" />
                      <span className="text-gray-800 font-medium">
                        {/* Updated button label for Archive/Unarchive */}
                        {mutationArchive.isPending
                          ? trip?.isArchived
                            ? "Unarchiving..."
                            : "Archiving..."
                          : trip?.isArchived
                          ? "Unarchive Trip"
                          : "Archive Trip"}
                      </span>
                    </button>

                    <div className="border-t border-gray-100 my-1" />

                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowDeleteModal(true);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-red-50 active:bg-red-100 transition flex items-center gap-3"
                    >
                      <Trash2 size={18} className="text-red-600" />
                      <span className="text-red-600 font-medium">
                        Delete Trip
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 🚨 ARCHIVED MESSAGE BANNER - NEW */}
          {trip?.isArchived && (
            <div className="bg-white/10 border border-white/30 rounded-lg p-3 mt-3 shadow-md">
              <div className="flex items-center justify-center gap-2 text-white">
                <Archive size={20} />
                <p className="text-sm font-medium">
                  This trip is archived. To resume activity, unarchive it.
                </p>
              </div>
            </div>
          )}

          {/* Trip Summary Cards - Conditional Text Color */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <p
                className={
                  trip?.isArchived
                    ? "text-gray-100 text-xs mb-1"
                    : "text-blue-100 text-xs mb-1"
                }
              >
                Total Spent
              </p>
              <p className="text-2xl font-bold">
                {getCurrencySymbol(trip?.currency)}
                {trip?.totalSpent}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <p
                className={
                  trip?.isArchived
                    ? "text-gray-100 text-xs mb-1"
                    : "text-blue-100 text-xs mb-1"
                }
              >
                Your Share
              </p>
              <p className="text-2xl font-bold">
                {getCurrencySymbol(trip?.currency)}
                {trip?.yourShare}
              </p>
            </div>
          </div>
        </div>

        {/* NEW: Members Section - Below Header */}
        <div className="px-4 -mt-2 mb-4 relative z-10">
          <button
            onClick={() => setShowMembers(!showMembers)}
            className="w-full bg-white rounded-xl shadow-md p-4 flex items-center justify-between hover:shadow-lg transition active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Users className="text-purple-600" size={20} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800">Trip Members</p>
                <p className="text-xs text-gray-500">
                  {trip?.members?.length || 0} people
                </p>
              </div>
            </div>

            {/* Member Avatars Preview */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {trip?.members
                  ?.slice(0, 3)
                  .map((member: TripMemberDto, index: number) => (
                    <div
                      key={member.id}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold border-2 border-white"
                      style={{ zIndex: 3 - index }}
                    >
                      {member.avatar}
                    </div>
                  ))}
                {trip?.members?.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-semibold border-2 border-white">
                    +{trip.members.length - 3}
                  </div>
                )}
              </div>
              <ChevronRight
                className={`text-gray-400 transition-transform ${
                  showMembers ? "rotate-90" : ""
                }`}
                size={20}
              />
            </div>
          </button>

          {/* Expandable Members List */}
          {showMembers && (
            <div className="mt-2 bg-white rounded-xl shadow-md overflow-hidden animate-slide-down">
              {trip?.members?.map((member: TripMemberDto) => (
                <div
                  key={member.id}
                  onClick={() => {
                    history.push(`/trips/${tripId}/members/${member.userId}`);
                  }}
                  className="flex items-center gap-3 p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {member.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{member.name}</p>
                    <p className="text-xs text-gray-500">
                      {member.userId === currentAuth?.userId
                        ? "You"
                        : "Trip member"}
                    </p>
                  </div>
                  <ChevronRight className="text-gray-400" size={16} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trip Description Section - Only show if description exists */}
        {trip?.description && (
          <div className="px-4 mb-4">
            <button
              onClick={() => setShowDescription(!showDescription)}
              className="w-full bg-white rounded-xl shadow-md p-4 flex items-center justify-between hover:shadow-lg transition active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Info className="text-blue-600" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">About this trip</p>
                  <p className="text-xs text-gray-500">
                    {showDescription ? "Hide" : "Show"} description
                  </p>
                </div>
              </div>
              <ChevronRight
                className={`text-gray-400 transition-transform ${
                  showDescription ? "rotate-90" : ""
                }`}
                size={20}
              />
            </button>

            {/* Expandable Description */}
            {showDescription && (
              <div className="mt-2 bg-white rounded-xl shadow-md p-4 animate-slide-down">
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {trip.description}
                </p>
              </div>
            )}
          </div>
        )}

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
          <button
            onClick={() => setActiveTab("myExpenses")}
            className={`py-3 font-medium text-sm relative ${
              activeTab === "myExpenses" ? "text-blue-600" : "text-gray-500"
            }`}
          >
            My Expenses
            {activeTab === "myExpenses" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
        </div>
        {activeTab === "expenses" && (
          <>
            {/* Add Expense Button - HIDDEN IF ARCHIVED */}
            {trip && expenses.length > 0 && !trip?.isArchived && (
              <div className="px-4 mt-4">
                <button
                  onClick={() =>
                    history.push({
                      pathname: `/trips/${tripId}/expenses/add`,
                      state: {
                        members: queryTripDetail?.data?.members,
                        trip,
                      },
                    })
                  }
                  className="w-full bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-medium hover:bg-blue-700 active:bg-blue-800 transition"
                >
                  <Plus size={20} />
                  Add Expense
                </button>
              </div>
            )}

            {/* Expenses List */}
            <div className="px-4 mt-4 space-y-3 pb-4">
              {expenses.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
                  <Receipt className="mx-auto text-gray-300 mb-3" size={48} />
                  <p className="text-gray-500 mb-4">No expenses yet</p>
                  {/* Add First Expense Button - HIDDEN IF ARCHIVED */}
                  {!trip?.isArchived && (
                    <button
                      onClick={() =>
                        history.push({
                          pathname: `/trips/${tripId}/expenses/add`,
                          state: {
                            members: queryTripDetail?.data?.members,
                            trip,
                          },
                        })
                      }
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
                    >
                      Add First Expense
                    </button>
                  )}
                </div>
              ) : (
                expenses &&
                expenses?.map((expense: ExpenseDto) => (
                  <div
                    key={expense.id}
                    onClick={() => {
                      if (
                        expense?.paidByUserId === currentAuth?.userId &&
                        !trip?.isArchived
                      ) {
                        history.push({
                          pathname: `/trips/${tripId}/expenses/${expense.id}/edit`,
                          state: {
                            members: queryTripDetail?.data?.members,
                          },
                        });
                      }
                    }}
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
                            {formatRelativeDate(expense?.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-800">
                          {expense?.currency &&
                            getCurrencySymbol(expense.currency)}
                          {expense.amount}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getSplitLabel(
                            expense?.splitType,
                            expense.splitCount
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-semibold text-green-700">
                        {expense?.paidByName?.[0]}
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">
                          {expense.paidByName}
                        </span>{" "}
                        paid
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === "myExpenses" && (
          <div className="px-4 mt-4 space-y-4 pb-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs uppercase tracking-wide font-semibold mb-1">
                    Total You Paid
                  </p>
                  <p className="text-xl font-bold text-gray-800">
                    {myExpensesData?.transactions?.length || 0} transactions
                  </p>
                </div>
                <p className="text-4xl font-bold text-blue-600">
                  {getCurrencySymbol(trip?.currency)}
                  {totalMyExpenses.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {myExpensesData?.transactions?.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
                  <Receipt className="mx-auto text-gray-300 mb-3" size={48} />
                  <p className="text-gray-500">
                    You haven't paid any expenses yet
                  </p>
                </div>
              ) : (
                myExpensesData?.transactions?.map((transaction) => {
                  const isExpense = transaction.type === "Expense";
                  const isPayment = transaction.type === "Payment";

                  return (
                    <div
                      key={`${transaction.type}-${transaction.transactionId}`}
                    >
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start gap-3 flex-1">
                            <div
                              className={`p-2 rounded-lg ${
                                isExpense
                                  ? "bg-blue-100"
                                  : isPayment
                                  ? "bg-green-100"
                                  : "bg-purple-100"
                              }`}
                            >
                              {isExpense ? (
                                <Receipt className="text-blue-600" size={18} />
                              ) : (
                                <CreditCard
                                  className="text-green-600"
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
                                      ? "bg-blue-100 text-blue-600"
                                      : isPayment
                                      ? "bg-green-100 text-green-600"
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
                                  You paid • Total:{" "}
                                  {getCurrencySymbol(trip?.currency)}
                                  {transaction.totalExpenseAmount?.toFixed(2)}
                                </p>
                              )}

                              {isPayment && (
                                <p className="text-xs text-gray-500 mt-1">
                                  You paid • Settlement
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
                            <p className="text-lg font-bold text-gray-800">
                              {getCurrencySymbol(trip?.currency)}
                              {transaction.totalExpenseAmount?.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
              onClick={() => {
                setShowInviteModal(false);
                setCopied(false);
              }}
            />

            {/* Modal */}
            <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
              <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl p-6 shadow-2xl">
                {/* Close Button */}
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setCopied(false);
                  }}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 active:text-gray-800"
                  aria-label="Close invite modal"
                >
                  <X size={24} />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <UsersIcon className="text-blue-600" size={32} />
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
                  Invite Friends
                </h3>
                <p className="text-gray-600 text-center text-sm mb-6">
                  Share this code to invite people to{" "}
                  <span className="font-semibold">"{trip?.name}"</span>
                </p>

                {/* HUGE Code Display */}
                <div className="relative mb-6">
                  {/* Decorative Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-3xl blur-sm"></div>

                  {/* Code Container */}
                  <div className="relative bg-white rounded-3xl p-8 shadow-lg border-2 border-blue-200">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 uppercase tracking-widest mb-3 font-semibold">
                        Your Invite Code
                      </p>
                      {/* The Code - MASSIVE */}
                      <div
                        onClick={() => {
                          const token = mutationShare.data?.inviteToken;
                          if (token) {
                            copy(token);
                            setCopied(true);
                            toast.success("Code copied!");
                            setTimeout(() => setCopied(false), 2000);
                          }
                        }}
                        className="cursor-pointer active:scale-95 transition-transform"
                      >
                        <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 tracking-[0.5em] font-mono select-all">
                          {mutationShare.data?.inviteToken || "----"}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-4">
                        Tap to copy • Valid for 30 days
                      </p>
                    </div>
                  </div>
                </div>

                {/* How to use */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-bold text-sm">1</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">
                        Share the code via text, chat, or email
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 mt-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-blue-600 font-bold text-sm">2</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">
                        They enter it in the app under "Join Trip"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      const token = mutationShare.data?.inviteToken;
                      if (token) {
                        copy(token);
                        setCopied(true);
                        toast.success("Code copied to clipboard!");
                        setTimeout(() => setCopied(false), 2000);
                      }
                    }}
                    className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 active:bg-blue-800 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                  >
                    {copied ? (
                      <>
                        <Check size={20} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={20} />
                        Copy Code
                      </>
                    )}
                  </button>

                  {/* Native Share (if available) */}
                  {navigator.share && (
                    <button
                      onClick={() => {
                        const token = mutationShare.data?.inviteToken;
                        navigator
                          .share({
                            title: `Join ${trip?.name}`,
                            text: `You're invited to "${trip?.name}"!\n\nJoin using code: ${token}\n\nOr use this link: ${inviteLink}`,
                          })
                          .catch(() => {
                            // User cancelled share
                          });
                      }}
                      className="w-full bg-gray-100 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-200 active:bg-gray-300 transition flex items-center justify-center gap-2"
                    >
                      <Share2 size={20} />
                      Share Code
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 z-40 animate-fade-in" />

            {/* Modal */}
            <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
              <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl p-6 shadow-2xl">
                {/* Close Button */}
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 active:text-gray-800"
                  aria-label="Close delete modal"
                >
                  <X size={24} />
                </button>

                {/* Warning Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="text-red-600" size={32} />
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
                  Delete Trip?
                </h3>
                <p className="text-gray-600 text-center text-sm mb-4">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold">"{trip?.name}"</span>?
                </p>
                <p className="text-gray-600 text-center text-sm mb-6">
                  This will permanently delete all expenses and balances. This
                  action cannot be undone.
                </p>

                {/* Warning Box */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                  <p className="text-red-800 text-xs text-center font-medium">
                    ⚠️ All members will lose access to this trip
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={mutationDelete.isPending}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 active:bg-gray-300 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={mutationDelete.isPending}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 active:bg-red-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {mutationDelete.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={18} />
                        Delete Trip
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </PullToRefresh>
  );
};

export default TripDetail;
