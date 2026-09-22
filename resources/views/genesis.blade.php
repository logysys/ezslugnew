<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="[GENESIS ARCHIVE] nug8 was the prototype for EZ Grid Protocol. Five Forces: Power + Compute + Speed. Production protocol now live at ezgrid.org. IANA #1454153.">
	<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
	<title>[ARCHIVE] nug8 Genesis 2024 - Now EZ Grid Protocol</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 48px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            min-height: 100vh;
        }

        /* main glassmorphic card container */
        .card {
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(12px);
            padding: 52px 44px;
            border-radius: 36px;
            border: 1px solid rgba(255, 255, 255, 0.25);
            box-shadow: 0 25px 45px -12px rgba(0, 0, 0, 0.35);
            transition: all 0.2s ease;
        }

        /* unified banner style - fully integrated with modern glass design */
        .genesis-banner {
            background: rgba(255, 255, 255, 0.18);
            backdrop-filter: blur(8px);
            border-left: 5px solid #FFD966;
            border-radius: 20px;
            padding: 18px 22px;
            margin: 0 0 28px 0;
            font-size: 0.95rem;
            text-align: left;
            transition: all 0.2s;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            color: #fff5e6;
        }

        .genesis-banner strong {
            color: #FFE6A7;
            font-weight: 700;
            letter-spacing: -0.2px;
        }

        .genesis-banner a {
            color: #FFDF8F;
            text-decoration: none;
            font-weight: 600;
            border-bottom: 1px dotted rgba(255, 223, 143, 0.6);
            transition: all 0.2s;
        }

        .genesis-banner a:hover {
            color: white;
            border-bottom-color: white;
        }

        /* main title */
        h1 {
            font-size: 3.5rem;
            font-weight: 700;
            margin: 0 0 12px 0;
            letter-spacing: -0.02em;
            background: linear-gradient(135deg, #FFFFFF 0%, #FFE6C7 100%);
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            text-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .tagline {
            font-size: 1.25rem;
            opacity: 0.92;
            font-weight: 450;
            margin-bottom: 32px;
        }

        .uri {
            font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;
            font-size: 1.9rem;
            font-weight: 500;
            background: rgba(0, 0, 0, 0.35);
            backdrop-filter: blur(4px);
            padding: 22px 20px;
            border-radius: 28px;
            margin: 30px 0 20px 0;
            letter-spacing: 0.5px;
            word-break: break-word;
            border: 1px solid rgba(255,255,240,0.25);
            box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        }

        .split {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            margin: 48px 0 44px 0;
            flex-wrap: wrap;
        }

        .box {
            background: rgba(255, 255, 255, 0.13);
            backdrop-filter: blur(4px);
            padding: 28px 22px;
            border-radius: 28px;
            width: 48%;
            min-width: 260px;
            text-align: left;
            transition: transform 0.2s, background 0.2s;
            border: 1px solid rgba(255,255,255,0.2);
        }

        .box:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: translateY(-4px);
        }

        .box h3 {
            margin-top: 0;
            margin-bottom: 18px;
            font-size: 1.6rem;
            font-weight: 600;
            color: #FFE2A4;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .box p {
            line-height: 1.5;
            font-size: 1rem;
            opacity: 0.92;
            margin-bottom: 12px;
        }

        .box code {
            background: rgba(0,0,0,0.4);
            padding: 3px 8px;
            border-radius: 14px;
            font-family: monospace;
            font-size: 0.9rem;
        }

        .respect-card {
            background: rgba(0, 0, 0, 0.25);
            backdrop-filter: blur(5px);
            padding: 28px 26px;
            border-radius: 28px;
            margin: 28px 0 36px 0;
            text-align: left;
            border-left: 4px solid #FFD966;
        }

        .respect-card h3 {
            margin-top: 0;
            font-size: 1.5rem;
            font-weight: 600;
            color: #FFE3A4;
            margin-bottom: 14px;
        }

        .respect-card p {
            line-height: 1.5;
            font-size: 1rem;
        }

        .link-group {
            margin: 24px 0 20px;
            display: flex;
            gap: 28px;
            justify-content: center;
            flex-wrap: wrap;
        }

        .link-group a {
            color: #FFE2B5;
            font-weight: 600;
            font-size: 1rem;
            text-decoration: none;
            border-bottom: 1px solid rgba(255, 226, 181, 0.5);
            transition: 0.2s;
        }

        .link-group a:hover {
            color: white;
            border-bottom-color: white;
        }

        .footer {
            margin-top: 48px;
            font-size: 0.85rem;
            opacity: 0.75;
            border-top: 1px solid rgba(255,255,240,0.25);
            padding-top: 28px;
            letter-spacing: 0.2px;
        }

        @media (max-width: 700px) {
            body {
                padding: 24px 16px;
            }
            .card {
                padding: 32px 22px;
            }
            h1 {
                font-size: 2.6rem;
            }
            .uri {
                font-size: 1.3rem;
                padding: 16px 12px;
            }
            .box {
                width: 100%;
            }
            .split {
                flex-direction: column;
            }
            .genesis-banner {
                font-size: 0.85rem;
                padding: 14px 18px;
            }
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
    <div class="card">
        <!-- redesigned banner: perfectly matching full page design + glassmorphic & colorful accents -->
        <div class="genesis-banner">
            <strong>⚡ ez:// URI Scheme:</strong> V0.0 Provisional Registration<br>
            ✅ Approved by IANA June 12, 2026 | Ticket #1454153<br>
            🔁 Supersedes #1453765 | 
            <a href="https://spec.nug8.com/ez-uri-v0.0-provisional.html">📘 Technical Spec</a> &nbsp;|&nbsp; 
            <a href="https://www.iana.org/assignments/uri-schemes/prov/ez">🌐 IANA Registry</a>
        </div>

        <h1>ez:// V0.0 Genesis</h1>
        <div class="tagline">⚡ 3‑label URI syntax for Human Eyes + AI Tokens</div>
        
        <div class="uri">ez://genesis.NuG8.com</div>
        
        <div class="split">
            <div class="box">
                <h3>👁️ For Humans</h3>
                <p>R.L.C structure matches natural reading order.<br>
                Easier to read, say, and remember than URL paths.<br>
                <code>product.NuG8.com</code> vs <code>website.com/p/12345</code></p>
            </div>
            
            <div class="box">
                <h3>🤖 For AI Agents</h3>
                <p>Fixed delimiters create deterministic tokens.<br>
                LLMs parse R.L.C without regex or HTML parsing.<br>
                Native syntax for Agent-to-Agent addressing.</p>
            </div>
        </div>

        <div class="respect-card">
            <h3>🔒 Respect for HTTPS</h3>
            <p>ez:// does not replace HTTPS. HTTPS remains the web transport standard.<br>
            ez:// provides alternative naming resolved via distributed registry, not DNS root.</p>
        </div>

        <div class="link-group">
            <a href="https://spec.nug8.com">📄 Read Specification V0.0-rev1</a> 
            <a href="mailto:RoyFang@M-Commerce.com">✉️ Contact Author</a>
        </div>

        <div class="footer">
            🌟 IANA Ticket #1453765 | Provisional Registration Status<br>
            ✨ Syntax: <strong>R.Resource . L.Location . C.Class</strong>
        </div>
    </div>
</body>
</html>