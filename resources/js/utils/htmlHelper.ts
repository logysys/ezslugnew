/**
 * Utility functions for HTML detection, repair, and normalization
 */

// Decode HTML entities if text is encoded (e.g. &lt;html... or &lt;div...)
export function decodeHtmlEntities(html: string): string {
    if (!html || typeof html !== 'string') return '';
    if (typeof document === 'undefined') {
        return html
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#039;/g, "'")
            .replace(/&amp;/g, '&');
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.documentElement.textContent || html;
}

/**
 * Repairs malformed HTML where opening '<' brackets or closing brackets were stripped
 * (e.g. `html lang="en"> head> meta charset="UTF-8"> ... iframe src="..." ...>iframe> div> body> html>`)
 */
export function repairMalformedHtml(input: string): string {
    if (!input || typeof input !== 'string') return input;
    let s = input.trim();

    // Check if it looks like HTML tags missing opening '<'
    const hasMissingOpeningTags = /(?:^|\s)(?:html[\s>]|head>|meta[\s>]|title>|style>|body>|div[\s>]|iframe[\s>]|section[\s>]|article[\s>]|p[\s>]|table[\s>])/i.test(s) &&
                                  !s.startsWith('<') &&
                                  s.includes('>');

    if (!hasMissingOpeningTags) {
        return s;
    }

    const tagNames = [
        'html', 'head', 'meta', 'link', 'title', 'style', 'body', 'div', 'iframe',
        'p', 'a', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'ul', 'ol',
        'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'section', 'article', 'nav',
        'header', 'footer', 'main', 'aside', 'button', 'input', 'form', 'label',
        'select', 'option', 'textarea', 'img', 'video', 'audio', 'source',
        'blockquote', 'b', 'i', 'strong', 'em', 'script'
    ];

    // Convert trailing closing tags like ">iframe>" or ">div>"
    s = s.replace(/>\s*iframe>/gi, '></iframe>');
    s = s.replace(/>\s*div>/gi, '></div>');
    s = s.replace(/>\s*p>/gi, '></p>');
    s = s.replace(/>\s*a>/gi, '></a>');
    s = s.replace(/>\s*span>/gi, '></span>');
    s = s.replace(/>\s*button>/gi, '></button>');
    s = s.replace(/>\s*table>/gi, '></table>');
    s = s.replace(/>\s*section>/gi, '></section>');
    s = s.replace(/>\s*article>/gi, '></article>');
    s = s.replace(/>\s*body>/gi, '></body>');
    s = s.replace(/>\s*html>/gi, '></html>');
    s = s.replace(/>\s*head>/gi, '></head>');
    s = s.replace(/>\s*style>/gi, '></style>');
    s = s.replace(/>\s*script>/gi, '></script>');

    // Convert multiple trailing closing tags
    s = s.replace(/\bdiv>\s*body>\s*html>$/i, '</div></body></html>');
    s = s.replace(/\bbody>\s*html>$/i, '</body></html>');
    s = s.replace(/\bstyle>\s*head>\s*body>/i, '</style></head><body>');
    s = s.replace(/\bstyle>\s*head>/i, '</style></head>');

    // Title tag repair: title>Some Texttitle> -> <title>Some Text</title>
    s = s.replace(/\btitle>([\s\S]*?)title>/gi, '<title>$1</title>');

    // Repair tags
    for (const tag of tagNames) {
        // Tag with attributes: e.g. 'div class="xyz">' or 'html lang="en">'
        const attrRegex = new RegExp(`(^|\\s)(${tag}\\s+[^>]*>)`, 'gi');
        s = s.replace(attrRegex, (match, prefix, tagBody) => `${prefix}<${tagBody}`);

        // Simple opening tag: e.g. 'head>', 'style>', 'body>', 'div>'
        const simpleRegex = new RegExp(`(^|[^<\\/\\w])(${tag}>)`, 'gi');
        s = s.replace(simpleRegex, (match, prefix, tagBody) => `${prefix}<${tagBody}`);
    }

    // Clean up any duplicated '<<'
    s = s.replace(/<<+/g, '<');

    return s;
}

export interface ProcessedHtml {
    isHtml: boolean;
    isFullDoc: boolean;
    html: string;
}

/**
 * Detects if a string is HTML or an HTML embed, extracts code from markdown code fences if needed,
 * repairs malformed tags, and wraps partial snippets in a full HTML document if needed.
 */
export function detectAndProcessHtml(raw: string): ProcessedHtml {
    if (!raw || typeof raw !== 'string') {
        return { isHtml: false, isFullDoc: false, html: '' };
    }

    let text = raw.trim();

    // 1. Check if wrapped in markdown code fence e.g. ```html ... ``` or ```xml ... ``` or ``` ... ```
    const codeBlockMatch = text.match(/^```(?:html|xml|htm)?\s*([\s\S]*?)\s*```$/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
        text = codeBlockMatch[1].trim();
    }

    // 2. Decode HTML entities if text is encoded (e.g. &lt;html... or &lt;div...)
    if (text.includes('&lt;') && text.includes('&gt;')) {
        text = decodeHtmlEntities(text);
    }

    // 3. Repair malformed tags if tags were stripped of '<' (e.g. html lang="en">, iframe src=, etc.)
    text = repairMalformedHtml(text);

    // 4. Check if it is HTML document or rich HTML embed
    const isDoc = /<!doctype\s+html/i.test(text) ||
                  /<html[\s>]/i.test(text) ||
                  (/<head[\s>]/i.test(text) && /<body[\s>]/i.test(text));

    const hasRichTags = /<(?:iframe|style|script|svg|video|audio|embed|object|table|form|canvas)[\s>]/i.test(text);
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(text);

    const isHtml = isDoc || hasRichTags || (hasHtmlTags && (text.includes('</') || text.includes('/>') || text.includes('class=') || text.includes('style=')));

    // Ensure complete HTML document wrapper for snippets if rendered in HtmlDocPreview
    let fullHtml = text;
    if (isHtml && !isDoc) {
        fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <base target="_blank">
    <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #111827; }
    </style>
</head>
<body>
    ${text}
</body>
</html>`;
    }

    return {
        isHtml,
        isFullDoc: isDoc,
        html: fullHtml,
    };
}
