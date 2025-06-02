import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../assets/styles/LandingPage.css';
// Import your logo - place logo.png in src/assets/images/
import logoImage from '../assets/images/logo.png';

export default function LandingPage() {
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.querySelector('.hero');
      if (heroSection) {
        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
        const shouldShow = window.scrollY < heroBottom - 100;
        setShowScrollIndicator(shouldShow);
        
        // Debug logging
        console.log('Scroll position:', window.scrollY);
        console.log('Hero bottom:', heroBottom);
        console.log('Show indicator:', shouldShow);
      }
    };

    // Initial check
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToFeatures = () => {
    console.log('Scroll button clicked');
    const featuresSection = document.querySelector('.features');
    if (featuresSection) {
      console.log('Features section found, scrolling...');
      featuresSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    } else {
      console.log('Features section not found');
    }
  };

  return (
    <main className="landing-page">
      <header className="hero">
        <div className="hero-img">
          <img src="/assets/images/hero_voice_practice.png" alt="Welcome back - Log in to your account" />
        </div>
        <div className="hero-text">
          <div className="hero-branding">
            <div className="logo-container">
              <img 
                src={logoImage}
                alt="SemaNami Logo" 
                className="logo-image"
                onError={(e) => {
                  console.log('Hero logo failed to load from:', e.target.src);
                  // Hide the broken image and let CSS ::after pseudo-element show fallback
                  e.target.style.display = 'none';
                }}
                onLoad={(e) => {
                  console.log('Hero logo loaded successfully!');
                  // Ensure the image is visible when loaded
                  e.target.style.display = 'block';
                }}
              />
            </div>
            <h1>SemaNami</h1>
          </div>
          <p>Interactive voice role-play to build your communication confidence.</p>
          <Link to="/login" className="cta-button">Get Started</Link>
        </div>
      </header>
      
      <section className="features">
        <div className="content-container">
          <h2>What You Can Do</h2>
          <div className="feature-grid">
            <div className="feature">
              <img src="/assets/images/choose_scenario.png" alt="Scenario selection" />
              <h3>Choose a Role-Play</h3>
              <p>Practice courtroom arguments, interviews, or even funny skits.</p>
            </div>
            <div className="feature">
              <img src="/assets/images/record_conversation.png" alt="Recording practice" />
              <h3>Talk Naturally</h3>
              <p>Use your voice or text to explore conversations with real-time feedback.</p>
            </div>
            <div className="feature">
              <img src="/assets/images/review_feedback.png" alt="Feedback and analysis" />
              <h3>Review and Improve</h3>
              <p>Receive instant feedback on tone, grammar, and fluency.</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="try-now">
        <div className="content-container">
          <h2>Ready to Practice?</h2>
          <p>Create an account to access your role-play dashboard and start speaking with confidence.</p>
          <Link to="/signup" className="cta-button">Sign Up Free</Link>
        </div>
      </section>
      
      <footer className="site-footer">
        <div className="content-container">
          <div className="footer-content">
            <div className="footer-logo">
              <div className="footer-branding">
                <div className="logo-container">
                  <img 
                    src={logoImage}
                    alt="SemaNami Logo" 
                    className="logo-image"
                    onError={(e) => {
                      console.log('Footer logo failed to load from:', e.target.src);
                      // Hide the broken image and let CSS ::after pseudo-element show fallback
                      e.target.style.display = 'none';
                    }}
                    onLoad={(e) => {
                      console.log('Footer logo loaded successfully!');
                      // Ensure the image is visible when loaded
                      e.target.style.display = 'block';
                    }}
                  />
                </div>
                <h3>SemaNami</h3>
              </div>
              <p>Building communication confidence through interactive practice.</p>
            </div>
            
            <div className="footer-column">
              <h4>Platform</h4>
              <ul>
                <li><Link to="/features">Features</Link></li>
                <li><Link to="/faq">FAQ</Link></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4>Company</h4>
              <ul>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/contact">Contact</Link></li>
                <li><Link to="/careers">Careers</Link></li>
              </ul>
            </div>
            
            <div className="footer-column">
              <h4>Legal</h4>
              <ul>
                <li><Link to="/terms">Terms of Service</Link></li>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/cookies">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} SemaNami. All rights reserved.</p>
            
            <div className="social-links">
              <a href="https://twitter.com/semanami" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <i className="fa fa-twitter"></i>
              </a>
              <a href="https://facebook.com/semanami" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <i className="fa fa-facebook"></i>
              </a>
              <a href="https://linkedin.com/company/semanami" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <i className="fa fa-linkedin"></i>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll Indicator */}
      {showScrollIndicator && (
        <div className="scroll-indicator" onClick={scrollToFeatures} style={{cursor: 'pointer'}}>
        </div>
      )}
    </main>
  );
}