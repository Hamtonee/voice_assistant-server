import React from 'react';
import { Link } from 'react-router-dom';
import '../assets/styles/LegalPages.css';

export default function PrivacyPolicy() {
  return (
    <div className="legal-page-container">
      <div className="legal-page-header">
        <div className="legal-page-nav">
          <Link to="/" className="brand-link">SemaNami</Link>
          <div className="legal-nav-links">
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy" className="active">Privacy Policy</Link>
            <Link to="/cookies">Cookie Policy</Link>
          </div>
        </div>
        <h1>Privacy Policy</h1>
        <p className="legal-page-subtitle">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      <div className="legal-page-content">
        <div className="legal-toc">
          <h2>Table of Contents</h2>
          <ol>
            <li><a href="#introduction">Introduction</a></li>
            <li><a href="#information-collect">Information We Collect</a></li>
            <li><a href="#how-we-use">How We Use Your Information</a></li>
            <li><a href="#information-sharing">Information Sharing and Disclosure</a></li>
            <li><a href="#data-retention">Data Retention and Security</a></li>
            <li><a href="#your-rights">Your Privacy Rights</a></li>
            <li><a href="#children">Children's Privacy</a></li>
            <li><a href="#international">International Data Transfers</a></li>
            <li><a href="#changes-policy">Changes to This Privacy Policy</a></li>
            <li><a href="#contact-privacy">Contact Us</a></li>
          </ol>
        </div>

        <div className="legal-sections">
          <section id="introduction">
            <h2>1. Introduction</h2>
            <p>At SemaNami, we respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform, including our website, mobile applications, or any other products or services offered by SemaNami ("Services").</p>
            <p>Please read this Privacy Policy carefully. By using our Services, you consent to the collection, use, and sharing of your information as described in this Privacy Policy. If you do not agree with our policies and practices, please do not use our Services.</p>
            <p>This Privacy Policy applies to all information collected through our Services and any related services, sales, marketing, or events.</p>
          </section>

          <section id="information-collect">
            <h2>2. Information We Collect</h2>
            <p>We collect several types of information from and about users of our Services, including:</p>

            <h3>Personal Data</h3>
            <p>Personal Data is information that can be used to identify you individually. We may collect the following types of Personal Data:</p>
            <ul>
              <li><strong>Account Information:</strong> When you register for an account, we collect your name, email address, password, and profile information.</li>
              <li><strong>Voice Recordings:</strong> As a voice role-play platform, we collect and process audio recordings that you upload or create while using our Services.</li>
              <li><strong>Communication Data:</strong> We collect information when you communicate with us, such as when you contact customer support or respond to surveys.</li>
              <li><strong>User Content:</strong> Information that you post, upload, or otherwise share through our Services, including text, images, and audio content.</li>
              <li><strong>Age Group Selection:</strong> To provide age-appropriate content (for children, teens, adults, or seniors), we may collect information about your selected age group when you customize content.</li>
            </ul>

            <h3>Usage Data</h3>
            <p>We automatically collect certain information about your device and how you interact with our Services, including:</p>
            <ul>
              <li><strong>Device Information:</strong> Information about your device, including IP address, device type, operating system, browser type, and device identifiers.</li>
              <li><strong>Usage Information:</strong> Information about how you use our Services, such as the features you use, the time spent on our platform, and your interaction with content.</li>
              <li><strong>Location Data:</strong> General location information derived from your IP address.</li>
              <li><strong>Cookies and Similar Technologies:</strong> Information collected through cookies, web beacons, and similar technologies. For more information, please see our <Link to="/cookies">Cookie Policy</Link>.</li>
            </ul>
          </section>

          <section id="how-we-use">
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect for various purposes, including to:</p>
            <ul>
              <li>Provide, maintain, and improve our Services</li>
              <li>Analyze how you use our Services to improve user experience and develop new features</li>
              <li>Respond to your comments, questions, and requests, and provide customer service</li>
              <li>Send you technical notices, updates, security alerts, and administrative messages</li>
              <li>Provide age-appropriate content and exercises based on your selected preferences</li>
              <li>Communicate with you about products, services, and events, and provide other news or information about us and our partners</li>
              <li>Monitor and analyze trends, usage, and activities in connection with our Services</li>
              <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities and protect the rights and property of SemaNami and others</li>
              <li>Personalize your experience by providing content, features, or exercises that match your interests and preferences</li>
              <li>Process and deliver contest or promotion entries and rewards</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section id="information-sharing">
            <h2>4. Information Sharing and Disclosure</h2>
            <p>We may share your information in the following circumstances:</p>

            <h3>With Your Consent</h3>
            <p>We may share your information when you give us specific consent to do so.</p>

            <h3>Service Providers</h3>
            <p>We may share your information with third-party vendors, service providers, contractors, or agents who perform services on our behalf and require access to such information to do that work. Examples include data analysis, email delivery, hosting services, customer service, and marketing efforts.</p>

            <h3>Business Transfers</h3>
            <p>If we are involved in a merger, acquisition, financing, reorganization, bankruptcy, or sale of company assets, your information may be transferred as part of that transaction. We will notify you of any change in ownership or uses of your personal information.</p>

            <h3>Legal Requirements</h3>
            <p>We may disclose your information where we are legally required to do so in order to comply with applicable law, governmental requests, judicial proceedings, court orders, or legal processes, such as in response to a court order or a subpoena.</p>

            <h3>Vital Interests and Legal Rights</h3>
            <p>We may disclose your information where we believe it is necessary to investigate, prevent, or take action regarding potential violations of our policies, suspected fraud, situations involving potential threats to the safety of any person, or as evidence in litigation.</p>

            <h3>Aggregate and De-identified Information</h3>
            <p>We may share aggregate or de-identified information that cannot reasonably be used to identify you.</p>
          </section>

          <section id="data-retention">
            <h2>5. Data Retention and Security</h2>
            <h3>Data Retention</h3>
            <p>We retain your personal information for as long as necessary to fulfill the purposes for which we collected it, including for the purposes of satisfying any legal, regulatory, tax, accounting, or reporting requirements.</p>
            <p>To determine the appropriate retention period for personal information, we consider the amount, nature, and sensitivity of the personal information, the potential risk of harm from unauthorized use or disclosure, the purposes for which we process the data, whether we can achieve those purposes through other means, and the applicable legal, regulatory, tax, accounting, or other requirements.</p>
            <p>In some circumstances, we may anonymize your personal information so that it can no longer be associated with you, in which case we may use such information without further notice to you.</p>

            <h3>Data Security</h3>
            <p>We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.</p>
            <p>We will make any legally required disclosures of any breach of the security, confidentiality, or integrity of your electronically stored "personal data" to you via email or conspicuous posting on our Services in the most expedient time possible and without unreasonable delay, as consistent with (i) the legitimate needs of law enforcement or (ii) any measures necessary to determine the scope of the breach and restore the reasonable integrity of the data system.</p>
          </section>

          <section id="your-rights">
            <h2>6. Your Privacy Rights</h2>
            <p>Depending on your location, you may have certain rights regarding your personal information. These may include:</p>
            <ul>
              <li><strong>Right to Access:</strong> You have the right to request a copy of the personal information we hold about you.</li>
              <li><strong>Right to Rectification:</strong> You have the right to request that we correct any information you believe is inaccurate or complete information you believe is incomplete.</li>
              <li><strong>Right to Erasure:</strong> You have the right to request that we erase your personal information, under certain conditions.</li>
              <li><strong>Right to Restrict Processing:</strong> You have the right to request that we restrict the processing of your personal information, under certain conditions.</li>
              <li><strong>Right to Object to Processing:</strong> You have the right to object to our processing of your personal information, under certain conditions.</li>
              <li><strong>Right to Data Portability:</strong> You have the right to request that we transfer the data we have collected to another organization, or directly to you, under certain conditions.</li>
            </ul>
            <p>If you make a request, we have one month to respond to you. To exercise any of these rights, please contact us using the information provided in the "Contact Us" section.</p>

            <h3>Opt-out of Marketing Communications</h3>
            <p>You can opt out of receiving marketing communications from us at any time by following the instructions provided in those communications or by contacting us. Please note that even if you opt out of receiving marketing communications, we may still send you non-promotional communications, such as those about your account or our ongoing business relations.</p>

            <h3>Account Information</h3>
            <p>You may update, correct, or delete your account information at any time by logging into your account or by contacting us. Please note that we may retain certain information as required by law or for legitimate business purposes.</p>
          </section>

          <section id="children">
            <h2>7. Children's Privacy</h2>
            <p>Our Services are designed to be accessible to users of various age groups, including children. We offer age-appropriate content options for children, teens, adults, and seniors.</p>
            
            <p>For users under 16 years of age, we recommend parental supervision and involvement. Parents or guardians of children under 16 have the right to review, delete, or prohibit the further collection of their child's personal information. If you are a parent or guardian and you are aware that your child has provided us with personal information without your consent, please contact us.</p>
            
            <p>We collect only the minimal information necessary to provide our Services to younger users, and we implement additional safeguards for child users. We do not knowingly collect or solicit personal information from children under 13 without verifiable parental consent. If we learn we have collected personal information from a child under 13 without verification of parental consent, we will take steps to delete that information from our servers.</p>
          </section>

          <section id="international">
            <h2>8. International Data Transfers</h2>
            <p>We are based in Kenya, and your information may be processed in Kenya and other countries where our service providers are located. These countries may have different data protection laws than your country of residence.</p>
            <p>By submitting your personal information to us, you consent to the transfer, storage, and processing of your information in countries outside of your country of residence.</p>
            <p>Where we transfer personal data from the European Economic Area (EEA), United Kingdom, or Switzerland to a country that has not been determined to provide an adequate level of protection, we employ appropriate safeguards, such as standard contractual clauses approved by the European Commission.</p>
          </section>

          <section id="changes-policy">
            <h2>9. Changes to This Privacy Policy</h2>
            <p>We may update our Privacy Policy from time to time. If we make material changes to this Privacy Policy, we will notify you by email or by posting a notice on our website prior to the change becoming effective.</p>
            <p>We encourage you to review this Privacy Policy periodically to be informed of how we are protecting your information.</p>
          </section>

          <section id="contact-privacy">
            <h2>10. Contact Us</h2>
            <p>If you have questions or concerns about this Privacy Policy or our practices, or if you wish to exercise your rights regarding your personal information, please contact us at:</p>
            <p>SemaNami<br />
            P.O. Box 12345<br />
            Nairobi, Kenya<br />
            Email: privacy@semanami.com</p>
          </section>
        </div>
      </div>

      <div className="legal-page-footer">
        <Link to="/" className="back-to-home-link">Return to Home</Link>
        <p>© {new Date().getFullYear()} SemaNami. All rights reserved.</p>
      </div>
    </div>
  );
}