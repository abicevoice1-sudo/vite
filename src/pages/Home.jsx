import { Link } from 'react-router-dom';
import { Shield, Eye, Users, Heart, ArrowRight, BadgeCheck, Lock } from 'lucide-react';
import Layout from '../layouts/LandingLayout';

const stats = [
  { value: '2,400+', label: 'Verified members' },
  { value: '45+', label: 'Cities' },
  { value: '8,500+', label: 'Matches' },
  { value: '98%', label: 'Recommend' },
];

const steps = [
  { num: '01', title: 'Create profile', desc: 'Share intentions privately.', tag: 'Intention' },
  { num: '02', title: 'Verify', desc: 'Identity check.', tag: 'Verified' },
  { num: '03', title: 'Match', desc: 'Curated matches.', tag: 'Family' },
];

const features = [
  { icon: Shield, title: 'Verified First', desc: 'Every member goes through identity + intention verification.' },
  { icon: Eye, title: 'Privacy Built In', desc: 'Control photo visibility.' },
  { icon: Users, title: 'Family Involvement', desc: 'Wali and guardian workflows.' },
  { icon: Heart, title: 'Values-Based Matching', desc: 'Compatibility scored on faith and lifestyle.' },
];

const testimonials = [
  { quote: 'Changed how my family approached this.', name: 'Zainab H.', role: 'London', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=70' },
  { quote: 'Privacy controls unlike anything else.', name: 'Omar F.', role: 'Toronto', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=70' },
  { quote: 'Met in March, nikah before year end.', name: 'Maryam & Y.', role: 'Chicago', photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=70' },
];

export default function Home() {
  return (
    <Layout>
      <main>
        <section style={{ padding: 'clamp(3rem,7vw,6rem) 1.5rem', textAlign: 'center', maxWidth: '820px', margin: '0 auto' }}>
          <span className="eyebrow" style={{ marginBottom: '1rem' }}>Nikah-first matchmaking</span>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1.1, marginBottom: '1.25rem' }}>
            Find your life partner with <span style={{ color: 'var(--color-primary)' }}>faith, privacy, and intention</span>.
          </h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--color-ink-secondary)', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto 2rem' }}>
            Dignified, verified matchmaking with privacy controls and chaperone support.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/profiles" className="button primary px-6 py-3 font-semibold flex items-center gap-2">Search profiles <ArrowRight className="w-4 h-4" /></Link>
            <Link to="/register" className="button px-6 py-3 font-semibold flex items-center gap-2" style={{ background: 'var(--color-elevated)', color: 'var(--color-ink)', border: '1px solid var(--color-border)' }}>Join free</Link>
          </div>
        </section>

        <section className="landing-section"><div className="landing-container"><div className="landing-stats">
          {stats.map(s => (<div key={s.label}><div className="landing-stat-value">{s.value}</div><div className="landing-stat-label">{s.label}</div></div>))}
        </div></div></section>

        <section className="landing-section"><div className="landing-container"><div className="section-head"><h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.25rem)', fontWeight: 700, color: 'var(--color-ink)' }}>How it works</h2><p>Simple, dignified steps.</p></div>
          <div className="steps-grid">
            {steps.map(s => (<div key={s.num} className="step-card"><div className="step-num">{s.num}</div><h3>{s.title}</h3><p>{s.desc}</p><span className="step-tag">{s.tag}</span></div>))}
          </div>
        </div></section>

        <section className="landing-section"><div className="landing-container"><div className="section-head"><h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.25rem)', fontWeight: 700, color: 'var(--color-ink)' }}>Built around your values</h2></div>
          <div className="features-grid">
            {features.map(f => { const FI = f.icon; return (<div key={f.title} className="feature-card"><div className="feature-icon"><FI className="w-5 h-5" /></div><h3>{f.title}</h3><p>{f.desc}</p></div>); })}
          </div>
        </div></section>

        <section className="landing-section"><div className="landing-container"><div className="section-head"><h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.25rem)', fontWeight: 700, color: 'var(--color-ink)' }}>Stories from our community</h2></div>
          <div className="testimonials-grid">
            {testimonials.map(t => (<div key={t.name} className="testimonial-card"><img src={t.photo} alt={t.name} className="testimonial-img" /><p className="testimonial-quote">"{t.quote}"</p><p style={{ fontWeight: 600, color: 'var(--color-ink)', fontSize: '0.875rem' }}>{t.name}</p><p style={{ fontSize: '0.75rem', color: 'var(--color-ink-faint)' }}>{t.role}</p></div>))}
          </div>
        </div></section>

        <section className="cta-banner">
          <h2 style={{ fontSize: 'clamp(1.5rem,3vw,2.25rem)', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>Ready to begin?</h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', marginBottom: '1.5rem' }}>Join verified members seeking a halal path to marriage.</p>
          <Link to="/register" className="button px-8 py-3 font-semibold" style={{ background: '#fff', color: 'var(--color-primary)' }}>Create free profile</Link>
        </section>
      </main>
      <style>{`
        .landing-section{padding:clamp(3rem,6vw,5rem) 1.5rem}
        .landing-container{max-width:1200px;margin:0 auto}
        .landing-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:1.5rem;text-align:center;padding:2rem;border-radius:var(--radius-xl);background:var(--color-elevated);border:1px solid var(--color-border)}
        .landing-stat-value{font-size:clamp(1.5rem,3vw,2.25rem);font-weight:700;color:var(--color-ink)}
        .landing-stat-label{font-size:0.8125rem;color:var(--color-ink-secondary);margin-top:0.25rem}
        .section-head{text-align:center;max-width:600px;margin:0 auto 3rem}
        .section-head h2{margin-bottom:0.75rem}
        .section-head p{font-size:1rem;color:var(--color-ink-secondary)}
        .eyebrow{display:inline-block;font-size:0.6875rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--color-primary);margin-bottom:0.75rem}
        .steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem}
        .step-card{padding:1.5rem;border-radius:var(--radius-lg);background:var(--color-elevated);border:1px solid var(--color-border)}
        .step-num{font-family:var(--font-display);font-size:2rem;font-weight:600;color:var(--color-primary);margin-bottom:0.75rem}
        .step-card h3{font-size:1.125rem;font-weight:600;color:var(--color-ink);margin-bottom:0.5rem}
        .step-card p{font-size:0.875rem;color:var(--color-ink-secondary);line-height:1.6;margin-bottom:1rem}
        .step-tag{display:inline-flex;font-size:0.6875rem;font-weight:600;text-transform:uppercase;color:var(--color-primary);background:var(--color-primary-subtle);padding:0.25rem 0.625rem;border-radius:var(--radius-full)}
        .features-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1.5rem}
        .feature-card{padding:1.5rem;border-radius:var(--radius-lg);background:var(--color-elevated);border:1px solid var(--color-border)}
        .feature-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:1rem;background:var(--color-primary-subtle);color:var(--color-primary)}
        .feature-card h3{font-size:1.125rem;font-weight:600;color:var(--color-ink);margin-bottom:0.5rem}
        .feature-card p{font-size:0.875rem;color:var(--color-ink-secondary);line-height:1.6}
        .testimonials-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.5rem}
        .testimonial-card{padding:1.5rem;border-radius:var(--radius-lg);background:var(--color-elevated);border:1px solid var(--color-border)}
        .testimonial-img{width:44px;height:44px;border-radius:50%;object-fit:cover;margin-bottom:1rem}
        .testimonial-quote{font-size:0.9375rem;color:var(--color-ink-secondary);lineHeight:1.6,marginBottom:1rem}
        .cta-banner{max-width:640px;margin:0 auto;padding:3rem 1.5rem;border-radius:var(--radius-xl);background:linear-gradient(135deg,var(--color-primary),var(--color-violet));text-align:center}
        @media(max-width:960px){.steps-grid,.features-grid,.testimonials-grid{grid-template-columns:1fr}.landing-stats{grid-template-columns:repeat(2,1fr)}}
      `}</style>
    </Layout>
  );
}
