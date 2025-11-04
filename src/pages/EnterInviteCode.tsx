import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { ArrowLeft, Users, Hash, Loader } from 'lucide-react';
import useApi from '@/hooks/useApi';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const EnterInviteCode = () => {
  const history = useHistory();
  const { trip } = useApi();
  const [inviteCode, setInviteCode] = useState('');

  const mutationJoin = useMutation({
    onSuccess: (response) => {
      if (response?.tripId) {
        toast.success('Successfully joined trip!');
        history.replace(`/trips/${response.tripId}`);
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Invalid or expired invite code');
    },
    mutationFn: async (code: string) => {
      const response = await trip.apiTripsJoinPost({
        joinTripDto: {
          inviteToken: code,
        },
      });
      return response;
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    mutationJoin.mutate(inviteCode.trim());
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInviteCode(text.trim());
      toast.success('Code pasted!');
    } catch (err) {
      toast.error('Failed to paste from clipboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Back Button */}
        <button
          onClick={() => history.goBack()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition"
        >
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center">
            <Users className="text-white" size={40} />
          </div>
        </div>

        {/* Title & Description */}
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Join a Trip
        </h1>
        <p className="text-gray-600 text-center text-sm mb-8">
          Enter the invite code you received to join a trip
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invite Code Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invite Code
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="abc123xyz456"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                disabled={mutationJoin.isLoading}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-mono text-center text-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                autoComplete="off"
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              The code is case-sensitive
            </p>
          </div>

          {/* Paste Button */}
          <button
            type="button"
            onClick={handlePaste}
            disabled={mutationJoin.isLoading}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 active:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Paste from Clipboard
          </button>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={mutationJoin.isLoading || !inviteCode.trim()}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {mutationJoin.isLoading ? (
              <>
                <Loader className="animate-spin" size={20} />
                Joining...
              </>
            ) : (
              'Join Trip'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-sm text-gray-500">OR</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 text-center">
            <span className="font-semibold">Don't have a code?</span>
            <br />
            Ask the trip creator to share an invite link with you
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnterInviteCode;