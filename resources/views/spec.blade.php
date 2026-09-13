<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="[ARCHIVE v2024] nug8 Protocol Spec. Deprecated. EZ Grid Protocol v2.0 is the production standard. IANA Provisional #1454153. Visit ezgrid.org/protocol for current ABNF spec.">
	<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
	<title>[ARCHIVE] nug8 Protocol Spec v2024 - See EZ Grid Protocol</title>
    
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Courier New', monospace;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.7;
            color: #222;
            background: #fafafa;
        }
        h1, h2, h3 { color: #1a1a1a; margin-top: 40px; }
        h1 { font-size: 2em; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
        h2 { font-size: 1.4em; color: #667eea; margin-top: 30px; }
        code, pre {
            background: #f4f4f4;
            padding: 3px 8px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 0.95em;
        }
        pre {
            padding: 18px;
            overflow-x: auto;
            border-left: 4px solid #667eea;
            background: #1e1e1e;
            color: #d4d4d4;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 35px;
            border-radius: 12px;
            margin-bottom: 40px;
        }
        .badge {
            display: inline-block;
            background: #f59e0b;
            color: white;
            padding: 5px 14px;
            border-radius: 14px;
            font-size: 0.8em;
            margin-right: 8px;
            font-weight: 600;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 14px;
            text-align: left;
        }
        th {
            background: #667eea;
            color: white;
        }
        .note {
            background: #dbeafe;
            border-left: 4px solid #3b82f6;
            padding: 18px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 18px;
            margin: 25px 0;
            border-radius: 4px;
        }
    </style>
	<link rel="canonical" href="https://ezgrid.org/protocol">
</head>
<div style="position:fixed; top:0; left:0; width:100%; background:#6A4C93; color:#fff; 
text-align:center; padding:14px 20px; font-weight:600; z-index:9999; font-family:Inter, sans-serif; font-size:15px; box-shadow:0 2px 8px rgba(0,0,0,0.3)">
  [GENESIS ARCHIVE] nug8 was the prototype. 
  EZ Grid is the production protocol → 
  <a href="https://ezgrid.org" style="color:#FFC300; text-decoration:underline; font-weight:700">ezgrid.org</a>
  | Five Forces. One Protocol. ez://
</div>
<body style="padding-top:58px">
    <div class="header">
        <h1 style="color:white; border:none; margin:0;">ez:// URI Scheme Specification</h1>
        <div style="margin-top:15px; font-size:0.95em; opacity:0.95;">
            <span class="badge">v0.0-rev2 Genesis</span>
            <span class="badge">Provisional Registration</span>
            <span class="badge">IANA Ticket #1453765</span>
            <br><br>
            Purpose: 3-label syntax optimized for human visual recognition and AI tokenization<br>
            Transport: HTTPS during provisional period<br>
            Author: KuoChun Fang / M-Commerce.com<br>
            Date: 2026-07-09 Rev2
        </div>
    </div>

    <div class="note">
        <strong>Relationship to HTTPS:</strong> 
        ez:// defines naming syntax only. HTTPS remains the standard for web transport and security. 
        ez:// URIs are resolved via distributed registry, not DNS root zone. This specification respects 
        HTTPS dominance while introducing optimized naming for humans and AI Agents.
    </div>

    <h2>1. Purpose and Design Goals</h2>
    <p>
        ez:// V0.0 defines a 3-label URI syntax designed for two core audiences:
    </p>
    <ul>
        <li><strong>Human Visual Recognition:</strong> R.L.C structure matches natural reading order. 
        <code>ez://product.NuG8.com</code> is easier to read, speak, and remember than complex URL paths.</li>
        <li><strong>AI Tokenization:</strong> Fixed R.L.C delimiters provide deterministic token boundaries 
        for LLMs and Agents. No HTML parsing or URL parameter extraction required. Native syntax for Agent-to-Agent addressing.</li>
    </ul>

    <h2>2. URI Syntax</h2>
    <pre>ez://R.L.C</pre>
    
    <h3>2.1 Component Definitions</h3>
    <table>
        <tr>
            <th>Component</th>
            <th>Name</th>
            <th>Character Set</th>
            <th>Encoding</th>
            <th>Wire Format Example</th>
        </tr>
        <tr>
            <td>R</td>
            <td>Resource</td>
            <td>Unicode</td>
            <td>Punycode RFC 5891</td>
            <td>xn--yfrk</td>
        </tr>
        <tr>
            <td>L</td>
            <td>Location/Namespace</td>
            <td>ASCII only</td>
            <td>Plain ASCII</td>
            <td>NuG8</td>
        </tr>
        <tr>
            <td>C</td>
            <td>Class</td>
            <td>ASCII only</td>
            <td>Plain ASCII</td>
            <td>com</td>
        </tr>
    </table>

    <div class="warning">
        <strong>Wire Format Only:</strong> This specification shows Punycode storage form in all technical examples. 
        Unicode display is presentation-layer only. Registry records and protocol use Punycode exclusively to eliminate ambiguity.
    </div>

    <h3>2.2 Label Matching</h3>
    <p>
        Label matching is case-insensitive per RFC 5890 Section 2.3.2. 
        <code>NuG8 = nug8 = NUG8</code> for L and C components. R component follows Punycode case rules.
    </p>

    <h2>3. Namespace Authority</h2>
    <p>
        L.C forms a 2-label namespace. Registration of L.C grants authority to issue all R resources 
        under that namespace via distributed registry. This authority is independent of DNS root zone.
    </p>
    <pre>Registrant of NuG8.com → Authorized to issue ez://*.NuG8.com</pre>

    <h2>4. V0.0 Initial Classes</h2>
    <table>
        <tr>
            <th>Class</th>
            <th>Intended Use</th>
        </tr>
        <tr>
            <td>com</td>
            <td>Commercial namespaces</td>
        </tr>
        <tr>
            <td>ai</td>
            <td>AI Agent and model namespaces</td>
        </tr>
        <tr>
            <td>net</td>
            <td>Network infrastructure</td>
        </tr>
        <tr>
            <td>org</td>
            <td>Organizations and DAOs</td>
        </tr>
        <tr>
            <td>nft</td>
            <td>Digital assets</td>
        </tr>
    </table>
    <p>Classes are protocol-level classifications. They do not map to DNS TLDs and do not require DNS delegation.</p>

    <h2>5. Transport and Interoperability</h2>
    <p>
        V0.0 uses HTTPS as transport layer via gateway at ez.wiki. Full URI format: 
        <code>https://ez.wiki/R.L.C</code>. This provides immediate browser compatibility during provisional period.
    </p>
    <p>
        Future V1.0 will define native protocol handler <code>web+ez</code> for direct resolution without gateway.
    </p>

    <h2>6. Security Considerations</h2>
    <p>
        Distributed registry prevents single-entity squatting. L.C ownership provides cryptographic 
        authority over R resources. Fixed R.L.C structure reduces parsing confusion attacks compared to 
        variable URL path structures.
    </p>

    <h2>7. References</h2>
    <ul>
        <li>RFC 3986 - URI Generic Syntax</li>
        <li>RFC 5890 - IDNA: Definitions and Document Framework</li>
        <li>RFC 5891 - IDNA: Protocol</li>
        <li>RFC 3492 - Punycode</li>
        <li>RFC 7595 - Guidelines for URI Scheme Registration</li>
    </ul>

    <hr style="margin: 50px 0;">
    <p style="font-size: 0.85em; opacity: 0.7; text-align: center;">
        Provisional Registration Request submitted to IANA.<br>
        Contact: RoyFang@M-Commerce.com | Demo: https://genesis.NuG8.com
    </p>
</body>
</html>