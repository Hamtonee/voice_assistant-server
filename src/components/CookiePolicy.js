import React from "react";
import { Link } from "react-router-dom";
import '../assets/styles/LegalPages.css';
import logoImage from '../assets/images/logo.png';

export default function CookiePolicy() {
  return (
    <div className="legal-page-container">
      <div className="legal-page-header">
        <div className="legal-page-nav">
          <Link to="/" className="brand-link">
            <div className="logo-container">
              <img src={logoImage} alt="SemaNami Logo" className="logo-image" />
              SemaNami
            </div>
          </Link>
          <div className="legal-nav-links">
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/cookies" className="active">Cookie Policy</Link>
          </div>
        </div>
        <h1>Cookie Policy</h1>
        <p className="legal-page-subtitle">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      <div className="legal-page-content">
        <div className="legal-toc">
          <h2>Table of Contents</h2>
          <ol>
            <li><a href="#acceptance">Acceptance of Terms</a></li>
            <li><a href="#description">Description of Service</a></li>
            <li><a href="#age-eligibility">Age and Eligibility</a></li>
            <li><a href="#license">License and Service Usage</a></li>
            <li><a href="#intellectual-property">Intellectual Property</a></li>
            <li><a href="#user-content">User Content</a></li>
            <li><a href="#prohibited">Prohibited Activities</a></li>
            <li><a href="#future-pricing">Future Pricing</a></li>
            <li><a href="#termination">Termination</a></li>
            <li><a href="#disclaimers">Disclaimers</a></li>
            <li><a href="#limitation">Limitation of Liability</a></li>
            <li><a href="#governing-law">Governing Law</a></li>
            <li><a href="#contact">Contact Information</a></li>
          </ol>
        </div>

        <div className="legal-sections">
          <section id="acceptance">
            <h2>1. Acceptance of Terms</h2>
            <p>Welcome to SemaNami. By accessing or using our platform, including our website, mobile applications, or any other products or services offered by SemaNami (&quot;Services&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;), our Privacy Policy, and any other terms or policies referenced herein.</p>
            <p>These Terms constitute a legally binding agreement between you and SemaNami regarding your use of the Services. If you do not agree to these Terms, you may not access or use the Services.</p>
          </section>

          <section id="description">
            <h2>2. Description of Service</h2>
            <p>SemaNami is an AI-powered voice assistant platform that provides users with speech coaching, role-play scenarios, real-time feedback, and interactive learning through voice and text. Our Services offer features including voice recognition, conversation history, session management, personalized learning modules, and interactive scenario-based practice.</p>
            <p>We provide content and exercises suitable for users of all age groups, including children, teens, adults, and seniors. Users can customize their experience based on their age group, interests, and learning preferences.</p>
          </section>

          <section id="age-eligibility">
            <h2>3. Age and Eligibility</h2>
            <p>Our Services are designed to be accessible to users of all ages. However, there are some restrictions:</p>
            <ul>
              <li>Users under 13 years old must have parental or guardian consent and supervision while using our Services.</li>
              <li>Users between 13 and 16 years old should obtain parental or guardian consent before using our Services.</li>
              <li>Parents or guardians are responsible for monitoring their children&apos;s use of our Services and ensuring it is appropriate for their age and development.</li>
            </ul>
            <p>By using our Services, you represent and warrant that you meet these requirements or have obtained the necessary consent if you are under the age of 16.</p>
          </section>

          <section id="license">
            <h2>4. License and Service Usage</h2>
            <p>Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, and revocable license to access and use the Services for your personal, non-commercial use.</p>
            <p>This license does not include the right to:</p>
            <ul>
              <li>Resell or make commercial use of the Services or their content</li>
              <li>Make derivative works or copy any features, functions, or graphics of the Services</li>
              <li>Use data mining, robots, or similar data gathering methods</li>
              <li>Download or copy account information for the benefit of another party</li>
              <li>Use the Services in any manner that could damage, disable, overburden, or impair our servers or networks</li>
            </ul>
          </section>

          <section id="intellectual-property">
            <h2>5. Intellectual Property</h2>
            <p>The Services and all content, features, and functionality thereof, including but not limited to text, graphics, logos, icons, images, audio clips, digital downloads, data compilations, software, and the design, selection, and arrangement thereof, are owned by SemaNami, its licensors, or other providers and are protected by copyright, trademark, patent, and other intellectual property or proprietary rights laws.</p>
            <p>You may not use, reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any material from our Services, except as allowed by these Terms or with our explicit written permission.</p>
          </section>

          <section id="user-content">
            <h2>6. User Content</h2>
            <p>The Services may allow you to upload, submit, store, send, or receive content ("User Content"). You retain ownership of any intellectual property rights that you hold in that User Content.</p>
            <p>By uploading, submitting, storing, sending, or receiving User Content through our Services, you grant SemaNami a worldwide, royalty-free license to use, host, store, reproduce, modify, create derivative works, communicate, publish, publicly perform, publicly display, and distribute that User Content for the limited purpose of operating, promoting, and improving our Services.</p>
            <p>You represent and warrant that:</p>
            <ul>
              <li>You own or control all rights in and to the User Content and have the right to grant the license granted above</li>
              <li>The User Content does not violate the privacy rights, publicity rights, copyrights, contract rights, or any other rights of any person or entity</li>
            </ul>
          </section>

          <section id="prohibited">
            <h2>7. Prohibited Activities</h2>
            <p>You agree not to use the Services to:</p>
            <ul>
              <li>Violate any applicable law, regulation, or these Terms</li>
              <li>Impersonate any person or entity or falsely state or otherwise misrepresent your affiliation with a person or entity</li>
              <li>Engage in any conduct that restricts or inhibits anyone&apos;s use or enjoyment of the Services</li>
              <li>Use the Services in any manner that could disable, overburden, damage, or impair the site or interfere with any other party&apos;s use of the Services</li>
              <li>Upload, transmit, or distribute any material that contains viruses, worms, malware, Trojan horses, or other harmful computer code</li>
              <li>Attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of the Services or any server, computer, or database connected to the Services</li>
              <li>Attack the Services via a denial-of-service attack or a distributed denial-of-service attack</li>
              <li>Collect or harvest any information from the Services, including user accounts</li>
              <li>Engage in any other conduct that restricts or inhibits anyone&apos;s use or enjoyment of the Services, or which, as determined by us, may harm us or users of the Services or expose them to liability</li>
            </ul>
          </section>

          <section id="future-pricing">
            <h2>8. Future Pricing</h2>
            <p>SemaNami is currently offered free of charge. In the future, we may introduce premium features or subscription plans. If and when we introduce paid services, we will update these Terms and provide notice to all users.</p>
            <p>By continuing to use our Services after any such updates, you will be deemed to have accepted the new terms, including any applicable payment terms. You will always have the option to continue using our free service or to upgrade to a paid subscription when available.</p>
            <p>If we introduce paid features in the future:</p>
            <ul>
              <li>We will clearly communicate the features and pricing of all subscription plans</li>
              <li>We will provide secure payment processing through trusted third-party payment processors</li>
              <li>You will have control over your subscription status, including the ability to cancel</li>
            </ul>
          </section>

          <section id="termination">
            <h2>9. Termination</h2>
            <p>We may terminate or suspend your account and access to the Services immediately, without prior notice or liability, for any reason, including, without limitation, if you breach these Terms.</p>
            <p>Upon termination, your right to use the Services will immediately cease. If you wish to terminate your account, you may simply discontinue using the Services or delete your account through the account settings.</p>
            <p>All provisions of these Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.</p>
          </section>

          <section id="disclaimers">
            <h2>10. Disclaimers</h2>
            <p>THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED OR ERROR-FREE, THAT DEFECTS WILL BE CORRECTED, OR THAT THE SERVICES OR THE SERVERS THAT MAKE THEM AVAILABLE ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.</p>
            <p>We make no guarantees regarding the accuracy, reliability, or completeness of any content available through the Services, including content provided by users or third parties.</p>
            <p>AI-generated responses are for educational and personal growth only, and may be inaccurate, incomplete, or inappropriate; always use your own judgment and do not rely solely on the Service for important decisions.</p>
          </section>

          <section id="limitation">
            <h2>11. Limitation of Liability</h2>
            <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL SEMANAMI, ITS AFFILIATES, OR THEIR RESPECTIVE DIRECTORS, OFFICERS, EMPLOYEES, AGENTS, PARTNERS, SUPPLIERS, OR CONTENT PROVIDERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:</p>
            <ul>
              <li>YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICES</li>
              <li>ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICES</li>
              <li>ANY CONTENT OBTAINED FROM THE SERVICES</li>
              <li>UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT</li>
            </ul>
            <p>WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), OR ANY OTHER LEGAL THEORY, WHETHER OR NOT WE HAVE BEEN INFORMED OF THE POSSIBILITY OF SUCH DAMAGE, AND EVEN IF A REMEDY SET FORTH HEREIN IS FOUND TO HAVE FAILED OF ITS ESSENTIAL PURPOSE.</p>
          </section>

          <section id="governing-law">
            <h2>12. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of Kenya, without regard to its conflict of law provisions.</p>
            <p>Any legal action or proceeding relating to your access to or use of the Services shall be instituted in the courts of Kenya. You agree to submit to the jurisdiction of the courts of Kenya and agree that venue in these courts is proper in any such legal action or proceeding.</p>
          </section>

          <section id="contact">
            <h2>13. Contact Information</h2>
            <p>If you have any questions about these Terms, please contact us at:</p>
            <p>SemaNami<br />
            P.O. Box 12345<br />
            Nairobi, Kenya<br />
            Email: legal@semanami.com</p>
          </section>
        </div>
      </div>

      <div className="legal-page-footer">
        <Link to="/" className="back-to-home-link">
          <div className="logo-container">
            <img src={logoImage} alt="SemaNami Logo" className="logo-image" />
            Return to Home
          </div>
        </Link>
        <p>© {new Date().getFullYear()} SemaNami. All rights reserved.</p>
      </div>
    </div>
  );
}