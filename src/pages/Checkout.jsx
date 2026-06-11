import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOrder } from "../services/orderService";
import MessageModal from "../components/MessageModal";

export default function Checkout() {
  const navigate = useNavigate();

  const [msgOpen, setMsgOpen] = useState(false);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await createOrder({ shippingAddress: form });
      // navigate to success page
      navigate("/order-success");
    } catch (err) {
      setMsg(err.response?.data?.message || "Error placing order");
      setMsgOpen(true);
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-4 card p-6">
        <input
          name="fullName"
          placeholder="Full Name"
          onChange={handleChange}
          className="input-field w-full"
        />
        <input
          name="phone"
          placeholder="Phone"
          onChange={handleChange}
          className="input-field w-full"
        />
        <input
          name="address"
          placeholder="Address"
          onChange={handleChange}
          className="input-field w-full"
        />
        <input
          name="city"
          placeholder="City"
          onChange={handleChange}
          className="input-field w-full"
        />
        <input
          name="state"
          placeholder="State"
          onChange={handleChange}
          className="input-field w-full"
        />

        <div className="flex justify-end">
          <button type="submit" className="primary-btn">
            Place Order
          </button>
        </div>
      </form>
      <MessageModal
        open={msgOpen}
        message={msg}
        onClose={() => setMsgOpen(false)}
      />
    </div>
  );
}
