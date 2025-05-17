import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Subscription.css';

// Get API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Subscription plans
const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    features: [
      'Basic AI guidance',
      'Text-based interface',
      'Normal response speed',
      'Limited conversation memory'
    ],
    cta: 'Current Plan'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    period: 'month',
    features: [
      'Enhanced AI guidance',
      'Voice interface',
      'Faster responses',
      'Extended conversation memory',
      'Analytics dashboard',
      'Priority support'
    ],
    cta: 'Upgrade Now'
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 19.99,
    period: 'month',
    features: [
      'Advanced AI guidance',
      'Voice interface with custom tones',
      'Highest priority responses',
      'Unlimited conversation memory',
      'Detailed analytics',
      'Premium support',
      'Custom integrations',
      'Team collaboration'
    ],
    cta: 'Go Pro'
  }
];

const Subscription = ({ onComplete, userEmail }) => {
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [currentPlan, setCurrentPlan] = useState('free');
  
  // Check current subscription status on component mount
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        
        const res = await axios.get(`${API_URL}/subscription/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.valid && res.data.plan) {
          setCurrentPlan(res.data.plan);
          setSelectedPlan(res.data.plan);
        }
      } catch (err) {
        console.error('Error checking subscription:', err);
      }
    };
    
    checkSubscription();
  }, []);
  
  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
  };
  
  const handleSubmit = async () => {
    // If selecting the same plan, just complete
    if (selectedPlan === currentPlan) {
      onComplete();
      return;
    }
    
    // Free plan doesn't need payment processing
    if (selectedPlan === 'free') {
      // In a real app, you might cancel existing subscription here
      onComplete();
      return;
    }
    
    setError('');
    setIsProcessing(true);
    
    try {
      const token = localStorage.getItem('authToken');
      
      // Create checkout session
      const res = await axios.post(
        `${API_URL}/subscription/create-checkout`,
        {
          plan_id: selectedPlan,
          email: userEmail
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );
      
      if (res.data.success && res.data.checkout_url) {
        // For Stripe checkout, redirect to the provided URL
        window.location.href = res.data.checkout_url;
      } else {
        // For successful free plan selection or handled payment
        onComplete();
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setError(
        err.response?.data?.detail || 
        'Unable to process subscription. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="subscription-container">
      <h2>Choose Your Plan</h2>
      <p className="subscription-intro">
        Unlock the full potential of Virgil with our premium features
      </p>
      
      {error && <div className="subscription-error">{error}</div>}
      
      <div className="plan-options">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''}`}
            onClick={() => handleSelectPlan(plan.id)}
          >
            <div className="plan-selected-indicator">Selected</div>
            
            <div className="plan-header">
              <h3>{plan.name}</h3>
              <div className="plan-price">
                ${plan.price}
                <span className="plan-period">/{plan.period}</span>
              </div>
            </div>
            
            <ul className="plan-features">
              {plan.features.map((feature, index) => (
                <li key={index}>
                  <span className="check-icon">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            
            <div className="plan-cta">
              {currentPlan === plan.id ? 'Current Plan' : plan.cta}
            </div>
          </div>
        ))}
      </div>
      
      <div className="subscription-controls">
        <button 
          className="subscription-button"
          onClick={handleSubmit}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Continue with Selected Plan'}
        </button>
      </div>
    </div>
  );
};

export default Subscription; 