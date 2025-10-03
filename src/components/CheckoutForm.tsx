import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';

interface CheckoutFormProps {
  amount: number;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ 
  amount, 
  onSuccess, 
  onError, 
  customerInfo 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Card element not found');
      setIsProcessing(false);
      return;
    }

    try {
      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
        },
      });

      if (pmError) {
        setError(pmError.message || 'Payment failed');
        setIsProcessing(false);
        return;
      }

      // In a real app, you would send the payment method to your backend
      // For demo purposes, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate different outcomes based on card number
      const cardNumber = paymentMethod.card?.last4;
      if (cardNumber === '4242') {
        onSuccess({
          id: 'pi_demo_' + Date.now(),
          amount: amount,
          status: 'succeeded'
        });
      } else if (cardNumber === '0002') {
        setError('Your card was declined. Please try a different card.');
        return;
      } else {
        onSuccess({
          id: 'pi_demo_' + Date.now(),
          amount: amount,
          status: 'succeeded'
        });
      }

    } catch (err) {
      setError('An unexpected error occurred');
      onError('Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Creepster, cursive',
        '::placeholder': {
          color: '#666666',
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
      },
      invalid: {
        color: '#ff0000',
        iconColor: '#ff0000',
      },
    },
    hidePostalCode: true,
  };

  return (
    <motion.form 
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">Card Information</label>
        <div 
          style={{ 
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.8)',
            border: '2px solid #ff0000',
            borderRadius: '8px',
            marginTop: '0.5rem'
          }}
        >
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {error && (
        <motion.div
          className="message error"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="btn"
        style={{ width: '100%' }}
      >
        {isProcessing ? (
          <>
            <span className="loading"></span> Processing Payment...
          </>
        ) : (
          <>
            💀 PAY ${amount} 💀
          </>
        )}
      </button>
    </motion.form>
  );
};

export default CheckoutForm;
