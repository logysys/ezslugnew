import { useState } from "react";

const PINK = "#e040fb";
const PURPLE = "#7b2ff7";

const GURUS = [
  { id: "hormozi",  name: "Alex Hormozi",     specialty: "Offer-Driven Clarity",      avatar: "AH", color: "#7b2ff7" },
  { id: "garyvee",  name: "Gary Vaynerchuk",  specialty: "Platform & Virality",       avatar: "GV", color: "#e74c3c" },
  { id: "brunson",  name: "Russell Brunson",  specialty: "Funnel & Curiosity",        avatar: "RB", color: "#f39c12" },
  { id: "kennedy",  name: "Dan Kennedy",      specialty: "Direct Response",           avatar: "DK", color: "#27ae60" },
  { id: "godin",    name: "Seth Godin",       specialty: "Remarkable & Tribal",       avatar: "SG", color: "#3498db" },
  { id: "patel",    name: "Neil Patel",       specialty: "SEO & Keywords",            avatar: "NP", color: "#e67e22" },
  { id: "halbert",  name: "Gary Halbert",     specialty: "Headline Shock & Emotion",  avatar: "GH", color: "#c0392b" },
  { id: "schwartz", name: "Eugene Schwartz",  specialty: "Mass Desire & Awareness",   avatar: "ES", color: "#8e44ad" },
  { id: "sugarman", name: "Joe Sugarman",     specialty: "Slippery-Slope Curiosity",  avatar: "JS", color: "#16a085" },
  { id: "cialdini", name: "Robert Cialdini",  specialty: "Influence & Persuasion",    avatar: "RC", color: "#2c3e50" },
  { id: "ogilvy",   name: "David Ogilvy",     specialty: "Brand Elegance & Research", avatar: "DO", color: "#b7410e" },
  { id: "abraham",  name: "Jay Abraham",      specialty: "Strategy of Preeminence",   avatar: "JA", color: "#1a7a4a" },
];

const SYSTEM_PROMPT = `You are a panel of 12 world-class marketing and copywriting gurus generating URL slug suggestions.

1. Alex Hormozi — offer-driven clarity, specific outcomes, no fluff
2. Gary Vaynerchuk — platform virality, hooky, punchy, social-native
3. Russell Brunson — curiosity-driven, story-hint, funnel psychology
4. Dan Kennedy — direct response, urgency, specific benefit
5. Seth Godin — remarkable, tribe-focused, thought-provoking
6. Neil Patel — SEO-optimized, keyword-rich, search-intent-driven
7. Gary Halbert — emotional shock, raw headline energy, curiosity gap
8. Eugene Schwartz — mass desire, awareness-level matching, primal triggers
9. Joe Sugarman — slippery-slope intrigue, sensory language, irresistible opener
10. Robert Cialdini — social proof, authority, scarcity, reciprocity signals
11. David Ogilvy — brand elegance, research-driven, timeless authority
12. Jay Abraham — strategy of preeminence, host-beneficiary, exponential value

SLUG RULES — ALL 12 slugs MUST follow these:
- Every slug MUST contain at least 1 emoji somewhere (start, middle, or end — vary the position)
- Mix languages freely: some slugs in English, some in native UTF-8 scripts (Japanese, Arabic, Korean, Chinese, Hindi, Greek, Hebrew, Thai, Spanish with accents, French, etc.) — choose whichever script fits best for each guru's personality and the content
- Hyphens between words/segments
- 3–6 segments total
- No punctuation except hyphens
- Emojis count as segments — be creative and relevant to the content

Examples of valid slugs:
  🚀-how-to-scale-fast
  كيف-تنمو-💰-بسرعة
  grow-your-brand-🔥-now
  성공-비결-✨-지금-시작
  comment-réussir-🎯-en-ligne

Return ONLY this JSON array, no preamble, no markdown:
[
  {"guru":"Alex Hormozi","avatar":"AH","color":"#7b2ff7","slug":"...","rationale":"One sentence explaining slug + emoji + language choice."},
  {"guru":"Gary Vaynerchuk","avatar":"GV","color":"#e74c3c","slug":"...","rationale":"..."},
  {"guru":"Russell Brunson","avatar":"RB","color":"#f39c12","slug":"...","rationale":"..."},
  {"guru":"Dan Kennedy","avatar":"DK","color":"#27ae60","slug":"...","rationale":"..."},
  {"guru":"Seth Godin","avatar":"SG","color":"#3498db","slug":"...","rationale":"..."},
  {"guru":"Neil Patel","avatar":"NP","color":"#e67e22","slug":"...","rationale":"..."},
  {"guru":"Gary Halbert","avatar":"GH","color":"#c0392b","slug":"...","rationale":"..."},
  {"guru":"Eugene Schwartz","avatar":"ES","color":"#8e44ad","slug":"...","rationale":"..."},
  {"guru":"Joe Sugarman","avatar":"JS","color":"#16a085","slug":"...","rationale":"..."},
  {"guru":"Robert Cialdini","avatar":"RC","color":"#2c3e50","slug":"...","rationale":"..."},
  {"guru":"David Ogilvy","avatar":"DO","color":"#b7410e","slug":"...","rationale":"..."},
  {"guru":"Jay Abraham","avatar":"JA","color":"#1a7a4a","slug":"...","rationale":"..."}
]`;

