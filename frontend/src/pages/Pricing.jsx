import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentModal from '../components/PaymentModal';

const plans = [
  { id: 'free', name: 'Free', price: 0, period: 'one-time', features: ['Basic access to tools', '3 trials', 'Community support'] },
  { id: 'weekly', name: 'Weekly', price: 9, original: 15, period: '7 days', features: ['Full tool access', 'Unlimited generations', 'Standard speed'] },
  { id: 'super', name: 'Super', price: 39, original: 59, period: '1 month', features: ['Unlimited generations', 'Priority processing', 'Faster outputs', 'HD quality'], popular: true },
  { id: 'pro', name: 'Pro', price: 69, original: 99, period: '6 months', features: ['Unlimited generations', 'Fast & HD quality', 'Priority queue', 'Beta access'] },
  { id: 'pro_plus', name: 'Pro+', price: 99, original: 149, period: '1 year', features: ['Everything in Pro', 'Early feature access', 'Dedicated support', 'Private roadmap calls'] }
];

const Pricing = () => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [mountAnimated, setMountAnimated] = useState(false);
  const [staggerDone, setStaggerDone] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMountAnimated(true));
    // After the initial entrance completes, clear transition delays
    const clear = setTimeout(() => setStaggerDone(true), 1200);
    return () => {
      cancelAnimationFrame(t);
      clearTimeout(clear);
    };
  }, []);

  const handleSelect = (plan) => {
    if (plan.id === 'free') {
      navigate('/');
      return;
    }
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setModalOpen(false);
    window.dispatchEvent(new Event('authChange'));
  };

  return (
    <main className="pricing" aria-labelledby="pricingTitle">
      <header className="pricing__head-row">
        <button className="pricing__back pricing__back--lg" onClick={() => navigate(-1)} aria-label="Go back">← Back</button>
        <h1 id="pricingTitle" className="pricing__title">Multi pricing.io</h1>
        <span className="pricing__head-spacer" />
      </header>
      <p className="pricing__tagline">Unlock the full power of multi-tool.io — pick the plan that matches your workflow and upgrade anytime.</p>

      <div className="pricing__grid">
        {plans.map((plan, idx) => {
          const highlight = plan.popular;
          return (
            <article
              key={plan.id}
              className={`pricing-card ${highlight ? 'pricing-card--highlight' : ''} ${mountAnimated ? 'pricing-card--in' : ''}`}
              style={{ transitionDelay: mountAnimated && !staggerDone ? `${idx * 70}ms` : '0ms' }}
              aria-label={`${plan.name} plan`}
            >
              {highlight && <div className="pricing-card__badge" aria-label="Most popular plan">Popular</div>}
              <header className="pricing-card__head">
                <h2 className="pricing-card__title">{plan.name}</h2>
                <p className="pricing-card__period">{plan.period}</p>
              </header>
              <div className="pricing-card__price-wrap">
                <span className="pricing-card__currency">₹</span>
                <span className="pricing-card__amount">{plan.price}</span>
                {plan.original && <span className="pricing-card__original">₹{plan.original}</span>}
              </div>
              <ul className="pricing-card__features" aria-label="Features">
                {plan.features.map((f, i) => (
                  <li key={i} className="pricing-card__feature">{f}</li>
                ))}
              </ul>
              <button
                className={`pricing-card__cta slash-btn ${plan.id === 'free' ? 'slash-btn--outline' : ''}`}
                onClick={() => handleSelect(plan)}
              >
                <span className="slash-btn__content">{plan.id === 'free' ? 'Get Started' : 'Choose Plan'}</span>
                <span className="slash-btn__slash" aria-hidden="true" />
                
              </button>
            </article>
          );
        })}
      </div>

      <PaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedPlan={selectedPlan}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </main>
  );
};

export default Pricing;