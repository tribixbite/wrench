import sanitize from 'sanitize-html';

/**
 * Sanitizes admin-authored newsletter HTML before storage and public rendering.
 * Uses an allowlist approach — only explicitly permitted tags, attributes, and
 * URL schemes pass through. Everything else (script, iframe, javascript: hrefs,
 * on* handlers, SVG event primitives) is stripped.
 */
export function sanitizeHtml(dirty: string): string {
  return sanitize(dirty, {
    allowedTags: [
      // Block elements
      'p', 'div', 'section', 'article', 'blockquote', 'pre',
      // Headings
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      // Inline formatting
      'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'mark', 'code', 'kbd', 'abbr',
      // Lists
      'ul', 'ol', 'li',
      // Media
      'img', 'figure', 'figcaption',
      // Links
      'a',
      // Layout / typography
      'br', 'hr', 'span',
      // Tables (common in email newsletters)
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'style'],
      table: ['width', 'cellpadding', 'cellspacing', 'border', 'style'],
      th: ['colspan', 'rowspan', 'scope', 'style'],
      td: ['colspan', 'rowspan', 'style'],
      '*': ['class', 'id', 'style'],
    },
    // Only these URL schemes are allowed in href/src attributes
    allowedSchemes: ['https', 'http', 'mailto'],
    allowedSchemesByTag: {
      img: ['https', 'http', 'data'],  // data: allows base64 pasted images
    },
    // Force external links to open safely
    transformTags: {
      a: sanitize.simpleTransform('a', { rel: 'noopener noreferrer' }, false),
    },
  });
}
