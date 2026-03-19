import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import clsx from 'clsx';

const faqs = [
  {
    id: 1,
    question: "Does AgriAssist support sustainable farming?",
    answer: "Yes, our tools are built to help optimize resource usage, reduce waste, and promote long-term soil health through precision diagnosis."
  },
  {
    id: 2,
    question: "Can I diagnose diseases in different crops?",
    answer: "Absolutely. AgriAssist supports a wide range of crops and can identify numerous diseases with high accuracy using AI image analysis."
  },
  {
    id: 3,
    question: "How do I get started with AgriAssist?",
    answer: "Getting started is easy. Simply sign up, add your farm details, and you can immediately start scanning crops or chatting with our AI assistant."
  },
  {
    id: 4,
    question: "Is AgriAssist easy to use for non-technical farmers?",
    answer: "Yes! We designed the interface to be intuitive and accessible, and our multilingual voice assistant makes it as easy as having a conversation."
  },
  {
    id: 5,
    question: "Can AgriAssist work offline?",
    answer: "Yes, AgriAssist is built with offline capabilities so you can access key features, your farm profile, and rate-limited features even with poor connectivity."
  }
];

const FAQ: React.FC = () => {
  const [openId, setOpenId] = useState<number | null>(2);

  return (
    <div className="w-full bg-white py-24">
      <div className="container mx-auto px-8 max-w-3xl">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-light-gray text-xs font-semibold text-gray-600 tracking-wide uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
            FAQ
          </div>
          
          <h2 className="text-4xl md:text-5xl font-medium text-dark-green mb-4 leading-tight">
             Common Farmer <span className="font-serif-italic">Questions</span>
          </h2>
          
          <p className="text-gray-500 text-sm">
            Got questions? We've got answers to help you get the most out of AgriAssist.
          </p>
        </div>

        {/* Accordion List */}
        <div className="flex flex-col gap-3 mb-10">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            
            return (
              <div 
                key={faq.id}
                className={clsx(
                  "border rounded-2xl overflow-hidden transition-all duration-300",
                  isOpen ? "border-brand-green/30 bg-gray-50" : "border-gray-100 hover:border-gray-300 bg-white"
                )}
              >
                <button 
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                >
                  <span className={clsx(
                    "font-medium text-[15px] sm:text-base",
                    isOpen ? "text-dark-green" : "text-gray-700"
                  )}>
                    {faq.question}
                  </span>
                  <div className={clsx(
                    "p-1.5 rounded-md transition-colors",
                    isOpen ? "bg-brand-green text-dark-green" : "text-gray-400 bg-gray-50"
                  )}>
                    {isOpen ? <Minus size={16} strokeWidth={3} /> : <Plus size={16} strokeWidth={3} />}
                  </div>
                </button>
                
                {/* Answer Content */}
                <div 
                  className={clsx(
                    "grid transition-all duration-300 ease-in-out",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 pt-2 text-gray-500 text-sm leading-relaxed border-t border-gray-100/50">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
            <button className="bg-dark-green hover:bg-black text-white px-6 py-3 rounded-full text-sm font-medium transition-colors">
              Still have question?
            </button>
        </div>

      </div>
    </div>
  );
};

export default FAQ;
