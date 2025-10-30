import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { ArrowLeft, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import type { TripCreateDto } from "api";
import useApi from "@/hooks/useApi";

type TForm = TripCreateDto;

const CreateTrip = () => {
  const history = useHistory();
  // const [step, setStep] = useState(1);
  const { trip, user } = useApi();

  // ===============================
  // 🔹 React Hook Form Setup
  // ===============================
  const form = useForm<TForm>({
    defaultValues: {
      name: "",
      description: "",
      startDate: undefined as unknown as Date,
      endDate: undefined as unknown as Date,
    },
  });

  // ===============================
  // 🔹 Fetch available members
  // ===============================
  // const { data: membersList = [], isLoading: isLoadingMembers } = useQuery({
  //   queryKey: ["members"],
  //   queryFn: async () => {
  //     const res = await user.apiUsersGet();
  //     return res.data || [];
  //   },
  // });

  // ===============================
  // 🔹 Create Trip Mutation
  // ===============================
  const createTripMutation = useMutation({
    mutationFn: async (payload: TripCreateDto) =>
      trip.apiTripsPost({
        tripCreateDto: payload,
      }),
    onSuccess: () => {
      toast.success("Trip created successfully!");
      history.push("/");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create trip");
    },
  });

  // ===============================
  // 🔹 Add / Remove Members
  // ===============================
  // const handleAddMember = (id: number, name: string) => {
  //   const current = form.getValues("members");
  //   if (!current.find((m) => m.id === id)) {
  //     form.setValue("members", [...current, { id, name }]);
  //   }
  // };

  // const handleRemoveMember = (id: number) => {
  //   form.setValue(
  //     "members",
  //     form.getValues("members").filter((m) => m.id !== id)
  //   );
  // };

  // ===============================
  // 🔹 Step Navigation
  // ===============================
  // const handleNext = () => {
  //   const values = form.getValues();

  //   if (step === 1) {
  //     if (!values.name || !values.startDate || !values.endDate) {
  //       toast.error("Please fill in all required fields");
  //       return;
  //     }
  //     setStep(2);
  //   } else if (step === 2) {
  //     if (values.members.length === 0) {
  //       toast.error("Add at least one member");
  //       return;
  //     }
  //     setStep(3);
  //   }
  // };

  const handleSubmit = (values: TForm) => {
    createTripMutation.mutate({
      name: values.name,
      description: values.description,
      startDate: values.startDate,
      endDate: values.endDate,
      memberIds: [],
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => history.replace("/")}
            className="text-gray-600 active:text-gray-800"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-semibold">Create New Trip</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Step Indicator */}
        {/* <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((num) => (
            <React.Fragment key={num}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= num
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {num}
              </div>
              {num < 3 && (
                <div
                  className={`w-12 h-0.5 ${
                    step > num ? "bg-blue-600" : "bg-gray-300"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div> */}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl p-5 shadow-sm animate-fade-in space-y-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">
                Trip Details
              </h2>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trip Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Palawan Adventure" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={
                            field.value ? format(field.value, "yyyy-MM-dd") : ""
                          }
                          onChange={(e) =>
                            field.onChange(new Date(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={
                            field.value ? format(field.value, "yyyy-MM-dd") : ""
                          }
                          onChange={(e) =>
                            field.onChange(new Date(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What's this trip about?"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type={"submit"}
                className="flex-1"
                disabled={createTripMutation.isPending}
              >
                {createTripMutation.isPending ? "Creating..." : "Create Trip"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default CreateTrip;
