import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Phone, ArrowRight } from 'lucide-react';

interface LeadFormProps {
  onSubmit: (data: { name: string; email: string; phone: string }) => void;
}

export default function LeadForm({ onSubmit }: LeadFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email) {
      onSubmit({ name, email, phone });
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
            className="w-full px-4 py-3 bg-gray-50 rounded border border-navy/20 focus:ring-1 focus:ring-gold focus:border-gold outline-none transition-all text-navy placeholder:text-gray-400"
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 rounded border border-navy/20 focus:ring-1 focus:ring-gold focus:border-gold outline-none transition-all text-navy placeholder:text-gray-400"
            placeholder="jane@example.com"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-navy flex items-center gap-2 uppercase tracking-wide">
            <Phone className="w-4 h-4 text-gold" /> Phone (Optional)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 rounded border border-navy/20 focus:ring-1 focus:ring-gold focus:border-gold outline-none transition-all text-navy placeholder:text-gray-400"
            placeholder="(555) 123-4567"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-navy hover:bg-navy/90 text-white font-bold py-4 rounded transition-colors flex items-center justify-center gap-2 shadow-lg mt-2"
        >
          Start Staging <ArrowRight className="w-5 h-5" />
        </button>
      </form>
    </motion.div>
  );
}