import React from 'react';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';
import './legal-pages.css';

const PrivacyPolicy = () => {
  return (
    <div className="legal-page">
      <PublicHeader />
      
      <main className="legal-main">
        <div className="legal-container">
          <header className="legal-header">
            <h1 className="legal-title">Privacy Policy</h1>
          </header>

          <div className="legal-content">
            <section className="legal-section">
              <h2>1. Information We Collect</h2>
              <p>
                The AXIS Group of Publications ("we," "our," or "us") collects information you provide directly to us, such as when you:
              </p>
              <ul>
                <li>Submit comments on articles</li>
                <li>Contact us through our website</li>
              </ul>
              <p>
                This information may include your name, email address, and any other information you choose to provide.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Publish and moderate comments on our articles</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Improve our website and services</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>3. Information Sharing</h2>
              <p>
                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except:
              </p>
              <ul>
                <li>To comply with legal requirements</li>
                <li>To protect our rights and safety</li>
                <li>With service providers who assist us in operating our website</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>4. Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section className="legal-section">
              <h2>5. Cookies and Tracking</h2>
              <p>
                Our website may use cookies and similar tracking technologies to enhance your browsing experience and analyze website traffic.
              </p>
            </section>

            <section className="legal-section">
              <h2>6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>7. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <div className="legal-contact">
                <p><strong>Email:</strong> theaxispub.alangilan@g.batstate-u.edu.ph</p>
                <p><strong>Address:</strong> Alangilan, Batangas City, Philippines</p>
              </div>
            </section>

          </div>
        </div>
      </main>
      
      <PublicFooter />
    </div>
  );
};

export default PrivacyPolicy;
