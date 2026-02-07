import { useState, useEffect } from "react";
import { userApi, type Profile as ProfileType } from "@/lib/api/user";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { formatRWF } from "@/lib/utils/currency";
import { canEdit } from "@/lib/types/role";

const Profile = () => {
  const { user } = useAuth();
  const userCanEdit = canEdit(user?.role);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    nationalId: "",
    oldPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await userApi.getProfile();
      setProfile(response.profile);
      setFormData({
        name: response.profile.name || "",
        email: response.profile.email || "",
        phoneNumber: response.profile.phoneNumber || "",
        nationalId: response.profile.nationalId || "",
        oldPassword: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load profile");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    }

    if (!formData.nationalId.trim()) {
      newErrors.nationalId = "National ID is required";
    }

    // Password validation (only if password is being changed)
    if (formData.password || formData.oldPassword) {
      if (!formData.oldPassword) {
        newErrors.oldPassword = "Current password is required to change password";
      }
      if (!formData.password) {
        newErrors.password = "New password is required";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !user) {
      return;
    }

    try {
      setIsSaving(true);

      const updateData: any = {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        nationalId: formData.nationalId,
      };

      // Only include password fields if password is being changed
      if (formData.password && formData.oldPassword) {
        updateData.oldPassword = formData.oldPassword;
        updateData.password = formData.password;
      }

      await userApi.updateProfile(user.id, updateData);
      toast.success("Profile updated successfully");
      setIsEditing(false);
      fetchProfile();
      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        oldPassword: "",
        password: "",
        confirmPassword: "",
      }));
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to update profile"
      );
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phoneNumber: profile.phoneNumber || "",
        nationalId: profile.nationalId || "",
        oldPassword: "",
        password: "",
        confirmPassword: "",
      });
    }
    setErrors({});
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">
            View and edit your profile information
          </p>
        </div>
        {!isEditing && userCanEdit && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit Profile
          </button>
        )}
        {!userCanEdit && (
          <span className="text-sm text-gray-500">Read-only mode</span>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  isEditing
                    ? "border-gray-300 bg-white"
                    : "border-gray-200 bg-gray-50"
                } ${errors.name ? "border-red-500" : ""}`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  isEditing
                    ? "border-gray-300 bg-white"
                    : "border-gray-200 bg-gray-50"
                } ${errors.email ? "border-red-500" : ""}`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  isEditing
                    ? "border-gray-300 bg-white"
                    : "border-gray-200 bg-gray-50"
                } ${errors.phoneNumber ? "border-red-500" : ""}`}
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            {/* National ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                National ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nationalId}
                onChange={(e) =>
                  setFormData({ ...formData, nationalId: e.target.value })
                }
                disabled={!isEditing}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  isEditing
                    ? "border-gray-300 bg-white"
                    : "border-gray-200 bg-gray-50"
                } ${errors.nationalId ? "border-red-500" : ""}`}
              />
              {errors.nationalId && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.nationalId}
                </p>
              )}
            </div>

            {/* Role (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <input
                type="text"
                value={profile.role}
                disabled
                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-500"
              />
            </div>

            {/* Salary (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salary
              </label>
              <input
                type="text"
                value={
                  profile.salary
                    ? formatRWF(profile.salary)
                    : "Not set"
                }
                disabled
                className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Salary cannot be edited. Contact an administrator to change it.
              </p>
            </div>
          </div>

          {/* Password Change Section */}
          {isEditing && (
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Change Password (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={formData.oldPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        oldPassword: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      errors.oldPassword ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Leave blank to keep current password"
                  />
                  {errors.oldPassword && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.oldPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Leave blank to keep current password"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      errors.confirmPassword
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Leave blank to keep current password"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Profile;

