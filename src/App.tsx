import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import { Skull, MapPin, Clock, Users, Ticket, Eye, EyeOff } from "lucide-react";
import CheckoutForm from "./components/CheckoutForm";
import "./App.css";

// Stripe public key - replace with your actual Stripe publishable key
const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "pk_test_your_stripe_key_here"
);

interface RSVPData {
  id: string;
  name: string;
  email: string;
  phone: string;
  guests: number;
  paymentStatus: "pending" | "completed" | "failed";
  timestamp: string;
}

const App: React.FC = () => {
  const [rsvps, setRsvps] = useState<RSVPData[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    guests: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load RSVPs from localStorage on component mount
  useEffect(() => {
    const savedRsvps = localStorage.getItem("gabighoul-rsvps");
    if (savedRsvps) {
      setRsvps(JSON.parse(savedRsvps));
    }
  }, []);

  // Save RSVPs to localStorage whenever rsvps change
  useEffect(() => {
    localStorage.setItem("gabighoul-rsvps", JSON.stringify(rsvps));
  }, [rsvps]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "guests" ? parseInt(value) || 1 : value,
    }));
  };

  const handleRSVPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setShowCheckout(true);
  };

  const handlePaymentSuccess = (paymentIntent: any) => {
    const newRSVP: RSVPData = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      guests: formData.guests,
      paymentStatus: "completed",
      timestamp: new Date().toISOString(),
    };

    setRsvps((prev) => [...prev, newRSVP]);
    setFormData({ name: "", email: "", phone: "", guests: 1 });
    setShowCheckout(false);
    setMessage({
      type: "success",
      text: "🎉 RSVP confirmed! Welcome to the nightmare, " + formData.name + "!",
    });
  };

  const handlePaymentError = (error: string) => {
    setMessage({
      type: "error",
      text: "💀 Payment failed: " + error,
    });
    setShowCheckout(false);
  };

  const handleAdminLogin = () => {
    if (adminPassword === "gabighoul2024") {
      setIsAuthenticated(true);
      setAdminPassword("");
    } else {
      setMessage({ type: "error", text: "💀 Wrong password, mortal!" });
    }
  };

  const partyDetails = [
    { label: "Boarding Time", value: "9:15 PM", icon: <Clock size={20} /> },
    { label: "Take Off", value: "9:25 PM", icon: <Skull size={20} /> },
    { label: "Return to Dock", value: "11:30 PM", icon: <MapPin size={20} /> },
    { label: "After Party", value: "X Club", icon: <Users size={20} /> },
    { label: "Host", value: "Gabyghoul", icon: <Skull size={20} /> },
  ];

  return (
    <Elements stripe={stripePromise}>
      <div className="app">
        <motion.header
          className="header"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="title">GABYGHOUL'S</h1>
          <h2 className="subtitle">HALLOWEEN BOAT PARTY</h2>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Skull size={60} color="#ff0000" />
          </motion.div>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <div className="party-details">
            <h3 className="details-title">💀 PARTY DETAILS 💀</h3>
            {partyDetails.map((detail, index) => (
              <motion.div
                key={detail.label}
                className="detail-item"
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  {detail.icon}
                  <span className="detail-label">{detail.label}</span>
                </div>
                <span className="detail-value">{detail.value}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
        >
          <div className="rsvp-form">
            <h3 className="form-title">🎫 SECURE YOUR SPOT IN HELL 🎫</h3>
            
            {!showCheckout ? (
              <form onSubmit={handleRSVPSubmit}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your cursed name..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="your.email@domain.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Number of Guests</label>
                  <input
                    type="number"
                    name="guests"
                    value={formData.guests}
                    onChange={handleInputChange}
                    className="form-input"
                    min="1"
                    max="10"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn"
                  style={{ width: "100%" }}
                >
                  <Ticket size={20} style={{ marginRight: "10px" }} />
                  BUY TICKETS - ${25 * formData.guests} TOTAL
                </button>
              </form>
            ) : (
              <div>
                <div style={{ marginBottom: "1rem", padding: "1rem", background: "rgba(255, 0, 0, 0.1)", borderRadius: "8px" }}>
                  <h4 style={{ color: "#ff6666", marginBottom: "0.5rem" }}>Order Summary</h4>
                  <p>Name: {formData.name}</p>
                  <p>Email: {formData.email}</p>
                  <p>Guests: {formData.guests}</p>
                  <p style={{ fontWeight: "bold", color: "#ff0000" }}>Total: ${25 * formData.guests}</p>
                </div>
                
                <CheckoutForm
                  amount={25 * formData.guests * 100} // Convert to cents
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  customerInfo={{
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone
                  }}
                />
                
                <button
                  onClick={() => setShowCheckout(false)}
                  className="btn"
                  style={{ 
                    width: "100%", 
                    marginTop: "1rem",
                    background: "transparent",
                    border: "2px solid #ff0000"
                  }}
                >
                  Back to Form
                </button>
              </div>
            )}

            <AnimatePresence>
              {message && (
                <motion.div
                  className={`message ${message.type}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Admin Panel Toggle */}
        <motion.div
          style={{ textAlign: "center", margin: "2rem" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          <button
            onClick={() => setShowAdmin(!showAdmin)}
            className="btn"
            style={{
              background: "transparent",
              border: "2px solid #ff0000",
              fontSize: "1rem",
              padding: "0.5rem 1rem",
            }}
          >
            {showAdmin ? <EyeOff size={20} /> : <Eye size={20} />}
            {showAdmin ? " Hide Admin" : " Show Admin"}
          </button>
        </motion.div>

        {/* Admin Panel */}
        <AnimatePresence>
          {showAdmin && (
            <motion.div
              className="admin-panel"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
            >
              {!isAuthenticated ? (
                <div>
                  <h3 className="form-title">🔐 ADMIN ACCESS 🔐</h3>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="form-input"
                      placeholder="Enter admin password..."
                    />
                  </div>
                  <button
                    onClick={handleAdminLogin}
                    className="btn"
                    style={{ width: "100%" }}
                  >
                    Enter the Crypt
                  </button>
                </div>
              ) : (
                <div>
                  <h3 className="form-title">👻 RSVP LIST 👻</h3>
                  <p style={{ color: "#ff6666", marginBottom: "1rem" }}>
                    Total RSVPs: {rsvps.length} | Total Guests:{" "}
                    {rsvps.reduce((sum, rsvp) => sum + rsvp.guests, 0)}
                  </p>
                  <div className="rsvp-list">
                    {rsvps.length === 0 ? (
                      <p style={{ color: "#666", textAlign: "center" }}>
                        No RSVPs yet... The crypt is empty.
                      </p>
                    ) : (
                      rsvps.map((rsvp) => (
                        <motion.div
                          key={rsvp.id}
                          className="rsvp-item"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <h4>{rsvp.name}</h4>
                          <p>Email: {rsvp.email}</p>
                          <p>Phone: {rsvp.phone}</p>
                          <p>Guests: {rsvp.guests}</p>
                          <p>Status: {rsvp.paymentStatus}</p>
                          <p>
                            RSVP Date:{" "}
                            {new Date(rsvp.timestamp).toLocaleDateString()}
                          </p>
                        </motion.div>
                      ))
                    )}
                  </div>
                  <button
                    onClick={() => setIsAuthenticated(false)}
                    className="btn"
                    style={{
                      marginTop: "1rem",
                      background: "transparent",
                      border: "2px solid #ff0000",
                    }}
                  >
                    Exit Admin
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.footer
          style={{
            textAlign: "center",
            padding: "2rem",
            color: "#666",
            borderTop: "1px solid #333",
            marginTop: "2rem",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
        >
          <p>💀 All October babies and friends welcome 💀</p>
          <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
            Powered by the spirits of the underworld
          </p>
        </motion.footer>
      </div>
    </Elements>
  );
};

export default App;
