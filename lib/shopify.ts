const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-10';

interface ShopifyResponse<T> {
  data: T;
  errors?: any[];
}

async function shopifyFetch<T>(
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  const url = `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN || '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query,
      variables
    })
  });

  const data = await response.json();

  if (data.errors) {
    console.error('Shopify GraphQL error:', data.errors);
    throw new Error(`Shopify API error: ${JSON.stringify(data.errors)}`);
  }

  return data.data as T;
}

async function shopifyREST(
  method: string,
  endpoint: string,
  body?: any
): Promise<any> {
  const url = `https://${SHOPIFY_STORE}/admin/api/${SHOPIFY_API_VERSION}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN || '',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Shopify REST error:', data);
    throw new Error(`Shopify API error: ${response.statusText}`);
  }

  return data;
}

let cachedBlogId: string | null = null;

export async function getBlogId(): Promise<string> {
  if (cachedBlogId) return cachedBlogId;

  try {
    const query = `
      query {
        blogs(first: 10) {
          edges {
            node {
              id
              title
              handle
            }
          }
        }
      }
    `;

    const result = await shopifyFetch<{
      blogs: {
        edges: Array<{
          node: { id: string; title: string; handle: string };
        }>;
      };
    }>(query);

    // Look for "Journal" blog or create one
    const journalBlog = result.blogs.edges.find(
      (e) => e.node.handle === 'journal' || e.node.title === 'Journal'
    );

    if (journalBlog) {
      cachedBlogId = journalBlog.node.id;
      return cachedBlogId;
    }

    // Create blog if it doesn't exist
    const createQuery = `
      mutation CreateBlog($input: BlogInput!) {
        blogCreate(input: $input) {
          blog {
            id
            title
          }
        }
      }
    `;

    const createResult = await shopifyFetch<{
      blogCreate: { blog: { id: string } };
    }>(createQuery, {
      input: { title: 'Journal' }
    });

    cachedBlogId = createResult.blogCreate.blog.id;
    return cachedBlogId;
  } catch (error) {
    console.error('Error getting/creating blog:', error);
    throw error;
  }
}

export async function createBlogPost(params: {
  title: string;
  bodyHtml: string;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[];
}): Promise<{ articleId: string; handle: string; url: string }> {
  try {
    const blogId = await getBlogId();

    const mutation = `
      mutation CreateArticle($input: ArticleInput!) {
        articleCreate(input: $input) {
          article {
            id
            title
            handle
            url
            published
            publishedAt
            onlineStoreUrl
          }
        }
      }
    `;

    const seo = {
      title: params.metaTitle || params.title,
      description: params.metaDescription || ''
    };

    const result = await shopifyFetch<{
      articleCreate: {
        article: {
          id: string;
          title: string;
          handle: string;
          url: string;
          onlineStoreUrl: string;
        };
      };
    }>(mutation, {
      input: {
        blogId,
        title: params.title,
        bodyHtml: params.bodyHtml,
        tags: params.tags || [],
        seo,
        published: false
      }
    });

    const article = result.articleCreate.article;

    return {
      articleId: article.id,
      handle: article.handle,
      url: article.onlineStoreUrl || article.url
    };
  } catch (error) {
    console.error('Error creating blog post:', error);
    throw error;
  }
}

export async function updateBlogPost(
  articleId: string,
  updates: {
    title?: string;
    bodyHtml?: string;
    published?: boolean;
    metaTitle?: string;
    metaDescription?: string;
    tags?: string[];
  }
): Promise<{ success: boolean; article: any }> {
  try {
    const mutation = `
      mutation UpdateArticle($input: ArticleInput!) {
        articleUpdate(input: $input) {
          article {
            id
            title
            published
            publishedAt
          }
        }
      }
    `;

    const seo: any = {};
    if (updates.metaTitle) seo.title = updates.metaTitle;
    if (updates.metaDescription) seo.description = updates.metaDescription;

    const input: any = { id: articleId };
    if (updates.title) input.title = updates.title;
    if (updates.bodyHtml) input.bodyHtml = updates.bodyHtml;
    if (Object.keys(seo).length > 0) input.seo = seo;
    if (updates.tags) input.tags = updates.tags;
    if (updates.published !== undefined) input.published = updates.published;

    const result = await shopifyFetch<{
      articleUpdate: { article: any };
    }>(mutation, { input });

    return {
      success: true,
      article: result.articleUpdate.article
    };
  } catch (error) {
    console.error('Error updating blog post:', error);
    throw error;
  }
}

export async function publishBlogPost(articleId: string): Promise<{ success: boolean }> {
  try {
    const mutation = `
      mutation PublishArticle($input: ArticleInput!) {
        articleUpdate(input: $input) {
          article {
            id
            published
            publishedAt
          }
        }
      }
    `;

    await shopifyFetch(mutation, {
      input: {
        id: articleId,
        published: true
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error publishing blog post:', error);
    throw error;
  }
}

export function injectSchemaMarkup(bodyHtml: string, schemaJson: any): string {
  const schemaTag = `<script type="application/ld+json">${JSON.stringify(schemaJson)}</script>`;
  return `${bodyHtml}\n${schemaTag}`;
}

export function injectDirectAnswer(bodyHtml: string, directAnswer: string): string {
  const hiddenDiv = `<div class="direct-answer" style="display:none;">${directAnswer}</div>`;
  return `${hiddenDiv}\n${bodyHtml}`;
}

export async function getArticle(
  articleId: string
): Promise<{ id: string; title: string; published: boolean; publishedAt: string }> {
  try {
    const query = `
      query GetArticle($id: ID!) {
        article(id: $id) {
          id
          title
          published
          publishedAt
        }
      }
    `;

    const result = await shopifyFetch<{
      article: { id: string; title: string; published: boolean; publishedAt: string };
    }>(query, { id: articleId });

    return result.article;
  } catch (error) {
    console.error('Error getting article:', error);
    throw error;
  }
}

export async function listArticles(limit = 10): Promise<Array<any>> {
  try {
    const query = `
      query ListArticles($first: Int!) {
        articles(first: $first) {
          edges {
            node {
              id
              title
              published
              publishedAt
              handle
              onlineStoreUrl
            }
          }
        }
      }
    `;

    const result = await shopifyFetch<{
      articles: { edges: Array<{ node: any }> };
    }>(query, { first: limit });

    return result.articles.edges.map((e) => e.node);
  } catch (error) {
    console.error('Error listing articles:', error);
    throw error;
  }
}