const normalizeUrl = (raw) => {
  try {
    const u = new URL(raw.trim());
    const path = u.pathname.split("/").map(seg => { try { return decodeURIComponent(seg); } catch { return seg; } }).join("/");
    return `${u.protocol}//${u.hostname}${path}${u.search}${u.hash}`;
  } catch {
    try { return decodeURIComponent(raw.trim()); } catch { return raw.trim(); }
  }
};

// Encode slug preserving emoji and UTF-8 chars for display, but encode for URL copy
const encodeSlug = (slug) => {
  return slug.split("-").map(seg => encodeURIComponent(seg)).join("-");
};

const hasNonLatin = (slug) => /[^\x00-\x7F]/.test(slug.replace(/\p{Emoji}/gu, ""));

// ─── KIMI API CONFIG ───
const KIMI_API_KEY = "sk-6WgIud23PdYluNxmJp6laFlAuBCE0hfsX4PJvtBXuGcoiapI";
const KIMI_BASE_URL = "https://api.moonshot.ai/v1";
const KIMI_MODEL = "kimi-k3";

export default function SlugifyAI() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const handleGenerate = async () => {
    if (!url.trim()) return;
    setLoading(true); setError(""); setResults(null);
    const normalizedInput = normalizeUrl(url);
    try {
      const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${KIMI_API_KEY}`,
        },
        body: JSON.stringify({
          model: KIMI_MODEL,
          max_tokens: 8192,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Content URL or title: ${normalizedInput}` }
          ],
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";

      // Handle truncated responses (finish_reason = "length")
      const finishReason = data.choices?.[0]?.finish_reason;
      if (finishReason === "length") {
        console.warn("Response was truncated due to max_tokens limit");
      }

      // Extract JSON from the response - handle partial JSON
      let clean = text.replace(/```json|```/g, "").trim();

      // Try to find complete JSON array even if there's extra text
      const jsonMatch = clean.match(/\[.*\]/s);
      if (jsonMatch) {
        clean = jsonMatch[0];
      }

      // If JSON is truncated, try to fix it
      if (finishReason === "length" && !clean.endsWith("]")) {
        // Find last complete object and close the array
        const lastBrace = clean.lastIndexOf("}");
        if (lastBrace > 0) {
          clean = clean.substring(0, lastBrace + 1) + "]";
        }
      }

      setResults(JSON.parse(clean));
    } catch (err) {
      console.error("Parse error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (slug) => {
    const text = slug;
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    } catch {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopied(slug);
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0d001a", fontFamily: "'DM Sans', sans-serif", color: "#f0e0ff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
        @keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
        @keyframes drip{0%,100%{transform:scaleY(1) translateY(0)}50%{transform:scaleY(1.06) translateY(2px)}}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        *{box-sizing:border-box;margin:0;padding:0}
        input:focus{outline:none}
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:#1a0030}
        ::-webkit-scrollbar-thumb{background:#7b2ff7;border-radius:3px}
      `}</style>

      <div style={{ maxWidth: 740, margin: "0 auto", padding: "44px 24px 80px" }}>

        {/* ── LOGO ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32, animation: "fadeUp .5s ease-out both" }}>
          {/* Shield + snail */}
          <div style={{ animation: "drip 3.5s ease-in-out infinite", marginBottom: 14 }}>
            <svg width="90" height="90" viewBox="0 0 200 210" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="shieldBg" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#5a10c0"/>
                  <stop offset="100%" stopColor="#2d0060"/>
                </radialGradient>
                <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              {/* Shield */}
              <path d="M100 8 L178 44 L178 118 Q178 172 100 198 Q22 172 22 118 L22 44 Z"
                fill="url(#shieldBg)" stroke="#e040fb" strokeWidth="5" filter="url(#glow)"/>
              {/* Inner shield ring */}
              <path d="M100 22 L164 52 L164 118 Q164 160 100 182 Q36 160 36 118 L36 52 Z"
                fill="none" stroke="#b040d0" strokeWidth="1.5" opacity=".5"/>
              {/* Snail body */}
              <ellipse cx="100" cy="138" rx="38" ry="20" fill="#d0d0d0"/>
              <ellipse cx="108" cy="140" rx="20" ry="11" fill="#c0c0c0"/>
              {/* Shell */}
              <circle cx="95" cy="112" r="28" fill="#b8b8b8" stroke="#888" strokeWidth="2"/>
              <circle cx="95" cy="112" r="19" fill="#cacaca" stroke="#999" strokeWidth="1.5"/>
              <circle cx="95" cy="112" r="11" fill="#d8d8d8" stroke="#aaa" strokeWidth="1"/>
              <circle cx="95" cy="112" r="5"  fill="#c8c8c8"/>
              <circle cx="95" cy="112" r="1.5" fill="#aaa"/>
              {/* Shell highlight */}
              <ellipse cx="88" cy="105" rx="5" ry="3" fill="white" opacity=".25" transform="rotate(-30 88 105)"/>
              {/* Antennae */}
              <line x1="86" y1="92" x2="74" y2="70" stroke="#b0b0b0" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="104" y1="90" x2="116" y2="68" stroke="#b0b0b0" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="73" cy="67" r="5" fill="#e040fb" filter="url(#glow)"/>
              <circle cx="117" cy="65" r="5" fill="#e040fb" filter="url(#glow)"/>
              {/* Sparkles */}
              <text x="34" y="88"  fontSize="14" fill="#e040fb" filter="url(#softGlow)" opacity=".9">✦</text>
              <text x="150" y="82" fontSize="11" fill="#e040fb" filter="url(#softGlow)" opacity=".8">✦</text>
              <text x="52"  y="160" fontSize="8" fill="#fff" opacity=".35">✦</text>
              <text x="138" y="155" fontSize="8" fill="#fff" opacity=".35">✦</text>
              {/* Drips */}
              <path d="M78 196 Q79 208 77 216"  stroke="#e040fb" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".75"/>
              <path d="M100 200 Q101 214 99 222" stroke="#e040fb" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".75"/>
              <path d="M122 196 Q123 208 121 216" stroke="#e040fb" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".75"/>
              <ellipse cx="77"  cy="217" rx="3" ry="4" fill="#e040fb" opacity=".5"/>
              <ellipse cx="99"  cy="223" rx="3" ry="4.5" fill="#e040fb" opacity=".5"/>
              <ellipse cx="121" cy="217" rx="3" ry="4" fill="#e040fb" opacity=".5"/>
            </svg>
          </div>

          {/* Wordmark */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 1 }}>
            <span style={{
              fontSize: "clamp(32px,7vw,48px)", fontWeight: 800, letterSpacing: "-0.04em",
              background: "linear-gradient(135deg, #f8b0ff 0%, #e040fb 40%, #9b30ff 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              animation: "shimmer 4s linear infinite",
            }}>Slugify</span>
            <span style={{
              fontSize: "clamp(32px,7vw,48px)", fontWeight: 800, letterSpacing: "-0.04em",
              color: "#e040fb",
              textShadow: "0 0 18px #e040fb, 0 0 40px #e040fbaa",
            }}>.ai</span>
          </div>

          <p style={{ fontSize: 13.5, color: "#7a4a9a", lineHeight: 1.6, textAlign: "center", maxWidth: 420, marginTop: 8 }}>
            Paste a URL or title. 12 marketing legends craft your perfect slug — with emoji &amp; native UTF-8 scripts.
          </p>
        </div>

        {/* Guru bubbles */}
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 8, marginBottom: 28, animation: "fadeUp .5s .1s ease-out both" }}>
          {GURUS.map(g => (
            <div key={g.id} title={g.name} style={{
              width: 34, height: 34, borderRadius: "50%", background: g.color, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: 9, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
              boxShadow: `0 0 10px ${g.color}99`,
            }}>{g.avatar}</div>
          ))}
        </div>

        {/* Input */}
        <div style={{ animation: "fadeUp .5s .16s ease-out both", marginBottom: 28 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6a3a8a", marginBottom: 7, textTransform: "uppercase", letterSpacing: ".1em", fontFamily: "'JetBrains Mono', monospace" }}>
            Content URL or Title
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleGenerate()}
              placeholder="https://yourblog.com/article  or  paste a title"
              style={{
                flex: 1, padding: "13px 16px",
                background: "#140028", border: "1.5px solid #3a1060",
                borderRadius: 10, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                color: "#f0e0ff", transition: "border-color .2s",
              }}
              onFocus={e => e.target.style.borderColor = PINK}
              onBlur={e => e.target.style.borderColor = "#3a1060"}
            />
            <button
              onClick={handleGenerate}
              disabled={!url.trim() || loading}
              style={{
                padding: "13px 20px",
                background: url.trim() && !loading ? `linear-gradient(135deg, ${PINK}, ${PURPLE})` : "#1e0040",
                color: url.trim() && !loading ? "#fff" : "#4a2070",
                border: "none", borderRadius: 10, fontSize: 13.5, fontWeight: 700,
                cursor: url.trim() && !loading ? "pointer" : "default",
                whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif",
                boxShadow: url.trim() && !loading ? `0 0 18px ${PINK}55` : "none",
                transition: "all .2s",
              }}
            >{loading ? "Generating…" : "✦ Get Slugs"}</button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "44px 0", animation: "fadeUp .3s ease-out both" }}>
            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 7, maxWidth: 280, margin: "0 auto 14px" }}>
              {GURUS.map((g, i) => (
                <div key={g.id} style={{ width: 9, height: 9, borderRadius: "50%", background: g.color, animation: `pulse 1.4s ease-in-out ${i * 0.1}s infinite`, boxShadow: `0 0 5px ${g.color}` }} />
              ))}
            </div>
            <p style={{ fontSize: 13, color: "#6a3a8a", marginTop: 4 }}>12 gurus are crafting your slugs…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: "#200010", border: "1px solid #800", borderRadius: 10, padding: "13px 16px", color: "#ff7070", fontSize: 13.5, marginBottom: 20 }}>{error}</div>
        )}

        {/* Results */}
        {results && (
          <div style={{ animation: "fadeUp .4s ease-out both" }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: "#4a2070", textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>
              ✦ 12 Slug Suggestions
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {results.map((r, i) => {
                const encoded = encodeSlug(r.slug);
                const nonLatin = hasNonLatin(r.slug);
                const hasEmoji = /\p{Emoji}/u.test(r.slug);
                return (
                  <div key={i}
                    style={{ border: "1.5px solid #220045", borderRadius: 12, padding: "13px 15px", background: "#100022", transition: "border-color .2s, box-shadow .2s", animation: `fadeUp .4s ${i * 0.04}s ease-out both` }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = r.color; e.currentTarget.style.boxShadow = `0 0 18px ${r.color}44`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#220045"; e.currentTarget.style.boxShadow = "none"; }}
                  >
                    {/* Top row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 9 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: r.color, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9.5, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", boxShadow: `0 0 12px ${r.color}99` }}>
                        {r.avatar}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#f0e0ff" }}>{r.guru}</div>
                        <div style={{ fontSize: 10.5, color: "#5a3080", display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
                          {GURUS.find(g => g.name === r.guru)?.specialty}
                          {hasEmoji && <span style={{ color: PINK, fontFamily: "'JetBrains Mono', monospace", fontSize: 9 }}>😀 emoji</span>}
                          {nonLatin && <span style={{ color: "#a040fb", fontFamily: "'JetBrains Mono', monospace", fontSize: 9 }}>✦ utf-8</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopy(r.slug)}
                        style={{ flexShrink: 0, padding: "5px 13px", borderRadius: 7, border: `1.5px solid ${copied === r.slug ? r.color : "#3a1060"}`, background: copied === r.slug ? r.color : "transparent", color: copied === r.slug ? "#fff" : "#7a4a9a", fontSize: 11.5, fontWeight: 600, cursor: "pointer", transition: "all .2s", fontFamily: "'DM Sans', sans-serif", boxShadow: copied === r.slug ? `0 0 10px ${r.color}88` : "none" }}
                      >{copied === r.slug ? "Copied!" : "Copy"}</button>
                    </div>

                    {/* Slug */}
                    <div style={{ background: "#0a0018", borderRadius: 8, padding: "9px 13px", fontFamily: "'JetBrains Mono', monospace", border: "1px solid #220045" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: nonLatin ? PINK : "#c89fff", wordBreak: "break-all", marginBottom: nonLatin ? 3 : 0, lineHeight: 1.5 }}>
                        /{r.slug}
                      </div>
                      {nonLatin && (
                        <div style={{ fontSize: 10.5, color: "#4a2070", wordBreak: "break-all", lineHeight: 1.4 }}>
                          /{encoded}
                        </div>
                      )}
                    </div>

                    <div style={{ fontSize: 12, color: "#6a3a8a", lineHeight: 1.55, marginTop: 7 }}>{r.rationale}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: "center", marginTop: 28 }}>
              <button
                onClick={() => { setResults(null); setUrl(""); }}
                style={{ background: "none", border: "1px solid #3a1060", color: PINK, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", padding: "8px 22px", borderRadius: 20, transition: "all .2s" }}
                onMouseEnter={e => { e.currentTarget.style.background = "#1a0030"; e.currentTarget.style.boxShadow = `0 0 14px ${PINK}44`; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.boxShadow = "none"; }}
              >← Try another URL</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}