import React from 'react';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';
import './legal-pages.css';

const TermsOfService = () => {
  return (
    <div className="legal-page">
      <PublicHeader />
      
      <main className="legal-main">
        <div className="legal-container">
          <header className="legal-header">
            <h1 className="legal-title">Terms of Service</h1>
          </header>

          <div className="legal-content">
            <section className="legal-section">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing and using The AXIS Group of Publications website, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>


            <section className="legal-section">
              <h2>2. User Conduct</h2>
              <p>When using our website, you agree to:</p>
              <ul>
                <li>Provide accurate and truthful information</li>
                <li>Respect other users and maintain civil discourse</li>
                <li>Not post content that is illegal, harmful, or violates others' rights</li>
                <li>Not attempt to gain unauthorized access to our systems</li>
                <li>Not use our website for any unlawful purpose</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>3. Comments and User-Generated Content</h2>
              <p>
                By submitting comments or other content to our website, you grant us a non-exclusive, royalty-free license to use, reproduce, and distribute such content. You are responsible for the content you submit and must ensure it does not violate any laws or infringe on others' rights.
              </p>
            </section>

            <section className="legal-section">
              <h2>4. Content Moderation</h2>
              <p>
                We reserve the right to moderate, edit, or remove any content that violates these terms or is deemed inappropriate. We may also suspend or terminate accounts that repeatedly violate these terms.
              </p>
            </section>

            <section className="legal-section">
              <h2>5. Intellectual Property</h2>
              <p>
                All content on this website, including articles, images, and design elements, is the property of The AXIS Group of Publications or its content creators and is protected by copyright and other intellectual property laws.
              </p>
            </section>

            <section className="legal-section">
              <h2>6. Disclaimer</h2>
              <p>
                The materials on The AXIS website are provided on an 'as is' basis. The AXIS Group of Publications makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section className="legal-section">
              <h2>7. Limitations</h2>
              <p>
                In no event shall The AXIS Group of Publications or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on The AXIS website, even if The AXIS Group of Publications or an authorized representative has been notified orally or in writing of the possibility of such damage.
              </p>
            </section>

            <section className="legal-section">
              <h2>8. Accuracy of Materials</h2>
              <p>
                The materials appearing on The AXIS website could include technical, typographical, or photographic errors. The AXIS Group of Publications does not warrant that any of the materials on its website are accurate, complete, or current.
              </p>
            </section>

            <section className="legal-section">
              <h2>9. Links to Other Websites</h2>
              <p>
                Our website may contain links to third-party websites. We are not responsible for the content or privacy practices of these external sites.
              </p>
            </section>

            <section className="legal-section">
              <h2>10. Governing Law</h2>
              <p>
                These terms and conditions are governed by and construed in accordance with the laws of the Philippines and you irrevocably submit to the exclusive jurisdiction of the courts in that state or location.
              </p>
            </section>

            <section className="legal-section">
              <h2>11. Changes to Terms</h2>
              <p>
                The AXIS Group of Publications may revise these terms of service at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>

            <section className="legal-section">
              <h2>12. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at:
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

export default TermsOfService;
