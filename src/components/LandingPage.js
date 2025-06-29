import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowDown, FiTwitter, FiFacebook, FiLinkedin } from 'react-icons/fi';
import ResponsiveContainer, { Grid, Stack, Center } from './layout/ResponsiveContainer';
import Button from './ui/Button';
import ErrorDisplay from './ui/ErrorDisplay';
import '../assets/styles/LandingPage.css';
// Import your logo - place logo.png in src/assets/images/
import logoImage from '../assets/images/logo.png';

export default function LandingPage() {
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [imageErrors, setImageErrors] = useState({});

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

  const handleImageError = (imageKey) => {
    setImageErrors(prev => ({ ...prev, [imageKey]: true }));
  };

  const features = [
    {
      image: '/assets/images/choose_scenario.png',
      title: 'Choose a Role-Play',
      description: 'Practice courtroom arguments, interviews, or even funny skits.',
      key: 'scenario'
    },
    {
      image: '/assets/images/record_conversation.png',
      title: 'Talk Naturally',
      description: 'Use your voice or text to explore conversations with real-time feedback.',
      key: 'record'
    },
    {
      image: '/assets/images/review_feedback.png',
      title: 'Review and Improve',
      description: 'Receive instant feedback on tone, grammar, and fluency.',
      key: 'review'
    }
  ];

  const socialLinks = [
    {
      href: 'https://twitter.com/semanami',
      icon: FiTwitter,
      label: 'Twitter'
    },
    {
      href: 'https://facebook.com/semanami',
      icon: FiFacebook,
      label: 'Facebook'
    },
    {
      href: 'https://linkedin.com/company/semanami',
      icon: FiLinkedin,
      label: 'LinkedIn'
    }
  ];

  return (
    <main className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <ResponsiveContainer maxWidth="2xl">
          <div className="hero-content">
            <div className="hero-image">
              {!imageErrors.hero ? (
                <img 
                  src="/assets/images/hero_voice_practice.png" 
                  alt="Voice practice illustration" 
                  onError={() => handleImageError('hero')}
                />
              ) : (
                <div className="hero-image-fallback">
                  <div className="placeholder-icon">🎙️</div>
                </div>
              )}
            </div>
            
            <div className="hero-text">
              <Stack spacing="lg">
                <div className="hero-branding">
                  <div className="logo-container">
                    {!imageErrors.logo ? (
                      <img 
                        src={logoImage}
                        alt="SemaNami Logo" 
                        className="logo-image"
                        onError={() => handleImageError('logo')}
                      />
                    ) : (
                      <div className="logo-fallback">S</div>
                    )}
                  </div>
                  <h1>SemaNami</h1>
                </div>
                
                <p className="hero-description">
                  Interactive voice role-play to build your communication confidence.
                </p>
                
                <div className="hero-actions">
                  <Button as={Link} to="/login" size="large">
                    Get Started
                  </Button>
                  <Button 
                    as={Link} 
                    to="/signup" 
                    variant="outline" 
                    size="large"
                  >
                    Sign Up Free
                  </Button>
                </div>
              </Stack>
            </div>
          </div>
        </ResponsiveContainer>
      </section>
      
      {/* Features Section */}
      <section className="features">
        <ResponsiveContainer maxWidth="xl">
          <Stack spacing="xl" className="features-content">
            <div className="section-header">
              <h2>What You Can Do</h2>
              <p>Discover powerful features designed to improve your communication skills</p>
            </div>
            
            <Grid columns={3} gap="lg" className="feature-grid">
              {features.map((feature) => (
                <div key={feature.key} className="feature-card">
                  <div className="feature-image">
                    {!imageErrors[feature.key] ? (
                      <img 
                        src={feature.image} 
                        alt={feature.title}
                        onError={() => handleImageError(feature.key)}
                      />
                    ) : (
                      <div className="feature-image-fallback">
                        <div className="placeholder-icon">📝</div>
                      </div>
                    )}
                  </div>
                  <div className="feature-content">
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </Grid>
          </Stack>
        </ResponsiveContainer>
      </section>
      
      {/* Call to Action Section */}
      <section className="cta-section">
        <ResponsiveContainer maxWidth="lg">
          <Center className="cta-content">
            <Stack spacing="lg" className="cta-text">
              <h2>Ready to Practice?</h2>
              <p>
                Create an account to access your role-play dashboard and start speaking with confidence.
              </p>
              <div className="cta-actions">
                <Button as={Link} to="/signup" size="large">
                  Sign Up Free
                </Button>
                <Button as={Link} to="/login" variant="outline" size="large">
                  Log In
                </Button>
              </div>
            </Stack>
          </Center>
        </ResponsiveContainer>
      </section>
      
      {/* Footer */}
      <footer className="site-footer">
        <ResponsiveContainer maxWidth="xl">
          <Stack spacing="xl">
            <Grid columns={4} gap="lg" className="footer-content">
              <div className="footer-brand">
                <div className="footer-logo">
                  <div className="logo-container">
                    {!imageErrors.footerLogo ? (
                      <img 
                        src={logoImage}
                        alt="SemaNami Logo" 
                        className="logo-image"
                        onError={() => handleImageError('footerLogo')}
                      />
                    ) : (
                      <div className="logo-fallback">S</div>
                    )}
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
                  <li><Link to="/pricing">Pricing</Link></li>
                </ul>
              </div>
              
              <div className="footer-column">
                <h4>Company</h4>
                <ul>
                  <li><Link to="/about">About Us</Link></li>
                  <li><Link to="/contact">Contact</Link></li>
                  <li><Link to="/careers">Careers</Link></li>
                  <li><Link to="/blog">Blog</Link></li>
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
            </Grid>
            
            <div className="footer-bottom">
              <div className="footer-bottom-content">
                <p>&copy; {new Date().getFullYear()} SemaNami. All rights reserved.</p>
                
                <div className="social-links">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        className="social-link"
                      >
                        <Icon />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </Stack>
        </ResponsiveContainer>
      </footer>

      {/* Scroll Indicator */}
      {showScrollIndicator && (
        <button 
          className="scroll-indicator" 
          onClick={scrollToFeatures}
          aria-label="Scroll to features"
        >
          <FiArrowDown />
        </button>
      )}
    </main>
  );
}