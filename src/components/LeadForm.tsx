import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Phone, ArrowRight, Loader2 } from 'lucide-react';

interface LeadFormProps {
  onSubmit: (data: { name: string; email: string; phone: string }) => void;
}

export default function LeadForm({ onSubmit }: LeadFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  
  // New state variables for handling the API request
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const EMAIL_DOMAINS = ['@gmail.com', '@hotmail.com', '@yahoo.com', '@outlook.com', '@icloud.com'];

  const validateEmail = (value: string) => {
    if (!value) return '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? '' : 'Please enter a valid email address.';
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError('');

    // Show domain suggestions when user types a name but no '@' yet, or partial domain
    if (value && !value.includes('@')) {
      setEmailSuggestions(EMAIL_DOMAINS.map(d => value + d));
    } else if (value && value.includes('@') && !value.includes('.')) {
      const localPart = value.split('@')[0];
      setEmailSuggestions(EMAIL_DOMAINS.map(d => localPart + d));
    } else {
      setEmailSuggestions([]);
    }
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setPhone(formatted);
    setPhoneError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailErr = validateEmail(email);
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }

    const digits = phone.replace(/\D/g, '');
    if (digits.length > 0 && digits.length !== 10) {
      setPhoneError('Please Enter Valid Phone Number');
      return;
    }

    if (name && email) {
      setIsSubmitting(true);
      setErrorMsg('');
      setEmailSuggestions([]);

      try {
        // Send the data to your Express backend
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, phone }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Success! Pass the data to the parent component to unlock the app
          onSubmit({ name, email, phone });
        } else {
          // Backend returned an error (e.g., missing fields)
          setErrorMsg(data.error || 'Failed to save information. Please try again.');
          setIsSubmitting(false); // Turn off loading state so they can try again
        }
      } catch (error) {
        console.error('Failed to submit lead:', error);
        setErrorMsg('Network error. Please make sure the server is running.');
        setIsSubmitting(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto bg-white p-8 rounded shadow-xl border border-navy/10"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-inter font-bold text-navy mb-2">Welcome</h2>
        <p className="text-navy/70">Sign in to unlock the Virtual Staging Storyteller.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-navy flex items-center gap-2 uppercase tracking-wide">
            <User className="w-4 h-4 text-gold" /> Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-4 py-3 bg-gray-50 rounded border border-navy/20 focus:ring-1 focus:ring-gold focus:border-gold outline-none transition-all text-navy placeholder:text-gray-400 disabled:opacity-50"
            placeholder="Jane Doe"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-navy flex items-center gap-2 uppercase tracking-wide">
            <Mail className="w-4 h-4 text-gold" /> Email
          </label>
          <input
            type="email"
            required
            list="email-suggestions"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            onBlur={() => { setEmailError(validateEmail(email)); setEmailSuggestions([]); }}
            disabled={isSubmitting}
            className={`w-full px-4 py-3 bg-gray-50 rounded border ${emailError ? 'border-red-400' : 'border-navy/20'} focus:ring-1 focus:ring-gold focus:border-gold outline-none transition-all text-navy placeholder:text-gray-400 disabled:opacity-50`}
            placeholder="jane@example.com"
          />
          <datalist id="email-suggestions">
            {emailSuggestions.map((s) => <option key={s} value={s} />)}
          </datalist>
          {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-navy flex items-center gap-2 uppercase tracking-wide">
            <Phone className="w-4 h-4 text-gold" /> Phone (Optional)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            disabled={isSubmitting}
            className={`w-full px-4 py-3 bg-gray-50 rounded border ${phoneError ? 'border-red-400' : 'border-navy/20'} focus:ring-1 focus:ring-gold focus:border-gold outline-none transition-all text-navy placeholder:text-gray-400 disabled:opacity-50`}
            placeholder="555-123-4567"
          />
          {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
        </div>

        {/* Display Error Message if the API fails */}
        {errorMsg && (
          <div className="text-red-500 text-sm font-semibold text-center mt-2">
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-navy hover:bg-navy/90 text-white font-bold py-4 rounded transition-colors flex items-center justify-center gap-2 shadow-lg mt-2 disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Saving...
            </>
          ) : (
            <>
              Start Staging <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}