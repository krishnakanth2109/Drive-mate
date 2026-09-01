import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';
import { Shield, GitCommit, Users, Server, Lock, Cpu, ArrowRight, Github, Twitter, Linkedin } from 'lucide-react';

// Custom Hook for CountUp
function useCountUp(end, duration, delay) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;
    let hasStarted = false;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;

      if (progress < delay) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      if (!hasStarted) {
        startTime = timestamp - delay;
        hasStarted = true;
      }

      const activeProgress = timestamp - startTime;
      const progressRatio = Math.min(activeProgress / duration, 1);
      
      const easeProgress = 1 - Math.pow(1 - progressRatio, 3);
      setCount(Math.floor(easeProgress * end));

      if (progressRatio < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, delay]);

  return count;
}

// Typewriter Heading Component
function TypewriterHeading() {
  const fullText = "Build, scale, and secure your code with Vaultra Hub -- The ultimate platform for developers.";
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    let timeout;
    let currentIndex = 0;
    
    timeout = setTimeout(() => {
      setIsTyping(true);
      
      const typeChar = () => {
        if (currentIndex < fullText.length) {
          setDisplayedText(fullText.slice(0, currentIndex + 1));
          currentIndex++;
          timeout = setTimeout(typeChar, 35);
        } else {
          setIsTyping(false);
        }
      };
      
      typeChar();
    }, 400);

    return () => clearTimeout(timeout);
  }, [fullText]);

  // "Build, scale, and secure your code with Vaultra Hub -- " is 57 characters
  const highlightLength = 57;
  const part1 = displayedText.slice(0, highlightLength);
  const part2 = displayedText.slice(highlightLength);

  return (
    <h1 className="mk-heading">
      <span className="mk-heading-black">{part1}</span>
      <span className="mk-heading-white">{part2}</span>
      <span className="mk-cursor-blink">|</span>
    </h1>
  );
}

// Logo Ticker Component
function LogoTicker() {
  const logos = [
    "https://polo-pecan-73837341.figma.site/_assets/v11/1e7b0e6fcc016cd28aec5c68990118b8c54c35a5.svg",
    "https://polo-pecan-73837341.figma.site/_assets/v11/3eac03c183db2ae080d910159211c14843398b61.svg",
    "https://polo-pecan-73837341.figma.site/_assets/v11/17705a4c0023a0e5a99154dfb10582adbbf4260b.svg",
    "https://polo-pecan-73837341.figma.site/_assets/v11/0e5f442b09dc5c248e3e60d40a65505fb1887228.svg",
    "https://polo-pecan-73837341.figma.site/_assets/v11/63f99030ceb459e3c9ab9e429cfa2353491d3816.svg"
  ];
  
  const repeatedLogos = [...logos, ...logos, ...logos, ...logos];

  return (
    <div className="mk-ticker-container">
      <div className="mk-ticker-track">
        {repeatedLogos.map((src, index) => (
          <img key={index} src={src} alt="Tech Partner Logo" className="mk-ticker-logo" />
        ))}
      </div>
    </div>
  );
}

