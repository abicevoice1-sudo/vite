import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth/AuthContext';
import { motion } from 'framer-motion';
import {
  Sparkles, Menu, X, ArrowRight, BadgeCheck,
  MessageCircle, Globe, Mail, Send, Bot, Bell, User, Heart, ShieldCheck, UserCheck
} from 'lucide-react';
import ThemeMenu from '../components/ThemeMenu';
import AIAssistant, { openAIAssistant } from '../components/AIAssistant';

const landingLinks = [
  { href: '/profiles', label: 'Profiles' },
  { href: '/blog', label: 'Blog' },
  { href: '/community', label: 'Community' },
  { href: '/contact', label: 'Contact' },
];

// ── Notifications — accessible popover with unread state ────────────────────
const NOTIFICATIONS = [
  { id: 'n1', icon: Heart, text: 'Aaliyah R. accepted your introduction request.', time: '12m ago', unread: true },
  { id: 'n2', icon: ShieldCheck, text: 'Your ID verification was approved.', time: '2h ago', unread: true },
  { id: 'n3', icon: UserCheck, text: 'Wali invite accepted by Hassan N. (Fatima’s father).', time: 'Yesterday', unread: false },
];

function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(NOTIFICATIONS);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const unreadCount = items.filter(n => n.unread).length;
  const markAllRead = () => setItems(prev => prev.map(n => ({ ...n, unread: false })));

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        ref={buttonRef}
        className="landing-icon-btn"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen(o => !o)}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute', top: 6, right: 6, width: 8, height: 8,
              borderRadius: '50%', background: 'var(--color-danger)',
              boxShadow: '0 0 0 2px var(--color-canvas)',
            }}
          />
        )}
      </button>

      {open && (
        <div
          role="region"
          aria-label="Notifications"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 60,
            width: 'min(340px, calc(100vw - 24px))', padding: '6px',
            borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)',
            background: 'var(--color-elevated)', boxShadow: '0 12px 32px rgba(0,0,0,0.22)',
          }}
        >
          <div className="flex items-center justify-between" style={{ padding: '6px 8px 10px' }}>
            <span className="text-xs font-bold" style={{ color: 'var(--color-ink)' }}>Notifications</span>
            <button
              onClick={markAllRead}
              className="text-xs font-semibold"
              style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
            >
              Mark all read
            </button>
          </div>
          {items.map(({ id, icon: Icon, text, time, unread }) => (
            <div
              key={id}
              className="flex items-start gap-2.5"
              style={{
                padding: '10px 8px', borderRadius: 'var(--radius-md)',
                background: unread ? 'var(--color-primary-subtle)' : 'transparent',
                opacity: unread ? 1 : 0.72,
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: 'var(--color-ink)', lineHeight: 1.45 }}>{text}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-ink-tertiary)' }}>{time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function LandingHeader({ dark, setDark }) {
  const { isLoggedIn } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header className="landing-header">
      <div className="landing-header-inner">
        {/* Logo */}
        <Link to="/" className="landing-brand">
          <span className="landing-brand-mark">S</span>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.02em' }}>SHIARISHTA</span>
            <span style={{ fontSize: '0.6rem', fontWeight: 500, letterSpacing: '0.08em', color: 'var(--color-ink-tertiary)', textTransform: 'uppercase' }}>Nikah Matchmaking</span>
          </div>
        </Link>

        {/* Primary nav — centered */}
        <nav className="landing-nav" aria-label="Main navigation">
          {landingLinks.map(l => (
            <Link key={l.href} to={l.href}>{l.label}</Link>
          ))}
        </nav>

        {/* Secondary actions — right */}
        <div className="landing-header-actions">
          {/* Utility: AI Assistant */}
          <button type="button" className="btn btn-ghost btn-sm landing-header-ai" onClick={openAIAssistant} aria-label="Open AI assistant">
            <Bot className="w-3.5 h-3.5" /> AI
          </button>

          {/* Icon group: Notifications + Profile (Settings moved to corner) */}
          <div className="landing-header-icon-group">
            {isLoggedIn && (
              <NotificationsMenu />
            )}
            {isLoggedIn && (
              <Link
                to="/dashboard"
                className="landing-icon-btn"
                style={{ background: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}
                aria-label="Your dashboard"
                title="Your dashboard"
              >
                <User className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Auth / CTA */}
          {isLoggedIn ? (
            <Link to="/dashboard" className="btn btn-primary btn-sm landing-header-cta">
              Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link to="/auth/login" className="btn btn-ghost btn-sm landing-cta-header-login landing-header-cta">
                Sign in
              </Link>
              <Link to="/auth/register" className="btn btn-primary btn-sm landing-cta-header landing-header-cta">
                Create free account
              </Link>
            </>
          )}

          {/* Setting icon - positioned in corner right side */}
          <ThemeMenu dark={dark} setDark={setDark} direction="down" className="landing-header-theme-corner" />

          {/* Mobile menu toggle */}
          <button className="landing-icon-btn landing-menu-btn" onClick={() => setMobileOpen(o => !o)} aria-label="Toggle menu" aria-expanded={mobileOpen}>
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className={`landing-mobile-nav ${mobileOpen ? 'open' : ''}`} role="navigation" aria-label="Mobile">
        {landingLinks.map(l => (
          <Link key={l.href} to={l.href}>{l.label}</Link>
        ))}
        {isLoggedIn && (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/settings">Settings</Link>
          </>
        )}
        <button
          type="button"
          onClick={() => { setMobileOpen(false); openAIAssistant(); }}
          className="flex items-center gap-2"
          style={{ padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-md)', fontWeight: 550, color: 'var(--color-ink-secondary)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
        >
          <Bot className="w-4 h-4" /> AI Assistant
        </button>
        {!isLoggedIn && (
          <>
            <Link to="/auth/login">Sign in</Link>
            <Link to="/auth/register">Create free account</Link>
          </>
        )}
      </div>
    </header>
  );
}

function LandingFooter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const subscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <footer className="landing-footer">
      <div className="landing-footer-inner">
        {/* Col 1 — Brand + Status */}
        <div className="landing-footer-brand">
          <Link to="/" className="landing-brand" style={{ marginBottom: '0.5rem' }}>
            <span className="landing-brand-mark">S</span>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>SHIARISHTA</span>
          </Link>
          <p>
            Privacy-first Shia matchmaking where intention meets introduction.
            Built on trust, verification, and wali-supported journeys.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs" style={{ color: 'var(--color-ink-tertiary)' }}>All systems operational</span>
          </div>
        </div>

        {/* Col 2 — Platform */}
        <div className="landing-footer-col">
          <div className="landing-footer-col-title">Platform</div>
          <Link to="/profiles">Browse Profiles</Link>
          <Link to="/success-stories">Success Stories</Link>
          <Link to="/auth/register">Create Profile</Link>
        </div>

        {/* Col 3 — Resources */}
        <div className="landing-footer-col">
          <div className="landing-footer-col-title">Resources</div>
          <Link to="/blog">Guidance Blog</Link>
          <Link to="/community">Community</Link>
          <Link to="/safety">Safety Center</Link>
          <Link to="/support">Help &amp; Support</Link>
          <Link to="/contact">Contact Us</Link>
        </div>

        {/* Col 4 — Newsletter */}
        <div className="landing-footer-col">
          <div className="landing-footer-col-title">Stay Updated</div>
          <p style={{ fontSize: '0.8125rem', lineHeight: 1.6, color: 'var(--color-ink-secondary)', marginBottom: '0.75rem' }}>
            Get matchmaking guidance and community updates.
          </p>
          {subscribed ? (
            <p className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--color-success)' }}>
              <BadgeCheck className="w-3.5 h-3.5" /> Subscribed — welcome!
            </p>
          ) : (
            <form onSubmit={subscribe} className="flex gap-2">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                aria-label="Email address"
                className="input"
                style={{ padding: '0.4rem 0.6rem', fontSize: '0.8125rem' }}
              />
              <button type="submit" className="btn btn-primary btn-sm" aria-label="Subscribe">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="landing-footer-bottom">
        <span>© 2026 Shiarishta. All rights reserved.</span>
        <div className="flex flex-col gap-2">
          <Link to="/privacy" className="text-xs" style={{ color: 'var(--color-ink-tertiary)' }}>Privacy</Link>
          <Link to="/terms" className="text-xs" style={{ color: 'var(--color-ink-tertiary)' }}>Terms</Link>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile navigation styles (kept minimal — main styles are in globals.css)
// ─────────────────────────────────────────────────────────────────────────────

export default function LandingLayout({ children }) {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('shiarishta_theme:v2') === 'dark';
  });
  const location = useLocation();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.classList.toggle('light', !dark);
    localStorage.setItem('shiarishta_theme:v2', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="landing-shell">
      <LandingHeader dark={dark} setDark={setDark} />
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1"
        style={{ paddingTop: 'var(--header-height)' }}
      >
        {children}
      </motion.main>
      <LandingFooter />

      {/* AI Assistant FAB */}
      <AIAssistant />

      {/* Minimal mobile nav styles */}
      <style>{`
        .landing-mobile-nav {
          display: none;
          flex-direction: column;
          padding: 0.75rem 1.25rem 1.1rem;
          gap: 0.2rem;
          border-top: 1px solid var(--color-border-subtle);
        }
        .landing-mobile-nav.open { display: flex; }
        .landing-mobile-nav a {
          padding: 0.65rem 0.75rem;
          border-radius: var(--radius-md);
          font-weight: 550;
          color: var(--color-ink-secondary);
          text-decoration: none;
        }
        .landing-mobile-nav a:hover { background: var(--color-hover); color: var(--color-ink); }
        .landing-cta-header-login { display: inline-flex; }
        .landing-cta-header { display: inline-flex; }
        @media (max-width: 960px) {
          .landing-cta-header-login { display: none; }
        }
        @media (max-width: 640px) {
          .landing-cta-header { display: none; }
        }
      `}</style>
    </div>
  );
}
