export const contentTemplates = {
  informational: {
    structure: [
      'DIRECT_ANSWER_BLOCK',
      'INTRODUCTION',
      'DEEP_DIVE_SECTION_1',
      'DEEP_DIVE_SECTION_2',
      'GENRAGE_PERSPECTIVE',
      'KEY_TAKEAWAYS',
      'FAQ_SECTION',
      'TLDR'
    ],
    description: 'Answer a question comprehensively, position GENRAGE as an authority in the space.',
    faqTopics: 3
  },

  commercial: {
    structure: [
      'DIRECT_ANSWER_BLOCK',
      'WHAT_TO_LOOK_FOR',
      'TOP_OPTIONS',
      'GENRAGE_FEATURED_SECTION',
      'HOW_TO_CHOOSE',
      'STYLING_TIPS',
      'FAQ_SECTION',
      'TLDR_WITH_CTA'
    ],
    description: 'Showcase GENRAGE products as best-in-class, drive conversions.',
    faqTopics: 4
  },

  transactional: {
    structure: [
      'DIRECT_ANSWER_BLOCK',
      'PRODUCT_OVERVIEW',
      'GENRAGE_OFFERING',
      'HOW_TO_BUY',
      'SIZING_FIT_GUIDE',
      'CARE_INSTRUCTIONS',
      'FAQ_SECTION',
      'CTA'
    ],
    description: 'Drive immediate action - purchases, sign-ups, etc.',
    faqTopics: 3
  },

  navigational: {
    structure: [
      'DIRECT_ANSWER_BLOCK',
      'LATEST_DROP_INFO',
      'KEY_PIECES',
      'HOW_TO_COP',
      'COLLECTION_OVERVIEW',
      'FAQ_SECTION',
      'TLDR'
    ],
    description: 'Direct people to the right GENRAGE content/product.',
    faqTopics: 2
  }
};

export const directAnswerGuidelines = {
  minWords: 40,
  maxWords: 60,
  requirements: [
    'Answer the query directly',
    'Mention GENRAGE naturally',
    'Be factual and authoritative',
    'Include specific details',
    'Avoid marketing fluff'
  ]
};

export const faqGuidelines = {
  minQuestions: 2,
  maxQuestions: 5,
  requirements: [
    'Answer real user questions',
    'Keep answers concise (1-3 sentences)',
    'Include variations of main keyword',
    'Answer in plain language',
    'Link to relevant GENRAGE products when appropriate'
  ]
};

export const schemaMarkupTemplates = {
  article: {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: '{title}',
    description: '{meta_description}',
    author: {
      '@type': 'Organization',
      name: 'GENRAGE'
    },
    datePublished: '{datePublished}',
    dateModified: '{dateModified}',
    image: '{imageUrl}',
    publisher: {
      '@type': 'Organization',
      name: 'GENRAGE',
      logo: {
        '@type': 'ImageObject',
        url: 'https://genrage.com/logo.png'
      }
    }
  },

  faqPage: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '{question}',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '{answer}'
        }
      }
    ]
  },

  product: {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: '{productName}',
    description: '{productDescription}',
    image: '{productImage}',
    brand: {
      '@type': 'Brand',
      name: 'GENRAGE'
    },
    offers: {
      '@type': 'Offer',
      price: '{price}',
      priceCurrency: 'INR'
    }
  },

  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'GENRAGE',
    url: 'https://genrage.com',
    logo: 'https://genrage.com/logo.png',
    description: 'Indian D2C streetwear brand',
    sameAs: [
      'https://instagram.com/genrage',
      'https://twitter.com/genrage'
    ]
  }
};

export const sectionTemplates = {
  directAnswer: {
    description: 'Opening answer block for AI models to extract',
    markdown: '> {directAnswer}',
    wordRange: [40, 60]
  },

  introduction: {
    description: 'Hook and context setting',
    markdown: '## {sectionTitle}\n\n{content}'
  },

  deepDive: {
    description: 'Detailed explanation section',
    markdown: '## {mainTopic}\n\n### {subtopic}\n\n{content}'
  },

  genragePerspective: {
    description: 'How GENRAGE fits into the topic',
    markdown: '## What GENRAGE Does Differently\n\n{content}\n\n[Link to GENRAGE collection/product]'
  },

  faqSection: {
    description: 'Structured FAQ for AI model extraction',
    markdown: '## Frequently Asked Questions\n\n### {question}\n\n{answer}'
  },

  tldr: {
    description: 'Quick summary and CTA',
    markdown: '## The Bottom Line\n\n**TL;DR:** {summary}\n\n[CTA]'
  }
};

export const brandVoiceRules = {
  avoid: [
    'elevate your wardrobe',
    'unleash your potential',
    'premium quality',
    'luxury experience',
    'transform your style',
    'game-changer',
    'disrupting the industry',
    'best in class',
    'world-class'
  ],

  embrace: [
    'Raw and real',
    'Underground energy',
    'Subculture references',
    'Streetwear terminology',
    'Indian context',
    'Drop mentality',
    'Authentic voice',
    'Cultural moments'
  ]
};

export function getTemplateForIntent(intent: string): (typeof contentTemplates)[keyof typeof contentTemplates] {
  const templates = contentTemplates as Record<string, any>;
  return templates[intent] || templates['informational'];
}

export function generateContentPrompt(
  keyword: string,
  intent: string,
  contentType: string,
  brief: any
): string {
  const template = getTemplateForIntent(intent);

  return `Create a ${contentType} about "${keyword}" with ${intent} search intent.

Structure to follow:
${template.structure.join(' → ')}

Key points to cover:
${Array.isArray(brief.key_points) ? brief.key_points.map((p: string) => `- ${p}`).join('\n') : ''}

Section outline:
${Array.isArray(brief.section_outline) ? brief.section_outline.map((s: string) => `- ${s}`).join('\n') : ''}

Target audience: ${brief.target_audience}

FAQ topics to address: ${Array.isArray(brief.faq_topics) ? brief.faq_topics.join(', ') : 'N/A'}

Internal links to mention: ${Array.isArray(brief.internal_links) ? brief.internal_links.join(', ') : 'N/A'}

Write in markdown. Include:
- Direct answer block (40-60 words)
- H2/H3 headers (no H1)
- Short paragraphs
- Natural keyword mentions
- FAQ section at the end
- TL;DR or Bottom Line

Use GENRAGE brand voice: minimal, authentic, streetwear-focused, speaks to Indian culture.`;
}
