'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react'

interface FAQ {
  question: string
  answer: string
}

export function FaqAccordion({ faqs }: { faqs: FAQ[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (!faqs || faqs.length === 0) return null

  return (
    <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center gap-2.5 mb-5">
        <HelpCircle className="w-4 h-4 text-ink-400" />
        <h2 className="font-semibold text-ink text-base">Frequently asked questions</h2>
      </div>

      <div className="divide-y divide-ink-50">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i
          return (
            <div key={i}>
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 py-4 text-left group"
              >
                <span className={`text-sm font-medium leading-snug transition-colors ${isOpen ? 'text-ink' : 'text-ink-600 group-hover:text-ink'}`}>
                  {faq.question}
                </span>
                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-ink text-white' : 'bg-ink-50 text-ink-400 group-hover:bg-ink-100'}`}>
                  {isOpen
                    ? <ChevronUp className="w-3.5 h-3.5" />
                    : <ChevronDown className="w-3.5 h-3.5" />
                  }
                </span>
              </button>

              {isOpen && (
                <div className="pb-4 -mt-1">
                  <p className="text-sm text-ink-500 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
