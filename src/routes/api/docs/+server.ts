/**
 * GET /api/docs
 *
 * Serves an interactive Swagger UI for the Wrench Club API.
 * Swagger UI is loaded from CDN (unpkg) to keep the bundle lean.
 * Dark background (#0a0a0a) matches the site's dark-first theme.
 * The topbar is hidden since branding is handled inline.
 */
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Wrench Club — API Docs</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }

    body {
      margin: 0;
      background: #0a0a0a;
      font-family: system-ui, -apple-system, sans-serif;
    }

    /* Brand header */
    .api-header {
      background: #111;
      border-bottom: 1px solid #1f1f1f;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .api-header-brand {
      font-size: 1.125rem;
      font-weight: 900;
      color: #ED0C85;
      letter-spacing: -0.02em;
      text-decoration: none;
    }
    .api-header-label {
      color: #525252;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 2px 8px;
      border: 1px solid #262626;
      border-radius: 4px;
    }

    /* Hide the default Swagger topbar */
    .swagger-ui .topbar { display: none !important; }

    /* Dark-mode overrides for Swagger UI */
    .swagger-ui { color: #d4d4d4; }
    .swagger-ui .scheme-container,
    .swagger-ui .info { background: transparent; }

    .swagger-ui .info .title { color: #f0f0f0; }
    .swagger-ui .info p,
    .swagger-ui .info li,
    .swagger-ui .info table { color: #a3a3a3; }

    .swagger-ui .opblock-tag { color: #f0f0f0; border-bottom-color: #262626; }
    .swagger-ui .opblock-tag:hover { background: rgba(255,255,255,0.04); }

    .swagger-ui .opblock { border-color: #262626; border-radius: 8px; margin-bottom: 8px; }
    .swagger-ui .opblock .opblock-summary { background: #111; border-radius: 8px; }
    .swagger-ui .opblock.opblock-post { background: rgba(73,204,144,0.06); border-color: #2d5a3d; }
    .swagger-ui .opblock.opblock-get  { background: rgba(97,175,254,0.06); border-color: #1e3a5f; }

    .swagger-ui .opblock-summary-method {
      border-radius: 4px;
      font-weight: 700;
      min-width: 60px;
      text-align: center;
    }
    .swagger-ui .opblock-summary-description { color: #a3a3a3; }
    .swagger-ui .opblock-summary-path,
    .swagger-ui .opblock-summary-path__deprecated { color: #f0f0f0; }

    .swagger-ui .opblock-body { background: #0f0f0f; }
    .swagger-ui .opblock-section-header { background: #161616; }
    .swagger-ui .opblock-section-header h4 { color: #d4d4d4; }

    .swagger-ui textarea,
    .swagger-ui input[type=text],
    .swagger-ui input[type=password],
    .swagger-ui input[type=search],
    .swagger-ui input[type=email] {
      background: #1a1a1a;
      border-color: #333;
      color: #f0f0f0;
    }
    .swagger-ui select {
      background: #1a1a1a;
      border-color: #333;
      color: #f0f0f0;
    }

    .swagger-ui table thead tr td,
    .swagger-ui table thead tr th { color: #a3a3a3; border-bottom-color: #262626; }
    .swagger-ui table tbody tr td { color: #d4d4d4; }

    .swagger-ui .response-col_status { color: #f0f0f0; }
    .swagger-ui .response-col_description { color: #a3a3a3; }

    .swagger-ui .btn { border-radius: 6px; }
    .swagger-ui .btn.execute { background: #ED0C85; border-color: #ED0C85; }
    .swagger-ui .btn.execute:hover { background: #c00a6f; border-color: #c00a6f; }

    .swagger-ui .model-box { background: #111; border-color: #262626; }
    .swagger-ui .model { color: #d4d4d4; }
    .swagger-ui .model .property { color: #a3a3a3; }

    .swagger-ui section.models { border-color: #262626; }
    .swagger-ui section.models h4 { color: #f0f0f0; }
    .swagger-ui section.models .model-container { background: #111; border-color: #1f1f1f; }

    .swagger-ui .highlight-code { background: #0f0f0f !important; }
    .swagger-ui .microlight { color: #a3a3a3; }

    .swagger-ui .servers > label { color: #a3a3a3; }
    .swagger-ui .servers > label select { background: #1a1a1a; color: #f0f0f0; border-color: #333; }

    .swagger-ui .auth-wrapper .authorize { border-color: #ED0C85; color: #ED0C85; }
    .swagger-ui .auth-wrapper .authorize svg { fill: #ED0C85; }
    .swagger-ui .dialog-ux .modal-ux { background: #111; border-color: #262626; }
    .swagger-ui .dialog-ux .modal-ux-header { background: #0a0a0a; border-bottom-color: #262626; }
    .swagger-ui .dialog-ux .modal-ux-header h3 { color: #f0f0f0; }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #111; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="api-header">
    <a class="api-header-brand" href="/">WRENCH CLUB</a>
    <span class="api-header-label">API Docs</span>
  </div>
  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/docs/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      presets: [
        SwaggerUIBundle.presets.apis,
        SwaggerUIBundle.SwaggerUIStandalonePreset
      ],
      layout: 'BaseLayout'
    });
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
};
