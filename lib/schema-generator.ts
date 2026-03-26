export interface SchemaData {
  title: string;
  description: string;
  url?: string;
  datePublished?: string;
  dateModified?: string;
  author?: string;
  imageUrl?: string;
  faqs?: Array<{ q: string; a: string }>;
  keywords?: string[];
  contentType?: string;
}

export function generateArticleSchema(data: SchemaData): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.title,
    description: data.description,
    image: data.imageUrl || 'https://genrage.com/logo.png',
    datePublished: data.datePublished || new Date().toISOString(),
    dateModified: data.dateModified || new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: 'GENRAGE'
    },
    publisher: {
      '@type': 'Organization',
      name: 'GENRAGE',
      logo: {
        '@type': 'ImageObject',
        url: 'https://genrage.com/logo.png',
        width: 200,
        height: 60
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': data.url || 'https://genrage.com'
    }
  };
}

export function generateFAQPageSchema(
  faqs: Array<{ q: string; a: string }>
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a
      }
    }))
  };
}

export function generateBlogPostingSchema(data: SchemaData): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: data.title,
    description: data.description,
    image: data.imageUrl || 'https://genrage.com/logo.png',
    datePublished: data.datePublished || new Date().toISOString(),
    dateModified: data.dateModified || new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: data.author || 'GENRAGE'
    },
    publisher: {
      '@type': 'Organization',
      name: 'GENRAGE',
      logo: {
        '@type': 'ImageObject',
        url: 'https://genrage.com/logo.png'
      }
    }
  };
}

export function generateOrganizationSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'GENRAGE',
    url: 'https://genrage.com',
    logo: 'https://genrage.com/logo.png',
    description: "India's leading D2C streetwear brand",
    sameAs: [
      'https://instagram.com/genrage',
      'https://twitter.com/genrage',
      'https://tiktok.com/@genrage'
    ],
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN'
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      url: 'https://genrage.com/contact'
    }
  };
}

export function generateProductSchema(data: {
  name: string;
  description: string;
  price?: string;
  priceCurrency?: string;
  image?: string;
  brand?: string;
  availability?: string;
  rating?: { ratingValue: number; reviewCount: number };
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    description: data.description,
    brand: {
      '@type': 'Brand',
      name: data.brand || 'GENRAGE'
    },
    image: data.image || 'https://genrage.com/logo.png',
    offers: {
      '@type': 'Offer',
      price: data.price || '0',
      priceCurrency: data.priceCurrency || 'INR',
      availability: data.availability || 'InStock',
      url: 'https://genrage.com'
    },
    ...(data.rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: data.rating.ratingValue,
        reviewCount: data.rating.reviewCount
      }
    })
  };
}

export function generateHowToSchema(data: {
  title: string;
  description: string;
  steps: Array<{ text: string; image?: string }>;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: data.title,
    description: data.description,
    step: data.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.text,
      ...(step.image && {
        image: step.image
      })
    }))
  };
}

export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function combineSchemas(schemas: object[]): object {
  return {
    '@context': 'https://schema.org',
    '@graph': schemas
  };
}

export function injectSchemaMarkup(html: string, schema: object): string {
  const schemaTag = `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
  return `${html}\n${schemaTag}`;
}

export function generateSchemaFromContent(
  contentType: string,
  title: string,
  description: string,
  url: string,
  faqs?: Array<{ q: string; a: string }>,
  datePublished?: string
): object[] {
  const schemas: object[] = [];

  // Main schema based on content type
  switch (contentType) {
    case 'blog_post':
      schemas.push(
        generateBlogPostingSchema({
          title,
          description,
          url,
          datePublished: datePublished || new Date().toISOString()
        })
      );
      break;
    case 'guide':
      schemas.push(
        generateArticleSchema({
          title,
          description,
          url,
          datePublished: datePublished || new Date().toISOString()
        })
      );
      break;
    case 'product_page':
      schemas.push(
        generateProductSchema({
          name: title,
          description,
          brand: 'GENRAGE'
        })
      );
      break;
    default:
      schemas.push(
        generateArticleSchema({
          title,
          description,
          url,
          datePublished: datePublished || new Date().toISOString()
        })
      );
  }

  // Add FAQ schema if faqs exist
  if (faqs && faqs.length > 0) {
    schemas.push(generateFAQPageSchema(faqs));
  }

  // Always add organization schema
  schemas.push(generateOrganizationSchema());

  return schemas;
}

export function createSchemaMarkupFromData(
  contentType: string,
  data: SchemaData
): string {
  const schemas = generateSchemaFromContent(
    contentType,
    data.title,
    data.description,
    data.url || '',
    data.faqs,
    data.datePublished
  );

  const combined =
    schemas.length > 1
      ? combineSchemas(schemas)
      : schemas.length === 1
        ? schemas[0]
        : {};

  return `<script type="application/ld+json">${JSON.stringify(combined)}</script>`;
}

export function validateSchema(schema: any): boolean {
  if (!schema['@context']) {
    console.warn('Schema missing @context');
    return false;
  }
  if (!schema['@type']) {
    console.warn('Schema missing @type');
    return false;
  }
  return true;
}
