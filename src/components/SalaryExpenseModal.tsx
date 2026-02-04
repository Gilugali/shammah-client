import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { expenseApi, Expensetype } from "@/lib/api/expense";
import { userApi, type User } from "@/lib/api/user";
import { formatRWF } from "@/lib/utils/currency";

interface SalaryExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function formatMonthLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Salaries";
  return `Salaries - ${d.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })}`;
}

function lastDayOfPreviousMonthISO() {
  const now = new Date();
  const lastDayPrev = new Date(now.getFullYear(), now.getMonth(), 0);
  return lastDayPrev.toISOString().split("T")[0];
}

const SalaryExpenseModal = ({
  isOpen,
  onClose,
  onSuccess,
}: SalaryExpenseModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setIsLoadingUsers(true);
    setSearch("");
    setDate(new Date().toISOString().split("T")[0]);

    userApi
      .getAll()
      .then((res) => {
        setUsers(res.users || []);
        const initial: Record<string, boolean> = {};
        (res.users || [])
          .filter((u) => u.active && (u.salary ?? 0) > 0)
          .forEach((u) => {
            initial[u.id] = true;
          });
        setSelectedIds(initial);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load users");
      })
      .finally(() => setIsLoadingUsers(false));
  }, [isOpen]);

  const activeSalaryUsers = useMemo(() => {
    return users.filter((u) => u.active && (u.salary ?? 0) > 0);
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeSalaryUsers;
    return activeSalaryUsers.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const phone = (u.phoneNumber || "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [activeSalaryUsers, search]);

  const { selectedUsers, total } = useMemo(() => {
    const selected = activeSalaryUsers.filter((u) => !!selectedIds[u.id]);

    const sum = selected.reduce((acc, u) => acc + Number(u.salary ?? 0), 0);

    return { selectedUsers: selected, total: sum };
  }, [activeSalaryUsers, selectedIds]);
  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    activeSalaryUsers.forEach((u) => {
      next[u.id] = checked;
    });
    setSelectedIds(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUsers.length === 0) {
      toast.error("Select at least one active staff member");
      return;
    }
    if (!date) {
      toast.error("Please select a date");
      return;
    }
    if (!(total > 0)) {
      toast.error("Total salary must be greater than 0");
      return;
    }

    setIsLoading(true);
    try {
      const name = `${formatMonthLabel(date)} (${selectedUsers.length} staff)`;
      await expenseApi.create({
        name,
        date,
        amount: total,
        type: Expensetype.OPERATIONAL,
      });
      toast.success("Salary expense added successfully");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to add salary expense",
      );
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="fixed inset-0 bg-black/40 bg-opacity-10 backdrop-blur-[3px] transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold leading-6 text-gray-900">
                  Add Salaries Expense
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Select active staff to include; we’ll create one OPERATIONAL
                  expense.
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white px-4 pt-5 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Search staff
                </label>
                <input
                  id="search"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, or phone..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Expense date
                </label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setDate(lastDayOfPreviousMonthISO())}
                  className="mt-2 text-xs font-medium text-teal-700 hover:text-teal-800"
                >
                  Use last day of previous month
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleAll(true)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isLoadingUsers}
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => toggleAll(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isLoadingUsers}
                >
                  Select none
                </button>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Selected:</span>{" "}
                <span className="font-semibold text-gray-900">
                  {selectedUsers.length}
                </span>
                <span className="text-gray-600"> • Total:</span>{" "}
                <span className="font-semibold text-gray-900">
                  {formatRWF(total)}
                </span>
              </div>
            </div>

            <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
              <div className="max-h-80 overflow-auto">
                {isLoadingUsers ? (
                  <div className="p-6 text-sm text-gray-500">
                    Loading staff…
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">
                    No active users with salary found.
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Include
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Staff
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Salary
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={!!selectedIds[u.id]}
                              onChange={(e) =>
                                setSelectedIds((prev) => ({
                                  ...prev,
                                  [u.id]: e.target.checked,
                                }))
                              }
                              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {u.name || "Unnamed"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {u.email}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {formatRWF(u.salary ?? 0)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isLoading || isLoadingUsers || selectedUsers.length === 0
                }
                className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Adding..." : "Add Salaries Expense"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SalaryExpenseModal;
