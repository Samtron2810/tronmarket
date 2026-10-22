import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "./AdminOpsShared";
import {
  getAllDeliveryStates,
  setDeliveryStateActive,
} from "../../services/deliveryStateService";
import { toast } from "react-toastify";

// Admin control for deliverable locations: buyers can only check out to
// states switched on here (checkout dropdown + saved addresses + order
// creation all enforce the same list on the server).
export default function AdminDeliveryStates() {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState("");
  const [query, setQuery] = useState("");

  const load = () => {
    setLoading(true);
    getAllDeliveryStates()
      .then((res) => setStates(res.data.states || []))
      .catch(() => toast.error("Could not load delivery states"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refresh on mount.
    void load();
  }, []);

  const toggle = async (state) => {
    const next = !state.isActive;
    setSavingName(state.name);
    // Optimistic flip; revert if the server disagrees.
    setStates((prev) =>
      prev.map((s) => (s.name === state.name ? { ...s, isActive: next } : s)),
    );
    try {
      await setDeliveryStateActive(state.name, next);
      toast.success(`${state.name} delivery ${next ? "activated" : "deactivated"}`);
    } catch {
      setStates((prev) =>
        prev.map((s) => (s.name === state.name ? { ...s, isActive: !next } : s)),
      );
      toast.error(`Could not update ${state.name}`);
    } finally {
      setSavingName("");
    }
  };

  const activeCount = states.filter((s) => s.isActive).length;
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? states.filter((s) => s.name.toLowerCase().includes(q)) : states;
  }, [states, query]);

  return (
    <AdminShell
      title="Delivery Locations"
      subtitle="Buyers can only deliver to states you activate here. Changes take effect immediately at checkout."
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
          {activeCount} of {states.length || 37} states active
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search states…"
          className="w-56 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
          aria-label="Search states"
        />
        {activeCount === 0 && !loading && (
          <span className="text-xs font-semibold text-amber-700">
            No state is active yet — buyers cannot check out until you activate at least one.
          </span>
        )}
      </div>

      {loading ? (
        <p className="card p-6 text-sm text-[#667085]">Loading delivery states…</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((state) => (
            <div
              key={state.name}
              className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-[#101828]">{state.name}</p>
                <p className={`text-xs font-semibold ${state.isActive ? "text-emerald-700" : "text-gray-400"}`}>
                  {state.isActive ? "Delivery active" : "Inactive"}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={state.isActive}
                aria-label={`Toggle delivery to ${state.name}`}
                disabled={savingName === state.name}
                onClick={() => toggle(state)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                  state.isActive ? "bg-emerald-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    state.isActive ? "left-[1.375rem]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
          {visible.length === 0 && (
            <p className="card p-6 text-sm text-[#667085]">No states match your search.</p>
          )}
        </div>
      )}
    </AdminShell>
  );
}
