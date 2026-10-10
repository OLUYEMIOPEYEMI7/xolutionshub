// Service catalog — mirrors the live XOLUTIONS HUB site exactly (kept as-is per owner's instruction).
module.exports = {
  categories: [
    {
      key: 'foundation',
      name: 'Project Foundation',
      note: 'Choose only what you need.',
      items: [
        {
          key: 'topic-proposal',
          name: 'Topic Development + Proposal Guidance',
          description: 'Research direction, topic refinement and proposal guidance.',
          price: 25000,
          eta: '3–5 days'
        }
      ]
    },
    {
      key: 'chapters',
      name: 'Chapter Support',
      note: 'Choose only what you need.',
      items: [
        {
          key: 'chapters-1-3',
          name: 'Chapters 1–3 Research Support',
          description: 'Structured support for introduction, literature review and methodology.',
          price: 50000,
          eta: '5–8 days'
        },
        {
          key: 'chapters-4-5',
          name: 'Chapters 4–5 Research Support',
          description: 'Support for results/discussion and summary, conclusion and recommendations.',
          price: 40000,
          eta: '4–7 days'
        }
      ]
    },
    {
      key: 'instruments',
      name: 'Research Instruments',
      note: 'Choose only what you need.',
      items: [
        {
          key: 'questionnaire',
          name: 'Questionnaire Development',
          description: 'Research questionnaire development aligned with study objectives.',
          price: 10000,
          eta: '1–3 days'
        }
      ]
    },
    {
      key: 'data',
      name: 'Data & Analysis',
      note: 'Choose only what you need.',
      items: [
        {
          key: 'data-analysis',
          name: 'Data Analysis & Interpretation',
          description: 'Analysis and interpretation support using your supplied dataset.',
          price: 40000,
          eta: '3–6 days',
          requires: 'data-collected',
          requiresNote: 'You should have collected data before analysis.'
        },
        {
          key: 'data-cleaning',
          name: 'Data Cleaning',
          description: 'Cleaning, checking and preparing a supplied dataset.',
          price: 15000,
          eta: '1–3 days'
        }
      ]
    },
    {
      key: 'finalization',
      name: 'Finalization',
      note: 'Choose only what you need.',
      items: [
        {
          key: 'referencing',
          name: 'Referencing & Citation Formatting',
          description: 'Reference-list and citation formatting to the required style.',
          price: 10000,
          eta: '1–2 days'
        },
        {
          key: 'formatting',
          name: 'Complete Project Formatting',
          description: 'Institution-aware document formatting and presentation cleanup.',
          price: 15000,
          eta: '1–3 days'
        },
        {
          key: 'proofreading',
          name: 'Proofreading & Academic Editing',
          description: 'Clarity, grammar, consistency and presentation editing.',
          price: 15000,
          eta: '2–4 days'
        }
      ]
    },
    {
      key: 'presentation',
      name: 'Presentation',
      note: 'Choose only what you need.',
      items: [
        {
          key: 'powerpoint',
          name: 'Project PowerPoint',
          description: 'Structured project presentation slides based on approved work.',
          price: 15000,
          eta: '1–3 days'
        },
        {
          key: 'defense-prep',
          name: 'Defense Preparation',
          description: 'Defense preparation, presentation coaching and question practice.',
          price: 20000,
          eta: '2–3 days'
        }
      ]
    },
    {
      key: 'packages',
      name: 'Packages',
      note: 'Choose only what you need.',
      items: [
        {
          key: 'full-package',
          name: 'Full Project Research Support',
          description: 'Coordinated project-support package covering major research stages.',
          price: 150000,
          eta: 'Subject to scope',
          subjectToScope: true
        }
      ]
    }
  ],
  deliverySpeeds: [
    { key: 'normal', name: 'Normal', extra: 0, note: 'Standard turnaround' },
    { key: 'priority', name: 'Priority', extra: 15000, note: 'Faster handling' },
    { key: 'urgent', name: 'Urgent', extra: 25000, note: 'Short deadline; subject to confirmation' }
  ],

  allItemsFlat() {
    const flat = [];
    this.categories.forEach(cat => cat.items.forEach(item => flat.push({ ...item, category: cat.key, categoryName: cat.name })));
    return flat;
  },
  findItem(key) {
    return this.allItemsFlat().find(i => i.key === key);
  },
  findDeliverySpeed(key) {
    return this.deliverySpeeds.find(d => d.key === key) || this.deliverySpeeds[0];
  }
};
