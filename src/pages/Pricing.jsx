import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../layouts/LandingLayout';
import { Check, Sparkles, Shield, Zap, Crown, Heart, ArrowRight } from 'lucide-react';

const PLANS = [
  {
    id: 'free',
    name: 'Starter',
    tagline: 'For exploring',
    price: '$0',
    period: 'forever',
    icon: Heart,
    color: 'from-slate-400 to-gray-500',
    features: [
      { text: 'Create & publish your profile', included: true },
      { text: 'Browse & search all profiles', included: true },
      { text: 'Express interest (3 / day)', included: true },
      { text: 'Basic compatibility score', included: true },
      { text: 'Guardian / Wali tools', included: true },
      { text: 'Community forum access', included: true },
      { text: 'Unlimited messaging', included: false },
      { text: 'Advanced search filters', included: false },
      { text: 'Incognito / discreet browsing', included: false },
      { text: 'Verified ID badge', included: false },
      { text: 'Priority profile placement', included: false },
    ],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'Serious about marriage',
    price: '$19',
    period: '/ month',
    icon: Sparkles,
    color: 'from-rose-400 to-pink-500',
    features: [
      { text: 'Everything in Starter', included: true },
      { text: 'Unlimited messaging', included: true },
      { text: 'Advanced search filters', included: true },
      { text: 'Incognito / discreet browsing', included: true },
      { text: 'Express interest (unlimited)', included: true },
      { text: 'Detailed compatibility breakdown', included: true },
      { text: 'See who viewed your profile', included: true },
      { text: 'Verified ID badge', included: true },
      { text: 'Priority profile placement', included: true },
      { text: 'AI matchmaking agents', included: true },
      { text: 'Priority support', included: true },
    ],
    cta: 'Start 7-Day Free Trial',
    popular: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    tagline: 'For families & community leaders',
    price: '$49',
    period: '/ month',
    icon: Crown,
    color: 'from-amber-400 to-orange-500',
    features: [
      { text: 'Everything in Premium', included: true },
      { text: 'Up to 3 family profiles', included: true },
      { text: 'Family dashboard & analytics', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'White-glove profile writing', included: true },
      { text: 'Background check integration', included: true },
      { text: 'Custom matching criteria', included: true },
      { text: 'Bulk outreach tools', included: true },
      { text: 'Community onboarding support', included: true },
      { text: 'Quarterly matchmaking reports', included: true },
      { text: 'Concierge introduction service', included: true },
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const FAQS = [
  { q: 'Is there really a free plan?', a: 'Yes. Starter is free forever — no credit card needed. Create a profile, browse matches, express interest, and access community tools at no cost.' },
  { q: 'Can I switch plans anytime?', a: 'Absolutely. Upgrade, downgrade, or cancel anytime. When upgrading, you get immediate access to new features. Downgrades take effect at the next billing cycle.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit cards (Visa, Mastercard, Amex), debit cards, and PayPal. All transactions are encrypted and secure.' },
  { q: 'Is my billing information private?', a: 'Your billing details are never visible to other members. Invoices simply say "Shiarishta" — no mention of matchmaking or matrimony.' },
  { q: 'Do you offer refunds?', a: 'We offer a 7-day money-back guarantee on all paid plans. If you\'re not satisfied, contact support for a full refund — no questions asked.' },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  const getPrice = (plan) => {
    if (plan.id === 'free') return '$0';
    const num = parseInt(plan.price.replace('$', ''));
    if (annual) return `$${Math.round(num * 0.7)}`;
    return plan.price;
  };

  const getPeriod = (plan) => {
    if (plan.id === 'free') return 'forever';
    return annual ? '/ month (billed annually)' : plan.period;
  };

  return (
    <Layout>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Simple, transparent pricing</span>
          <h1 className="text-3xl sm:text-5xl font-bold text-ink mt-2">Invest in your future</h1>
          <p className="text-muted mt-3 max-w-xl mx-auto">Start free, upgrade when you're serious. Every paid plan includes a 7-day free trial and discreet billing.</p>

          {/* Annual toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <span className={`text-sm font-medium ${!annual ? 'text-ink' : 'text-muted'}`}>Monthly</span>
            <button onClick={() => setAnnual(!annual)} className={`relative w-12 h-6 rounded-full transition-colors ${annual ? 'bg-primary' : 'bg-line/40'}`}>
              <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform" style={{ transform: annual ? 'translateX(1.5rem)' : 'translateX(0)' }} />
            </button>
            <span className={`text-sm font-medium ${annual ? 'text-ink' : 'text-muted'}`}>
              Annual <span className="text-success text-xs font-bold ml-1">Save 30%</span>
            </span>
          </div>
        </motion.div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan, i) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`relative bg-elevated rounded-2xl border ${plan.popular ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-line/20'} p-6 sm:p-8 flex flex-col`}>
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold bg-primary text-white px-3 py-1 rounded-full">Most Popular</span>
              )}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-white mb-4`}>
                <plan.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-ink">{plan.name}</h3>
              <p className="text-sm text-muted mb-4">{plan.tagline}</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold text-ink">{getPrice(plan)}</span>
                <span className="text-sm text-muted ml-1">{getPeriod(plan)}</span>
              </div>
              <Link to={plan.id === 'elite' ? '/contact' : '/auth/register'}
                className={`w-full button py-3 font-semibold text-center mb-6 ${plan.popular ? 'primary' : 'secondary'}`}>
                {plan.cta} <ArrowRight className="w-4 h-4 inline ml-1" />
              </Link>
              <ul className="space-y-3 flex-1">
                {plan.features.map(f => (
                  <li key={f.text} className="flex items-start gap-2.5 text-sm">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${f.included ? 'text-success' : 'text-line/40'}`} />
                    <span className={f.included ? 'text-ink' : 'text-muted'}>{f.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Trust signals */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { icon: Shield, label: 'Discreet billing', desc: '"Shiarishta" on all invoices' },
            { icon: Zap, label: '7-day free trial', desc: 'Try Premium, no card required' },
            { icon: Sparkles, label: 'Cancel anytime', desc: 'No lock-in contracts' },
            { icon: Heart, label: 'Money-back guarantee', desc: '7 days, no questions asked' },
          ].map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
              className="text-center p-5 rounded-2xl bg-elevated border border-line/20">
              <item.icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <h4 className="font-bold text-ink text-sm">{item.label}</h4>
              <p className="text-xs text-muted mt-0.5">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-ink text-center mb-8">Pricing FAQ</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-elevated rounded-xl border border-line/20 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? -1 : i)} className="w-full flex items-center justify-between p-5 text-left">
                  <span className="font-medium text-ink text-sm pr-4">{faq.q}</span>
                  <span className="text-muted flex-shrink-0">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && <div className="px-5 pb-5 text-sm text-muted leading-relaxed border-t border-line/10 pt-4">{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </main>
    </Layout>
  );
}
