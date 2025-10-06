import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import { Skull, MapPin, Clock, Users, Eye, EyeOff } from "lucide-react";
import CheckoutForm from "./components/CheckoutForm";
import gabyMask from "./images/gaby-mask.png";
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
  paymentStatus: "pending" | "completed" | "failed" | "refunded";
  timestamp: string;
  stripe_payment_intent_id?: string | null;
  stripe_refund_id?: string | null;
  refund_amount?: number | null;
}

const App: React.FC = () => {
  const [rsvps, setRsvps] = useState<RSVPData[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [fontOption, setFontOption] = useState(1);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    guests: 1,
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
    whatsappLink?: string;
  } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{
    name: string;
    whatsappLink: string;
  } | null>(null);

  // Guest limit configuration
  const GUEST_LIMIT = 80;
  const currentGuestCount = rsvps.filter(rsvp => rsvp.paymentStatus === "completed" && rsvp.stripe_payment_intent_id).reduce((sum, rsvp) => sum + rsvp.guests, 0);
  const remainingSpots = GUEST_LIMIT - currentGuestCount;
  const isSoldOut = remainingSpots <= 0;

  // Load RSVPs from API on component mount
  useEffect(() => {
    const fetchRsvps = async () => {
      try {
        const response = await fetch("/api/rsvps");
        if (response.ok) {
          const data = await response.json();
          setRsvps(data);
        }
      } catch (error) {
        console.error("Failed to fetch RSVPs:", error);
      }
    };

    fetchRsvps();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "guests" ? (value === "" ? "" : parseInt(value) || "") : value,
    }));
  };

  const handleRSVPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if sold out
    if (isSoldOut) {
      setMessage({
        type: "error",
        text: "🎃 SOLD OUT! All 80 spots have been claimed. The nightmare is full!",
      });
      return;
    }
    
    // Validate guests field
    if (!formData.guests || formData.guests < 1 || formData.guests > 10) {
      setMessage({
        type: "error",
        text: "Please enter a valid number of guests (1-10)",
      });
      return;
    }
    
    // Check if this RSVP would exceed the limit
    if (formData.guests > remainingSpots) {
      setMessage({
        type: "error",
        text: `🎃 Only ${remainingSpots} spots remaining! Please reduce your guest count.`,
      });
      return;
    }
    
    setMessage(null);
    setShowCheckout(true);
  };

  const handlePaymentSuccess = async (paymentIntent: any) => {
    try {
      console.log("Attempting to save RSVP to database...");

      // Save RSVP to database via API
      const response = await fetch("/api/rsvps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          guests: formData.guests,
          paymentStatus: "completed",
          stripe_payment_intent_id: paymentIntent.id,
        }),
      });

      console.log("API response status:", response.status);
      console.log("API response ok:", response.ok);

      if (response.ok) {
        const newRsvp = await response.json();
        setRsvps((prev) => [newRsvp, ...prev]);

        // Show success modal instead of small message
        setSuccessData({
          name: formData.name,
          whatsappLink: "https://chat.whatsapp.com/BpT9NYyu7UILMnQppoVEqS"
        });
        setShowSuccessModal(true);
        setShowCheckout(false); // Hide checkout form
      } else {
        const errorText = await response.text();
        console.error("API response error:", response.status, errorText);
        throw new Error(`Failed to save RSVP: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error("Failed to save RSVP:", error);
      setMessage({
        type: "error",
        text: "Payment successful but failed to save RSVP. Please contact support.",
      });
    }

    setFormData({ name: "", email: "", phone: "", guests: 1 });
    setShowCheckout(false);
  };

  const handlePaymentError = (error: string) => {
    setMessage({
      type: "error",
      text: "💀 Payment failed: " + error,
    });
    setShowCheckout(false);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessData(null);
    // Reset form
    setFormData({
      name: "",
      email: "",
      phone: "",
      guests: 1,
    });
    setMessage(null);
  };

  const handleAdminLogin = () => {
    const correctPassword = process.env.REACT_APP_ADMIN_PASSWORD;
    console.log("Admin password from env:", correctPassword);
    console.log("Entered password:", adminPassword);
    if (adminPassword === correctPassword) {
      setIsAuthenticated(true);
      setAdminPassword("");
    } else {
      setMessage({ type: "error", text: "💀 Wrong password, mortal!" });
    }
  };

  const handleRefund = async (rsvpId: string) => {
    const shouldRefund = window.confirm(
      "Are you sure you want to refund this RSVP? This action cannot be undone."
    );

    if (!shouldRefund) {
      return;
    }

    console.log("Starting refund process for RSVP ID:", rsvpId);

    try {
      const response = await fetch(`/api/refund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rsvpId: rsvpId,
        }),
      });

      console.log("Refund API response status:", response.status);
      console.log("Refund API response ok:", response.ok);

      if (response.ok) {
        const refundData = await response.json();
        console.log("RSVP refunded:", refundData);
        setMessage({
          type: "success",
          text: `💀 RSVP refunded successfully! Refund ID: ${refundData.refundId}`,
        });
        // Refresh the RSVP list
        const rsvpResponse = await fetch("/api/rsvps");
        if (rsvpResponse.ok) {
          const rsvpData = await rsvpResponse.json();
          setRsvps(rsvpData);
        }
      } else {
        const errorData = await response.json();
        console.log("Refund failed:", errorData);
        setMessage({
          type: "error",
          text: `💀 Refund failed: ${errorData.error || "Unknown error"}`,
        });
      }
    } catch (error) {
      console.log("Refund error:", error);
      setMessage({
        type: "error",
        text: `💀 Refund failed: ${error}`,
      });
    }
  };

  const partyDetails = [
    { label: "Date", value: "October 25th", icon: <Clock size={20} /> },
    { label: "Boarding Time", value: "9:15 PM", icon: <Clock size={20} /> },
    { label: "Take Off", value: "9:25 PM", icon: <Skull size={20} /> },
    { label: "Return to Dock", value: "11:30 PM", icon: <MapPin size={20} /> },
    { label: "After Party", value: "Coconut Club", icon: <Users size={20} /> },
    { label: "Price", value: "$40", icon: <Users size={20} /> },
  ];

  return (
    <Elements stripe={stripePromise}>
      <div className="app">
        {/* Sticky Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          style={{
            position: "sticky",
            top: "0px",
            zIndex: 1000,
            padding: "20px 0",
            textAlign: "center",
          }}
        >
          <h1 className="title">GABYGHOUL</h1>

          <motion.div
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1],
              y: [0, -10, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginTop: "20px",
            }}
          >
            <img
              src={gabyMask}
              alt="Creepy Doll Mask"
              style={{
                width: "180px",
                height: "auto",
                filter: "drop-shadow(0 0 15px rgba(255, 0, 0, 0.8))",
              }}
              className="gaby-mask-responsive"
              onError={(e) => {
                console.log("Local image not found, using fallback");
                e.currentTarget.style.display = "none";
                const fallback = document.createElement("div");
                fallback.innerHTML = "🎭";
                fallback.style.cssText = `
                  width: 120px;
                  height: 120px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 60px;
                  color: #ff0000;
                `;
                e.currentTarget.parentNode?.appendChild(fallback);
              }}
            />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <div className="party-details">
            <h2
              className="subtitle-white-outline"
              style={{ textAlign: "center" }}
            >
              SPOOKY BOAT PARTY
            </h2>
            <h3
              className="subtitle-white-outline"
              style={{ textAlign: "center", fontSize: "1.2rem" }}
            >
              CELEBRATING OCTOBER BIRTHDAYS
            </h3>
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

            {/* Party Description Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              style={{
                marginTop: "2rem",
                textAlign: "left",
              }}
            >
              <p
                style={{
                  color: "#ffffff",
                  fontSize: "1.4rem",
                  lineHeight: "2.2",
                  marginBottom: "2rem",
                  textShadow: "1px 1px 2px #000000, 0 0 10px #ff0000",
                  fontWeight: "500",
                  maxWidth: "800px",
                  margin: "0 auto 2rem auto",
                }}
              >
                Join us for GabyGhoul, a horror-themed boat party on Town Lake!
                <br />
                We will be celebrating Gaby, Mago, and Eli's October birthdays.
                <br />
                Please come in your scariest costume. Drinks and snacks will be
                provided,
                <br />
                but feel free to bring your own as well. After returning to the
                dock,
                <br />
                we will be heading to Coconut Club for an after party.
                <br />
                <span
                  style={{
                    color: "#ff0000",
                    fontSize: "1.6rem",
                    fontWeight: "bold",
                    textShadow: "2px 2px 0px #ffffff, 0 0 15px #ff0000",
                  }}
                >
                  We have a hard limit of 80 guests, so please RSVP as soon as
                  possible!
                </span>
              </p>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
        >
          <div className="rsvp-form">
            <h3 className="form-title">
              {isSoldOut ? "💀 SOLD OUT - HELL IS FULL 💀" : "🪦 SECURE YOUR SPOT IN HELL 🪦"}
            </h3>
            

            {isSoldOut ? (
              <div style={{
                textAlign: "center",
                padding: "2rem",
                background: "rgba(255, 0, 0, 0.1)",
                border: "2px solid #ff0000",
                borderRadius: "10px",
                color: "#ff6666"
              }}>
                <h4 style={{ marginBottom: "1rem", color: "#ff0000" }}>
                  🎃 THE NIGHTMARE IS FULL! 🎃
                </h4>
                <p style={{ marginBottom: "1rem" }}>
                  All 80 spots have been claimed by brave souls ready to face the horror.
                </p>
                <p style={{ fontSize: "0.9rem", opacity: 0.8 }}>
                  Follow us on social media for updates on future spooky events!
                </p>
              </div>
            ) : !showCheckout ? (
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
                    max={Math.min(10, remainingSpots)}
                    required
                  />
                </div>

                <button type="submit" className="btn" style={{ width: "100%" }}>
                  🪦 BUY TICKETS - ${(formData.guests || 0) * 40} TOTAL
                </button>
              </form>
            ) : (
              <div>
                <div
                  style={{
                    marginBottom: "1rem",
                    padding: "1rem",
                    background: "rgba(255, 0, 0, 0.1)",
                    borderRadius: "8px",
                  }}
                >
                  <h4 style={{ color: "#ff6666", marginBottom: "0.5rem" }}>
                    Order Summary
                  </h4>
                  <p>Name: {formData.name}</p>
                  <p>Email: {formData.email}</p>
                  <p>Guests: {formData.guests}</p>
                  <p style={{ fontWeight: "bold", color: "#ff0000" }}>
                    Total: ${(formData.guests || 0) * 40}
                  </p>
                </div>

                <CheckoutForm
                  amount={(formData.guests || 0) * 4000} // $40.00 per guest
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  customerInfo={{
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                  }}
                />

                <button
                  onClick={() => setShowCheckout(false)}
                  className="btn"
                  style={{
                    width: "100%",
                    marginTop: "1rem",
                    background: "transparent",
                    border: "2px solid #ff0000",
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
                  {message.whatsappLink && (
                    <div style={{ marginTop: "1rem" }}>
                      <a
                        href={message.whatsappLink}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-block",
                          background: "linear-gradient(45deg, #25D366, #128C7E)",
                          color: "white",
                          padding: "0.75rem 1.5rem",
                          borderRadius: "25px",
                          textDecoration: "none",
                          fontWeight: "bold",
                          fontSize: "1rem",
                          boxShadow: "0 4px 15px rgba(37, 211, 102, 0.3)",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "scale(1.05)";
                          e.currentTarget.style.boxShadow = "0 6px 20px rgba(37, 211, 102, 0.4)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                          e.currentTarget.style.boxShadow = "0 4px 15px rgba(37, 211, 102, 0.3)";
                        }}
                      >
                        💬 Join WhatsApp Group
                      </a>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Location Map */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          <div
            style={{
              background: "rgba(0, 0, 0, 0.9)",
              border: "2px solid #ff0000",
              borderRadius: "15px",
              padding: "2rem",
              margin: "2rem auto",
              maxWidth: "800px",
              boxShadow: "0 0 30px rgba(255, 0, 0, 0.5)",
            }}
          >
            <h3
              style={{
                fontFamily: "'Rubik Wet Paint', cursive",
                fontSize: "2rem",
                fontWeight: "normal",
                color: "#ffffff",
                textAlign: "center",
                marginBottom: "1.5rem",
                textShadow:
                  "1px 1px 0px #ffffff, 2px 2px 0px #ffffff, 3px 3px 0px #ff0000, 4px 4px 0px #8b0000, 0 0 10px #ff0000",
                background:
                  "linear-gradient(45deg, #ff0000, #cc0000, #990000, #660000)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              PORTAL INTO HELL
            </h3>
            <a
              href="https://maps.google.com/maps?q=208+Barton+Springs+Road+Austin+TX+78704"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block",
                position: "relative",
                width: "100%",
                height: "300px",
                borderRadius: "10px",
                overflow: "hidden",
                border: "2px solid #ff0000",
                boxShadow: "0 0 20px rgba(255, 0, 0, 0.5)",
                textDecoration: "none",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 0 30px rgba(255, 0, 0, 0.8)";
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 0 20px rgba(255, 0, 0, 0.5)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3445.1234567890123!2d-97.7567!3d30.2672!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8644b50a12345678%3A0x1234567890abcdef!2s208%20Barton%20Springs%20Rd%2C%20Austin%2C%20TX%2078704!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0, pointerEvents: "none" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Halloween Boat Party Location - 208 Barton Springs Road, Austin, TX"
              ></iframe>
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  background: "rgba(255, 0, 0, 0.8)",
                  color: "#ffffff",
                  padding: "8px 12px",
                  borderRadius: "5px",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              >
                📱 Click to open in Google Maps
              </div>
            </a>
            <p
              style={{
                textAlign: "center",
                marginTop: "1rem",
                color: "#ff6666",
                fontSize: "1.1rem",
              }}
            >
              208 Barton Springs Road, Austin, TX 78704
            </p>
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
                    Total RSVPs: {rsvps.filter(rsvp => rsvp.paymentStatus === "completed" && rsvp.stripe_payment_intent_id).length} | Total Guests:{" "}
                    {rsvps.filter(rsvp => rsvp.paymentStatus === "completed" && rsvp.stripe_payment_intent_id).reduce((sum, rsvp) => sum + rsvp.guests, 0)}
                    <br />
                    🎃 {GUEST_LIMIT - rsvps.filter(rsvp => rsvp.paymentStatus === "completed" && rsvp.stripe_payment_intent_id).reduce((sum, rsvp) => sum + rsvp.guests, 0)} spots remaining out of {GUEST_LIMIT} 🎃
                  </p>
                  <div className="rsvp-list">
                    {rsvps.filter(rsvp => rsvp.stripe_payment_intent_id).length === 0 ? (
                      <p style={{ color: "#666", textAlign: "center" }}>
                        No real RSVPs yet... The crypt is empty.
                      </p>
                    ) : (
                      rsvps.filter(rsvp => rsvp.stripe_payment_intent_id).map((rsvp) => (
                        <motion.div
                          key={rsvp.id}
                          className="rsvp-item"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: "1rem",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <h4>{rsvp.name}</h4>
                            <p>Email: {rsvp.email}</p>
                            <p>Phone: {rsvp.phone}</p>
                            <p>Guests: {rsvp.guests}</p>
                            <p>Status: {rsvp.paymentStatus} {rsvp.stripe_payment_intent_id ? '💳' : '🧪'}</p>
                            <p>
                              RSVP Date:{" "}
                              {new Date(rsvp.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                          {rsvp.paymentStatus === "completed" && rsvp.stripe_payment_intent_id && (
                            <button
                              onClick={() => handleRefund(rsvp.id)}
                              style={{
                                background:
                                  "linear-gradient(45deg, #ff0000, #8b0000)",
                                border: "1px solid #ff0000",
                                borderRadius: "5px",
                                color: "#ffffff",
                                padding: "0.5rem 1rem",
                                fontSize: "0.9rem",
                                cursor: "pointer",
                                boxShadow: "0 0 10px rgba(255, 0, 0, 0.3)",
                                transition: "all 0.3s ease",
                                alignSelf: "flex-start",
                                marginTop: "0.5rem",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "scale(1.05)";
                                e.currentTarget.style.boxShadow =
                                  "0 0 15px rgba(255, 0, 0, 0.5)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                                e.currentTarget.style.boxShadow =
                                  "0 0 10px rgba(255, 0, 0, 0.3)";
                              }}
                            >
                              💀 REFUND RSVP 💀
                            </button>
                          )}
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
          <p>💀 Presented by Degz and Kalimotxo Events 💀</p>

          {/* SoundCloud Player */}
          <div
            style={{
              marginTop: "2rem",
              maxWidth: "800px",
              margin: "2rem auto 0",
            }}
          >
            <h3
              style={{
                color: "#ff6666",
                marginBottom: "1rem",
                fontFamily: "'Butcherman', cursive",
                textShadow: "0 0 10px #ff0000",
              }}
            >
              🎵 SPOOKY VIBES 🎵
            </h3>

            {!musicPlaying ? (
              <div style={{ textAlign: "center", marginBottom: "1rem" }}>
                <button
                  onClick={() => setMusicPlaying(true)}
                  style={{
                    background: "linear-gradient(45deg, #ff0000, #8b0000)",
                    border: "2px solid #ff0000",
                    borderRadius: "10px",
                    color: "#ffffff",
                    padding: "1rem 2rem",
                    fontSize: "1.2rem",
                    fontFamily: "'Butcherman', cursive",
                    cursor: "pointer",
                    boxShadow: "0 0 20px rgba(255, 0, 0, 0.5)",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow =
                      "0 0 30px rgba(255, 0, 0, 0.8)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 0 20px rgba(255, 0, 0, 0.5)";
                  }}
                >
                  🎵 PLAY SPOOKY MUSIC 🎵
                </button>
                <p
                  style={{
                    color: "#ff6666",
                    marginTop: "0.5rem",
                    fontSize: "0.9rem",
                  }}
                >
                  Tap to start the Halloween soundtrack!
                </p>
              </div>
            ) : (
              <iframe
                width="100%"
                height="300"
                scrolling="no"
                frameBorder="no"
                allow="autoplay"
                src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A901256329&color=%23ff5500&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"
                style={{
                  borderRadius: "10px",
                  border: "2px solid #ff0000",
                  boxShadow: "0 0 20px rgba(255, 0, 0, 0.5)",
                }}
                title="Halloween Cumbia Remix by Dj Gecko - Spooky Music Player"
              ></iframe>
            )}
            <div
              style={{
                fontSize: "10px",
                color: "#cccccc",
                lineBreak: "anywhere",
                wordBreak: "normal",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                fontFamily:
                  "Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif",
                fontWeight: "100",
                marginTop: "0.5rem",
              }}
            >
              <a
                href="https://soundcloud.com/djgecko77"
                title="Dj Gecko"
                target="_blank"
                rel="noreferrer"
                style={{ color: "#cccccc", textDecoration: "none" }}
              >
                Dj Gecko
              </a>{" "}
              ·{" "}
              <a
                href="https://soundcloud.com/djgecko77/halloween-cumbia-remix-dj-gecko"
                title="Halloween Cumbia Remix - Dj Gecko"
                target="_blank"
                rel="noreferrer"
                style={{ color: "#cccccc", textDecoration: "none" }}
              >
                Halloween Cumbia Remix - Dj Gecko
              </a>
            </div>
          </div>
        </motion.footer>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && successData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.95)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "1rem",
            }}
            onClick={handleCloseSuccessModal}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{
                background: "linear-gradient(135deg, #1a0a0a 0%, #2a0a0a 50%, #1a0a0a 100%)",
                border: "3px solid #ff0000",
                borderRadius: "20px",
                padding: "2rem",
                maxWidth: "500px",
                width: "100%",
                textAlign: "center",
                boxShadow: "0 0 50px rgba(255, 0, 0, 0.5)",
                position: "relative",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={handleCloseSuccessModal}
                style={{
                  position: "absolute",
                  top: "1rem",
                  right: "1rem",
                  background: "transparent",
                  border: "2px solid #ff0000",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  color: "#ff0000",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>

              {/* Success content */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h2 style={{
                  color: "#ff0000",
                  fontSize: "2.5rem",
                  marginBottom: "1rem",
                  textShadow: "0 0 20px rgba(255, 0, 0, 0.8)",
                  fontFamily: "Creepster, cursive"
                }}>
                  🎉 WELCOME TO THE NIGHTMARE! 🎉
                </h2>
                
                <p style={{
                  color: "#ff6666",
                  fontSize: "1.3rem",
                  marginBottom: "2rem",
                  lineHeight: "1.5"
                }}>
                  RSVP confirmed, <strong style={{ color: "#ff0000" }}>{successData.name}</strong>!<br />
                  Your soul has been claimed for the spookiest boat party of the year! 👻
                </p>

                <div style={{
                  background: "rgba(255, 0, 0, 0.1)",
                  border: "2px solid #ff0000",
                  borderRadius: "15px",
                  padding: "1.5rem",
                  marginBottom: "2rem"
                }}>
                  <h3 style={{
                    color: "#ff0000",
                    marginBottom: "1rem",
                    fontSize: "1.2rem"
                  }}>
                    🚢 PARTY DETAILS 🚢
                  </h3>
                  <p style={{ color: "#ff6666", marginBottom: "0.5rem" }}>
                    📅 <strong>October 25th</strong> - 9:15 PM Boarding
                  </p>
                  <p style={{ color: "#ff6666", marginBottom: "0.5rem" }}>
                    📍 <strong>208 Barton Springs Road, Austin, TX</strong>
                  </p>
                  <p style={{ color: "#ff6666" }}>
                    🎭 <strong>After Party:</strong> Coconut Club
                  </p>
                </div>

                <a
                  href={successData.whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-block",
                    background: "linear-gradient(45deg, #25D366, #128C7E)",
                    color: "white",
                    padding: "1rem 2rem",
                    borderRadius: "25px",
                    textDecoration: "none",
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                    boxShadow: "0 4px 15px rgba(37, 211, 102, 0.3)",
                    transition: "all 0.3s ease",
                    marginBottom: "1rem"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(37, 211, 102, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 4px 15px rgba(37, 211, 102, 0.3)";
                  }}
                >
                  💬 Join WhatsApp Group for Updates
                </a>

                <p style={{
                  color: "#ff9999",
                  fontSize: "0.9rem",
                  marginTop: "1rem",
                  opacity: 0.8
                }}>
                  Check your email for confirmation details!<br />
                  Can't wait to see you on the dark side... 🌙
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Elements>
  );
};

export default App;
