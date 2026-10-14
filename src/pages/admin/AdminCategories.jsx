import { useEffect, useState } from "react";
import { AdminShell } from "./AdminOpsShared";
import { getCategories, adminCreateCategory, adminUpdateCategory, adminDeleteCategory } from "../../services/storefrontService";
import api from "../../services/api";
import { toast } from "react-toastify";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const load = async () => {
    try {
      const res = await api.get("/categories", { params: { includeInactive: 1 } });
      setCategories(res.data || []);
    } catch {
      // fall back to public list
      getCategories().then((res) => setCategories(res.data || [])).catch(() => {});
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const create = async (event) => {
    event.preventDefault();
    try {
      await adminCreateCategory({ name, description });
      setName("");
      setDescription("");
      toast.success("Category created");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not create the category");
    }
  };

  const toggle = async (category) => {
    try {
      await adminUpdateCategory(category._id, { isActive: !category.isActive });
      load();
    } catch {
      toast.error("Could not update the category");
    }
  };

  const remove = async (category) => {
    try {
      await adminDeleteCategory(category._id);
      toast.success("Category deleted");
      load();
    } catch {
      toast.error("Could not delete the category");
    }
  };

  return (
    <AdminShell title="Categories" subtitle="Managed categories power the storefront filters. Products keep their category name even if a category is hidden.">
      <form onSubmit={create} className="mb-6 flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-4 sm:flex-row">
        <input className="input-field" placeholder="New category name" required value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input-field flex-1" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <button className="primary-btn">Add category</button>
      </form>
      <div className="space-y-2">
        {categories.map((c) => (
          <div key={c._id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm">
            <strong className="capitalize">{c.name}</strong>
            <span className="text-[#667085]">{c.slug}</span>
            {c.description && <span className="text-[#667085]">{c.description}</span>}
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${c.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{c.isActive ? "Visible" : "Hidden"}</span>
            <span className="ml-auto flex gap-2">
              <button onClick={() => toggle(c)} className="secondary-btn !py-1.5">{c.isActive ? "Hide" : "Show"}</button>
              <button onClick={() => remove(c)} className="rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white">Delete</button>
            </span>
          </div>
        ))}
        {categories.length === 0 && <p className="card p-6 text-sm text-[#667085]">No managed categories yet — the storefront still uses the built-in list until you add some.</p>}
      </div>
    </AdminShell>
  );
}