// Orbit Visualization Component
function OrbitVisualization() {
  const count = useCountUp(50, 2000, 1200);

  const avatars = [
    { src: 'https://polo-pecan-73837341.figma.site/_assets/v11/aa51718fb3af3637e6d666b6543fc27a175fada6.png', orbit: 1, angle: 270, radius: 177, classes: 'square-20 mk-glow-purple', delay: '0.6s' },
    { src: 'https://polo-pecan-73837341.figma.site/_assets/v11/ca755f7f93c1126fb8bdbf99ab364a33aa9ab272.png', orbit: 2, angle: 60, radius: 251, classes: 'mk-glow-yellow', delay: '0.8s' },
    { src: 'https://polo-pecan-73837341.figma.site/_assets/v11/dc01064c7093dcc32674876ee3cf5e41c4a485c6.png', orbit: 2, angle: 180, radius: 251, classes: 'size-78 mk-glow-pink', delay: '1.0s' },
    { src: 'https://polo-pecan-73837341.figma.site/_assets/v11/d5470a58b02388336141575048720f19a50de832.png', orbit: 2, angle: 300, radius: 251, classes: 'square-20 mk-glow-blue', delay: '1.2s' },
    { src: 'https://polo-pecan-73837341.figma.site/_assets/v11/018736aa5d0275c4ce56cfebaf2ae3007d81ca1e.png', orbit: 3, angle: 130, radius: 325, classes: 'size-88 mk-glow-pink', delay: '1.5s' },
    { src: 'https://polo-pecan-73837341.figma.site/_assets/v11/c76d8a0b99676de31c014344bfaf75bad090758d.png', orbit: 4, angle: 30, radius: 399, classes: 'mk-glow-purple', delay: '1.7s' },
    { src: 'https://polo-pecan-73837341.figma.site/_assets/v11/7b1b5f039de7b54cc9913e96c1923c3b15a157fa.png', orbit: 4, angle: 95, radius: 399, classes: 'size-88 square-24 mk-glow-orange', delay: '1.9s' },
    { src: 'https://polo-pecan-73837341.figma.site/_assets/v11/9ae171d8895199349755c43fbff00e122221a027.png', orbit: 4, angle: 220, radius: 399, classes: 'size-88 square-24 mk-glow-pink', delay: '2.1s' },
    { src: 'https://polo-pecan-73837341.figma.site/_assets/v11/926c9eb7b4bc1df846fa0e39f0b0dc3fefd80671.png', orbit: 4, angle: 320, radius: 399, classes: 'mk-glow-purple', delay: '2.3s' },
  ];

  return (
    <div className="mk-orbits-container">
      <div className="mk-orbit mk-orbit-1 mk-spin-left" style={{ '--duration': '30s' }}>
        <div className="mk-orbit-inner mk-counter-rotate-left" style={{ '--duration': '30s' }}>
          <div className="mk-center-stats">
            <span className="mk-stat-num">{count}M+</span>
            <span className="mk-stat-label">Commits</span>
          </div>
        </div>
      </div>
      
      <div className="mk-orbit mk-orbit-2 mk-spin-right" style={{ '--duration': '40s' }}></div>
      <div className="mk-orbit mk-orbit-3 mk-spin-right" style={{ '--duration': '50s' }}></div>
      <div className="mk-orbit mk-orbit-4 mk-spin-left" style={{ '--duration': '60s' }}></div>

      {avatars.map((av, idx) => (
        <div 
          key={idx} 
          className="mk-avatar-wrapper"
          style={{ 
            transform: `translate(-50%, -50%) rotate(${av.angle}deg) translate(${av.radius}px) rotate(-${av.angle}deg)` 
          }}
        >
          <div className={
              av.orbit === 1 || av.orbit === 4 ? 'mk-counter-rotate-left' : 'mk-counter-rotate-right'
            } 
            style={{ 
              '--duration': av.orbit === 1 ? '30s' : av.orbit === 2 ? '40s' : av.orbit === 3 ? '50s' : '60s',
              width: '100%', height: '100%', position: 'relative'
            }}
          >
            <img 
              src={av.src} 
              alt="Avatar" 
              className={`mk-avatar ${av.classes}`} 
              style={{ animationDelay: av.delay }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Features Section
function FeaturesSection() {
  const features = [
    {
      icon: <GitCommit className="text-[#FF2A2A]" size={32} />,
      title: "Secure Code Hosting",
      description: "Fast, reliable, and secure Git repositories with built-in code review and branch protection rules."
    },
    {
      icon: <Cpu className="text-[#FF2A2A]" size={32} />,
      title: "Vaultra Actions",
      description: "Automate your CI/CD workflows natively. Build, test, and deploy your code seamlessly."
    },
    {
      icon: <Users className="text-[#FF2A2A]" size={32} />,
      title: "Organization Collaboration",
      description: "Manage teams, control access with granular roles, and collaborate effectively at scale."
    }
  ];

  return (
    <section className="vh-features">
      <div className="vh-container">
        <h2 className="vh-section-title">Everything you need to ship better software</h2>
        <div className="vh-features-grid">
          {features.map((feat, index) => (
            <div key={index} className="vh-feature-card">
              <div className="vh-feature-icon">{feat.icon}</div>
              <h3 className="vh-feature-title">{feat.title}</h3>
              <p className="vh-feature-desc">{feat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Workflow / Showcase Section
function WorkflowSection() {
  return (
    <section className="vh-showcase">
      <div className="vh-container">
        
        {/* Block A: Pull Requests */}
        <div className="vh-showcase-row">
          <div className="vh-showcase-text">
            <h2 className="vh-section-title text-left !mb-6">Seamless Code Reviews</h2>
            <p className="vh-showcase-desc">
              Collaborate effortlessly with inline commenting, intelligent code suggestions, and strict branch protection rules. Catch bugs before they hit production with integrated automated checks.
            </p>
            <Link to="/auth" className="btn-border-wrap mt-8">
              <button className="mk-btn mk-btn-start !bg-[#000000]">
                Explore Workflows <ArrowRight size={18} />
              </button>
            </Link>
          </div>
          <div className="vh-showcase-image-wrapper">
            <img src="/images/pr_mockup.jpg" alt="Pull Request UI" className="vh-showcase-img" />
          </div>
        </div>

        {/* Block B: CI/CD */}
        <div className="vh-showcase-row reverse">
          <div className="vh-showcase-image-wrapper">
            <img src="/images/pipeline_mockup.jpg" alt="CI/CD Pipeline UI" className="vh-showcase-img" />
          </div>
          <div className="vh-showcase-text pl-12">
            <h2 className="vh-section-title text-left !mb-6">Automate Everything</h2>
            <p className="vh-showcase-desc">
              Trigger CI/CD pipelines directly from your commits. Vaultra Actions scale with your team, from simple automated tests to complex multi-environment Kubernetes deployments.
            </p>
            <Link to="/auth" className="btn-border-wrap mt-8">
              <button className="mk-btn mk-btn-start !bg-[#000000]">
                View Actions <ArrowRight size={18} />
              </button>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}

// Global Scale Banner Section
function BannerSection() {
  return (
    <section className="vh-banner">
      <div className="vh-banner-bg" style={{ backgroundImage: 'url(/images/network_globe.jpg)' }}></div>
      <div className="vh-banner-overlay"></div>
      <div className="vh-banner-content vh-container text-center">
        <h2 className="vh-banner-title">Trusted by developers worldwide.</h2>
        <p className="vh-banner-desc">Scale your infrastructure without limits on the fastest, most secure cloud platform.</p>
        <Link to="/auth" className="btn-border-wrap mt-10">
          <button className="mk-btn mk-btn-join !bg-[#FF2A2A] !text-white !px-8 !py-4 !text-lg">
            Start Building Free
          </button>
        </Link>
      </div>
    </section>
  );
}

// Enterprise / Master Admin Section
function EnterpriseSection() {
  return (
    <section className="vh-enterprise">
      <div className="vh-container">
        <div className="vh-enterprise-card">
          <div className="vh-enterprise-content">
            <h2 className="vh-section-title text-left">Master Administration Portal</h2>
            <p className="vh-enterprise-desc">
              Take total control of your infrastructure. Vaultra Hub's Master Portal gives administrators unprecedented visibility and security controls over all users, repositories, and workflows.
            </p>
            <ul className="vh-enterprise-list">
              <li><Shield size={20} className="text-[#FF2A2A]" /> Advanced Security Policies</li>
              <li><Lock size={20} className="text-[#FF2A2A]" /> Enterprise-grade Access Controls</li>
              <li><Server size={20} className="text-[#FF2A2A]" /> Global Repository Oversight</li>
            </ul>
            <Link to="/master" className="btn-border-wrap mt-6">
              <button className="mk-btn mk-btn-start !bg-[#000000]">
                Access Master Portal <ArrowRight size={18} />
              </button>
            </Link>
          </div>
          <div className="vh-enterprise-visual">
            <div className="vh-mock-dashboard">
              <div className="vh-mock-header"></div>
              <div className="vh-mock-body">
                <div className="vh-mock-sidebar"></div>
                <div className="vh-mock-content">
                  <div className="vh-mock-row"></div>
                  <div className="vh-mock-row"></div>
                  <div className="vh-mock-row w-[80%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Footer Component
function Footer() {
  return (
    <footer className="vh-footer">
      <div className="vh-container vh-footer-content">
        <div className="vh-footer-brand">
          <span className="font-bold text-xl text-white">Vaultra Hub</span>
          <p className="text-[#8b949e] mt-2 text-sm">The platform for developers to build and collaborate.</p>
        </div>
        <div className="vh-footer-links">
          <div className="vh-footer-column">
            <h4>Product</h4>
            <a href="#">Features</a>
            <a href="#">Security</a>
            <a href="#">Enterprise</a>
            <a href="#">Pricing</a>
          </div>
          <div className="vh-footer-column">
            <h4>Platform</h4>
            <a href="#">API API</a>
            <a href="#">Vaultra Actions</a>
            <a href="#">Status</a>
          </div>
          <div className="vh-footer-column">
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Blog</a>
            <a href="#">Careers</a>
          </div>
        </div>
      </div>
      <div className="vh-footer-bottom">
        <div className="vh-container flex justify-between items-center flex-wrap gap-4">
          <p className="text-[#8b949e] text-sm">© {new Date().getFullYear()} Vaultra System Administration. All rights reserved.</p>
          <div className="flex gap-4 text-[#8b949e]">
            <a href="#" className="hover:text-white transition-colors"><Github size={20} /></a>
            <a href="#" className="hover:text-white transition-colors"><Twitter size={20} /></a>
            <a href="#" className="hover:text-white transition-colors"><Linkedin size={20} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main Page Component
export function LandingPage() {
  return (
    <div className="marketeam-app">
      
      {/* Hero Section Container (Full Height) */}
      <div className="vh-hero-wrapper">
        <header className="mk-header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="font-bold text-2xl text-white tracking-tight mr-12">Vaultra Hub</span>
            <nav className="mk-nav-links !ml-0">
              <a href="#" className="mk-nav-link">Features</a>
              <a href="#" className="mk-nav-link">Actions</a>
              <a href="#" className="mk-nav-link">Organizations</a>
              <a href="#" className="mk-nav-link">Enterprise</a>
            </nav>
          </div>
          
          <div className="mk-header-right">
            <Link to="/auth" className="mk-login-link">Sign In</Link>
            <div className="btn-border-wrap">
              <Link to="/auth" style={{ textDecoration: 'none' }}>
                <button className="mk-btn mk-btn-join">Get Started</button>
              </Link>
            </div>
          </div>
        </header>

        <main className="mk-hero">
          <div className="mk-hero-left">
            <TypewriterHeading />
            
            <div style={{ position: 'relative' }}>
              <div className="btn-border-wrap" style={{ animationDelay: '3.2s', opacity: 0, animation: 'fadeUp 0.6s forwards 3.2s' }}>
                <Link to="/auth" style={{ textDecoration: 'none' }}>
                  <button className="mk-btn mk-btn-start">
                    Create Repository
                    <ArrowRight size={18} />
                  </button>
                </Link>
              </div>
              
              <div className="mk-cursor-badge">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#FF2A2A" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.15789 2.50293L19.4674 9.00695C20.6698 9.51774 20.7303 11.2062 19.5701 11.8105L13.7844 14.8248C13.5677 14.9377 13.3934 15.112 13.2805 15.3287L10.2662 21.1144C9.66187 22.2746 7.97335 22.2141 7.46256 21.0117L0.958537 5.7022C0.42878 4.45607 1.57945 3.19794 2.8596 3.63004L4.15789 2.50293Z" />
                </svg>
                <div className="mk-badge-pill">DevOps</div>
              </div>
            </div>
          </div>

          <div className="mk-hero-right">
            <OrbitVisualization />
          </div>
        </main>

        <LogoTicker />
      </div>

      <FeaturesSection />
      <WorkflowSection />
      <BannerSection />
      <EnterpriseSection />
      <Footer />
    </div>
  );
}
