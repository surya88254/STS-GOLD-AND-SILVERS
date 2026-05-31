import React, { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import Navbar from "../components/Navbar";
import "../styles/contact.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate form submission
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setFormData({ name: "", email: "", phone: "", message: "" });
      setTimeout(() => setSuccess(false), 3000);
    }, 1500);
  };

  const toggleFAQ = (index) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const faqItems = [
    {
      question: "What is the delivery timing?",
      answer: "We offer standard delivery within 5-7 business days. Express delivery is available for premium clients within 2-3 days.",
    },
    {
      question: "How can I track my order?",
      answer: "You'll receive a tracking link via email once your order ships. You can also track it directly from your profile dashboard.",
    },
    {
      question: "What is your refund policy?",
      answer: "We offer hassle-free returns within 30 days of purchase. All items must be in original condition with original packaging.",
    },
    {
      question: "How do I place a custom jewellery order?",
      answer: "Visit our Custom Design page, upload your reference images, and our designers will contact you within 24 hours to discuss your vision.",
    },
  ];

  return (
    <>
      <Navbar />
      <div className="contact-page">
        {/* HERO SECTION */}
        <section className="contact-hero">
          <div className="hero-content">
            <h1 className="hero-title">CONTACT STS LUXURY JEWELLERS</h1>
            <p className="hero-subtitle">
              We're available 24/7 to assist your premium jewellery experience.
            </p>
            <div className="hero-glow"></div>
          </div>
        </section>

        {/* QUICK CONTACT BUTTON */}
        <div className="whatsapp-button">
          <a
            href="https://wa.me/918825485658?text=Hello%20STS%20Jewellers"
            target="_blank"
            rel="noopener noreferrer"
            className="whatsapp-link"
            title="Chat on WhatsApp"
          >
            💬
          </a>
        </div>

        {/* PREMIUM CONTACT CARDS */}
        <section className="contact-cards-section">
          <div className="contact-cards">
            <div className="contact-card glass-card">
              <div className="card-icon">📞</div>
              <h3>Call Us</h3>
              <p className="card-phone">+91 8825485658</p>
              <p className="card-subtitle">Available 24/7</p>
              <a href="tel:+918825485658" className="card-link">
                Call Now
              </a>
            </div>

            <div className="contact-card glass-card">
              <div className="card-icon"><FaWhatsapp /></div>
              <h3>WhatsApp Chat</h3>
              <p className="card-phone">+91 8825485658</p>
              <p className="card-subtitle">Instant reply • Quick Support</p>
              <a href="https://wa.me/918825485658" target="_blank" rel="noopener noreferrer" className="card-link">
                Chat on WhatsApp
              </a>
            </div>

            <div className="contact-card glass-card">
              <div className="card-icon">📍</div>
              <h3>Visit Store</h3>
              <p className="card-address">47/2 Viswathas Complex</p>
              <p className="card-address">North Veli Street</p>
              <p className="card-address">Madurai – 625001</p>
              <p className="card-subtitle">Open 10 AM – 9 PM</p>
              <a href="#map-section" className="card-link">
                View Map
              </a>
            </div>
          </div>
        </section>

        {/* CONTACT FORM & MAP SECTION */}
        <section className="contact-main-section">
          <div className="contact-container">
            {/* FORM */}
            <div className="contact-form-wrapper">
              <h2>Send Us a Message</h2>
              {success && (
                <div className="success-message">
                  ✓ Message sent successfully! We'll get back to you within 24 hours.
                </div>
              )}
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <input
                    type="text"
                    name="name"
                    placeholder=" "
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                  <label htmlFor="name" className="form-label">
                    Full Name
                  </label>
                </div>

                <div className="form-group">
                  <input
                    type="email"
                    name="email"
                    placeholder=" "
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                  <label htmlFor="email" className="form-label">
                    Email Address
                  </label>
                </div>

                <div className="form-group">
                  <input
                    type="tel"
                    name="phone"
                    placeholder=" "
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                  <label htmlFor="phone" className="form-label">
                    Phone Number
                  </label>
                </div>

                <div className="form-group">
                  <textarea
                    name="message"
                    placeholder=" "
                    rows="6"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    className="form-input form-textarea"
                  ></textarea>
                  <label htmlFor="message" className="form-label">
                    Your Message
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="submit-button"
                >
                  {loading ? "SENDING..." : "SEND MESSAGE"}
                </button>
              </form>
            </div>

            {/* MAP */}
            <div className="contact-map-wrapper" id="map-section">
              <h2>Visit Our Store</h2>
              <iframe
                src="https://maps.google.com/maps?q=Lalitha's%20Jewellers,%20S%20Moola%20St,%20Valaiyal%20Kadai,%20Madurai%20Main,%20Madurai,%20Tamil%20Nadu%20625001&t=&z=17&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="450"
                style={{ border: 0, borderRadius: "18px" }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="store-map"
              ></iframe>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-container">
            {faqItems.map((item, index) => (
              <div key={index} className="faq-item">
                <button
                  className="faq-question"
                  onClick={() => toggleFAQ(index)}
                >
                  <span>{item.question}</span>
                  <span className={`faq-icon ${expandedFAQ === index ? "open" : ""}`}>
                    ▼
                  </span>
                </button>
                {expandedFAQ === index && (
                  <div className="faq-answer">{item.answer}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
};

export default Contact;
