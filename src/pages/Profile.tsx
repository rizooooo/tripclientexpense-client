import React from "react";
import { useHistory } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Bell,
  Shield,
  LogOut,
  Receipt,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

const Profile = () => {
  const history = useHistory();
  const { logout, currentAuth } = useAuth();

  const user = currentAuth;

  const handleLogout = () => {
    // TODO: Implement logout

    logout();
    toast.success("Logged out successfully");

    history.replace("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => history.push("/")}
            className="text-white active:text-blue-100"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-semibold">Profile</h1>
        </div>

        {/* User Info */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl mb-3 border-2 border-white/30">
            {user?.avatar}
          </div>
          <h2 className="text-2xl font-bold mb-1">{user?.name}</h2>
          <p className="text-blue-100 text-sm">{user?.email}</p>
        </div>
      </div>

      {/* Settings */}
      <div className="px-4 mt-4 space-y-4">
        {/* Account Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <button className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition rounded-t-xl">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="text-blue-600" size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-800">Edit Profile</p>
              <p className="text-xs text-gray-500">
                Update your name and details
              </p>
            </div>
            <span className="text-gray-400">›</span>
          </button>

          <div className="border-t border-gray-100"></div>

          <button className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Mail className="text-purple-600" size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-800">Email Preferences</p>
              <p className="text-xs text-gray-500">
                Manage email notifications
              </p>
            </div>
            <span className="text-gray-400">›</span>
          </button>

          <div className="border-t border-gray-100"></div>

          <button className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition rounded-b-xl">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <Bell className="text-amber-600" size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-800">Notifications</p>
              <p className="text-xs text-gray-500">
                Push notification settings
              </p>
            </div>
            <span className="text-gray-400">›</span>
          </button>
        </div>

        {/* App Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <button className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition rounded-t-xl">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="text-green-600" size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-800">Privacy & Security</p>
              <p className="text-xs text-gray-500">Control your data</p>
            </div>
            <span className="text-gray-400">›</span>
          </button>

          <div className="border-t border-gray-100"></div>

          <button className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition rounded-b-xl">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Receipt className="text-blue-600" size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-800">About</p>
              <p className="text-xs text-gray-500">Version 1.0.0</p>
            </div>
            <span className="text-gray-400">›</span>
          </button>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-600 p-4 rounded-xl font-medium hover:bg-red-100 active:bg-red-200 transition flex items-center justify-center gap-2"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 px-6 py-3 bottom-nav-safe">
        <div className="flex items-center justify-around">
          <button
            onClick={() => history.push("/")}
            className="flex flex-col items-center gap-1 text-gray-400 active:text-gray-600"
          >
            <Receipt size={24} />
            <span className="text-xs">Trips</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-blue-600">
            <User size={24} />
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
