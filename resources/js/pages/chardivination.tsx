import { useState } from "react";

// ===================== TYPE DEFINITIONS =====================
interface DivinationResult {
  analysis: string;
  luck: string;
  caution: string;
  tip: string;
  inp: number;
  out: number;
}

interface CostBreakdown {
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

interface AgentPricing {
  input: number;
  output: number;
  label: string;
}

type AgentId = 'openai' | 'deepseek' | 'gemini' | 'perplexity';

// ===================== CONSTANTS =====================
const THEMES = [
  { id: "finance", label: "💰 今日財運", value: "今日財運" },
  { id: "travel", label: "🗺️ 出行計畫", value: "出行計畫" },
  { id: "career", label: "🏢 職場適應", value: "職場適應" },
  { id: "family", label: "🏡 家庭和諧", value: "家庭和諧" },
  { id: "direction", label: "🌟 努力方向", value: "努力方向" },
];

const AGENTS: { id: AgentId; label: string; icon: string }[] = [
  { id: "openai", label: "OpenAI", icon: "💠" },
  { id: "deepseek", label: "DeepSeek", icon: "🌀" },
  { id: "gemini", label: "Gemini 3 Flash", icon: "⭐" },
  { id: "perplexity", label: "Perplexity", icon: "🌊" },
];

const PRICING: Record<AgentId, AgentPricing> = {
  openai: { input: 0.15, output: 0.60, label: "GPT-4o mini · $0.15/$0.60 per 1M" },
  deepseek: { input: 0.14, output: 0.28, label: "DeepSeek Chat · $0.14/$0.28 per 1M" },
  gemini: { input: 0.075, output: 0.30, label: "Gemini 3 Flash Preview · $0.075/$0.30 per 1M" },
  perplexity: { input: 1.00, output: 5.00, label: "Sonar Pro · $1/$5 per 1M" },
};

// ===================== API KEYS (from env) =====================
// Note: In production, these should be stored in .env and accessed via import.meta.env
const API_KEYS = {
  openai: "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",
  deepseek: "sk-afe92e6a35f044df91c343fd8598147d",
  gemini: "AIzaSyDo9uPn9NdXq3xVkTS7IAgIiVwPDVESYt0",
  perplexity: "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",
};

// ===================== HELPER FUNCTIONS =====================
const formatUSD = (value: number): string => {
  if (value === 0) return "$0.00000";
  if (value < 0.000001) return "$" + value.toExponential(4);
  if (value < 0.0001) return "$" + value.toFixed(7);
  if (value < 0.01) return "$" + value.toFixed(6);
  return "$" + value.toFixed(5);
};

const buildPrompt = (character: string, theme: string): string => {
  const today = new Date().toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
  
  return `你是一位精通中國漢字拆字占卜的智慧占卜師，融合傳統拆字術、字形學與五行哲學。
今日日期：${today}
占問主題：${theme}
用戶輸入的字：${character}

請以繁體中文回答，只回傳以下JSON格式，不含任何JSON以外的文字或markdown：
{
  "analysis": "對「${character}」拆字解析，分析部首、筆畫、字形結構及字義，約100字",
  "luck": "針對「${theme}」主題，給出正面指引與吉象，約80字",
  "caution": "針對「${theme}」主題，給出需留意或避免的事項，約80字",
  "tip": "一句精簡有力的今日錦言，30字以內"
}`;
};

// Robust JSON parser for handling malformed API responses
const cleanAndParseJSON = (rawText: string): any => {
  let cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  
  if (!cleaned.startsWith("{")) {
    const firstBrace = cleaned.indexOf("{");
    if (firstBrace !== -1) cleaned = cleaned.substring(firstBrace);
  }
  if (!cleaned.endsWith("}")) {
    const lastBrace = cleaned.lastIndexOf("}");
    if (lastBrace !== -1) cleaned = cleaned.substring(0, lastBrace + 1);
  }
  
  try {
    return JSON.parse(cleaned);
  } catch (firstErr) {
    const fieldFix = cleaned.replace(/(?<=: ")(.*?)(?=",|"})/gs, (match) => {
      return match.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r");
    });
    try {
      return JSON.parse(fieldFix);
    } catch (secondErr) {
      const extractField = (key: string) => {
        const regex = new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, "s");
        const match = cleaned.match(regex);
        if (match) return match[1].replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
        return "";
      };
      return {
        analysis: extractField("analysis") || "字形解析無法取得，請重新占卜。",
        luck: extractField("luck") || "暫無指引。",
        caution: extractField("caution") || "請留意內在平衡。",
        tip: extractField("tip") || "靜心觀照。",
      };
    }
  }
};

// ===================== API CALLS =====================
const callOpenAI = async (character: string, theme: string): Promise<DivinationResult> => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEYS.openai}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: buildPrompt(character, theme) }],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 800,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error?.message || `OpenAI HTTP ${response.status}`);
  }
  
  const data = await response.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  const usage = data.usage || { prompt_tokens: 80, completion_tokens: 200 };
  
  return {
    analysis: parsed.analysis,
    luck: parsed.luck,
    caution: parsed.caution,
    tip: parsed.tip,
    inp: usage.prompt_tokens,
    out: usage.completion_tokens,
  };
};

const callDeepSeek = async (character: string, theme: string): Promise<DivinationResult> => {
  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEYS.deepseek}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: buildPrompt(character, theme) }],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 800,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error?.message || `DeepSeek HTTP ${response.status}`);
  }
  
  const data = await response.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  const usage = data.usage || { prompt_tokens: 80, completion_tokens: 200 };
  
  return {
    analysis: parsed.analysis,
    luck: parsed.luck,
    caution: parsed.caution,
    tip: parsed.tip,
    inp: usage.prompt_tokens,
    out: usage.completion_tokens,
  };
};

const callGemini = async (character: string, theme: string): Promise<DivinationResult> => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEYS.gemini}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(character, theme) }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        responseMimeType: "application/json",
      },
    }),
  });
  
  if (!response.ok) {
    let errDetail = `Gemini API HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      errDetail = errJson.error?.message || errDetail;
    } catch (e) {}
    throw new Error(`Gemini 錯誤: ${errDetail}`);
  }
  
  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!rawText) throw new Error("Gemini 未回覆有效內容");
  
  const parsed = cleanAndParseJSON(rawText);
  const usage = data.usageMetadata || {};
  
  return {
    analysis: parsed.analysis || `「${character}」字形蘊含深厚底蘊，待你靜心感悟。`,
    luck: parsed.luck || "順勢而為，心誠則靈。",
    caution: parsed.caution || "避免急躁，傾聽內在聲音。",
    tip: parsed.tip || "一念之間，萬般自在。",
    inp: usage.promptTokenCount ?? 150,
    out: usage.candidatesTokenCount ?? 280,
  };
};

const callPerplexity = async (character: string, theme: string): Promise<DivinationResult> => {
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEYS.perplexity}`,
    },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [{ role: "user", content: buildPrompt(character, theme) + " 只回傳JSON，不含任何其他文字。" }],
      max_tokens: 800,
      temperature: 0.7,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error?.message || `Perplexity HTTP ${response.status}`);
  }
  
  const data = await response.json();
  const rawText = data.choices[0].message.content;
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Perplexity JSON 解析失敗");
  
  const parsed = JSON.parse(jsonMatch[0]);
  const usage = data.usage || { prompt_tokens: 80, completion_tokens: 200 };
  
  return {
    analysis: parsed.analysis,
    luck: parsed.luck,
    caution: parsed.caution,
    tip: parsed.tip,
    inp: usage.prompt_tokens,
    out: usage.completion_tokens,
  };
};

// ===================== MAIN COMPONENT =====================
export default function RemixedSlug() {
  const [character, setCharacter] = useState("");
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0].value);
  const [selectedAgent, setSelectedAgent] = useState<AgentId>("openai");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DivinationResult | null>(null);
  const [cost, setCost] = useState<CostBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateCost = (agent: AgentId, inputTokens: number, outputTokens: number): CostBreakdown => {
    const pricing = PRICING[agent];
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    return {
      inputTokens,
      outputTokens,
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
    };
  };

  const handleDivination = async () => {
    if (!character.trim()) {
      setError("請先輸入一個中文字");
      return;
    }
    if (!/[\u4e00-\u9fff]/.test(character)) {
      setError("請輸入一個有效的中文漢字");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setCost(null);

    try {
      let apiResult: DivinationResult;
      switch (selectedAgent) {
        case "openai":
          apiResult = await callOpenAI(character, selectedTheme);
          break;
        case "deepseek":
          apiResult = await callDeepSeek(character, selectedTheme);
          break;
        case "gemini":
          apiResult = await callGemini(character, selectedTheme);
          break;
        case "perplexity":
          apiResult = await callPerplexity(character, selectedTheme);
          break;
        default:
          throw new Error("未知的 AI 引擎");
      }
      
      setResult(apiResult);
      setCost(calculateCost(selectedAgent, apiResult.inp, apiResult.out));
    } catch (err) {
      console.error("占卜錯誤:", err);
      setError(err instanceof Error ? err.message : "連線異常，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleDivination();
  };

  const handleCharacterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Keep only Chinese characters, max 1
    const chineseChars = value.split("").filter(c => /[\u4e00-\u9fff]/.test(c));
    if (chineseChars.length > 0) {
      setCharacter(chineseChars[0]);
    } else {
      setCharacter("");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at 15% 20%, #0d0718, #02010c 70%)",
      fontFamily: "'PingFang TC', 'Microsoft JhengHei', system-ui, sans-serif",
      padding: "1.5rem",
    }}>
      <div style={{
        maxWidth: 880,
        width: "100%",
        margin: "0 auto",
        background: "rgba(12, 9, 28, 0.88)",
        backdropFilter: "blur(16px)",
        borderRadius: "2.5rem",
        border: "1px solid rgba(200, 160, 255, 0.4)",
        padding: "2rem 1.8rem",
        boxShadow: "0 25px 50px -10px #000",
      }}>
        {/* Header */}
        <h1 style={{
          fontSize: "2rem",
          textAlign: "center",
          letterSpacing: "4px",
          background: "linear-gradient(120deg, #f5eaff, #d4aaff, #b47eff)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}>
          🔮 拆字占卜
        </h1>
        <div style={{
          textAlign: "center",
          color: "#bbaee6",
          fontSize: "0.78rem",
          margin: "0.4rem 0 1.6rem",
          letterSpacing: "2px",
        }}>
          以字問天・以形解命・多元AI智慧解讀
        </div>

        {/* Theme Selection Cards */}
        <div style={{ textAlign: "center", fontSize: "0.7rem", letterSpacing: "2px", color: "#a092d8", marginBottom: "0.8rem" }}>
          ✦ 選擇占問主題 ✦
        </div>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          justifyContent: "center",
          marginBottom: "1.4rem",
        }}>
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setSelectedTheme(theme.value)}
              style={{
                width: 108,
                height: 96,
                borderRadius: "1.2rem",
                border: selectedTheme === theme.value ? "1.5px solid #c49eff" : "1.5px solid #5a48a0",
                background: selectedTheme === theme.value
                  ? "linear-gradient(145deg, #4a35a0, #7555ea)"
                  : "linear-gradient(145deg, #1a1538, #0e0c24)",
                color: selectedTheme === theme.value ? "#fff" : "#cdbcff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "inherit",
                boxShadow: selectedTheme === theme.value ? "0 0 20px rgba(180, 126, 255, 0.6)" : "none",
              }}
              onMouseEnter={(e) => {
                if (selectedTheme !== theme.value) {
                  e.currentTarget.style.transform = "translateY(-4px) scale(1.04)";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(160, 100, 255, 0.35)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                if (selectedTheme !== theme.value) e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: "1.5rem", marginBottom: "4px" }}>{theme.label.split(" ")[0]}</div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, letterSpacing: "2px" }}>{theme.label.split(" ")[1]}</div>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "1.2rem",
          color: "#6a5898",
          fontSize: "0.8rem",
        }}>
          <div style={{ flex: 1, height: "1px", background: "rgba(100, 80, 160, 0.4)" }}></div>
          <span>— 輸入你心中浮現的一個中文字 —</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(100, 80, 160, 0.4)" }}></div>
        </div>

        {/* Character Input */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "1.2rem" }}>
          <input
            type="text"
            value={character}
            onChange={handleCharacterChange}
            onKeyPress={handleKeyPress}
            placeholder="字"
            maxLength={1}
            style={{
              flex: 2,
              padding: "0.9rem 1.2rem",
              borderRadius: "60px",
              border: character ? "1.5px solid #c49eff" : "1px solid #6a4fbf",
              background: "#0e0c24",
              color: "#fff",
              fontSize: "1.8rem",
              textAlign: "center",
              fontFamily: "inherit",
              outline: "none",
              letterSpacing: "6px",
              transition: "all 0.2s",
              boxShadow: character ? "0 0 14px rgba(180, 126, 255, 0.4)" : "none",
            }}
          />
          <button
            onClick={handleDivination}
            disabled={loading || !character}
            style={{
              background: "linear-gradient(95deg, #755aea, #a47eff)",
              border: "none",
              padding: "0 1.6rem",
              borderRadius: "60px",
              fontWeight: 700,
              color: "#fff",
              cursor: loading || !character ? "not-allowed" : "pointer",
              fontSize: "1rem",
              fontFamily: "inherit",
              transition: "transform 0.1s, opacity 0.2s",
              letterSpacing: "2px",
              opacity: loading || !character ? 0.5 : 1,
            }}
          >
            ✨ 開始占卜
          </button>
        </div>

        {/* Agent Selection */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "1.5rem",
          justifyContent: "center",
        }}>
          {AGENTS.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              style={{
                background: selectedAgent === agent.id ? "linear-gradient(95deg, #755aea, #a47eff)" : "#1a1538",
                border: selectedAgent === agent.id ? "1px solid #c49eff" : "1px solid #5a48a0",
                padding: "0.45rem 1rem",
                borderRadius: "40px",
                color: selectedAgent === agent.id ? "#fff" : "#cdbcff",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.83rem",
                transition: "0.2s",
                fontFamily: "inherit",
                boxShadow: selectedAgent === agent.id ? "0 0 8px #a47eff" : "none",
              }}
              onMouseEnter={(e) => {
                if (selectedAgent !== agent.id) {
                  e.currentTarget.style.background = "#3a2e6e";
                  e.currentTarget.style.transform = "scale(0.97)";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedAgent !== agent.id) {
                  e.currentTarget.style.background = "#1a1538";
                  e.currentTarget.style.transform = "none";
                }
              }}
            >
              {agent.icon} {agent.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div style={{
            background: "rgba(0, 0, 0, 0.45)",
            borderRadius: "1.5rem",
            padding: "2rem",
            textAlign: "center",
          }}>
            <div style={{
              display: "inline-block",
              width: "40px",
              height: "40px",
              border: "3px solid rgba(180, 140, 255, 0.3)",
              borderTopColor: "#b47eff",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
            <p style={{ color: "#bbaee6", marginTop: "1rem" }}>
              🔮 正在解析「{character}」的字形結構...
            </p>
            <p style={{ color: "#8a6ebb", fontSize: "0.85rem", marginTop: "0.5rem" }}>
              {selectedAgent === "gemini" ? "✨ Gemini 正在閱讀字中玄機…" : 
               selectedAgent === "perplexity" ? "🌊 Perplexity 正在解讀天地之間的訊息…" :
               selectedAgent === "deepseek" ? "🌀 DeepSeek 正在洞悉字形奧秘…" :
               "💠 OpenAI 正在分析字形結構…"}
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{
            background: "rgba(255, 107, 107, 0.15)",
            border: "1px solid #ff6b6b",
            borderRadius: "1rem",
            padding: "1rem",
            color: "#ff8a8a",
            fontSize: "0.85rem",
            marginBottom: "1rem",
          }}>
            <strong>⚠️ 錯誤：</strong> {error}
          </div>
        )}

        {/* Result Display */}
        {result && !loading && (
          <div style={{
            background: "rgba(0, 0, 0, 0.45)",
            borderRadius: "1.5rem",
            marginTop: "1.5rem",
            padding: "1.2rem",
            borderLeft: "6px solid #b87eff",
          }}>
            {/* Analysis Section */}
            <div style={{
              borderRadius: "1.2rem",
              padding: "0.9rem 1rem",
              marginBottom: "0.8rem",
              background: "rgba(180, 126, 255, 0.1)",
            }}>
              <div style={{
                fontSize: "0.68rem",
                textTransform: "uppercase",
                letterSpacing: "2px",
                fontWeight: 700,
                color: "#ddccff",
                marginBottom: "6px",
              }}>📖 字形解析</div>
              <div style={{ color: "#f5edff", lineHeight: 1.65, fontSize: "0.92rem" }}>
                <strong>「{character}」字形解析</strong><br />
                {result.analysis}
              </div>
            </div>

            {/* Luck Section */}
            <div style={{
              borderRadius: "1.2rem",
              padding: "0.9rem 1rem",
              marginBottom: "0.8rem",
              background: "rgba(100, 200, 130, 0.08)",
            }}>
              <div style={{
                fontSize: "0.68rem",
                textTransform: "uppercase",
                letterSpacing: "2px",
                fontWeight: 700,
                color: "#ddccff",
                marginBottom: "6px",
              }}>✨ 吉象指引</div>
              <div style={{ color: "#f5edff", lineHeight: 1.65, fontSize: "0.92rem" }}>{result.luck}</div>
            </div>

            {/* Caution Section */}
            <div style={{
              borderRadius: "1.2rem",
              padding: "0.9rem 1rem",
              marginBottom: "0.8rem",
              background: "rgba(255, 110, 110, 0.1)",
            }}>
              <div style={{
                fontSize: "0.68rem",
                textTransform: "uppercase",
                letterSpacing: "2px",
                fontWeight: 700,
                color: "#ddccff",
                marginBottom: "6px",
              }}>⚠️ 留意事項</div>
              <div style={{ color: "#f5edff", lineHeight: 1.65, fontSize: "0.92rem" }}>{result.caution}</div>
            </div>

            {/* Tip Section */}
            <div style={{
              borderRadius: "1.2rem",
              padding: "0.9rem 1rem",
              marginBottom: "0.8rem",
              background: "rgba(210, 180, 255, 0.08)",
              fontStyle: "italic",
            }}>
              <div style={{
                fontSize: "0.68rem",
                textTransform: "uppercase",
                letterSpacing: "2px",
                fontWeight: 700,
                color: "#ddccff",
                marginBottom: "6px",
              }}>💫 今日錦言</div>
              <div style={{ color: "#f5edff", lineHeight: 1.65, fontSize: "0.92rem" }}>💫 {result.tip}</div>
            </div>

            {/* Cost Panel */}
            {cost && (
              <div style={{
                background: "rgba(0, 0, 0, 0.65)",
                borderRadius: "1rem",
                padding: "1rem",
                marginTop: "1rem",
                border: "1px solid rgba(120, 80, 200, 0.4)",
                fontFamily: "'SF Mono', 'Fira Code', monospace",
              }}>
                <div style={{
                  fontSize: "0.72rem",
                  letterSpacing: "1px",
                  color: "#cbbaff",
                  marginBottom: "0.75rem",
                  borderLeft: "3px solid #b87eff",
                  paddingLeft: "8px",
                }}>💰 詞元耗用與費用明細（即時 API 回傳）</div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",
                  gap: "0.6rem",
                }}>
                  <div style={{
                    background: "rgba(30, 20, 55, 0.6)",
                    padding: "0.5rem 0.7rem",
                    borderRadius: "0.8rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    fontSize: "0.78rem",
                  }}>
                    <span style={{ color: "#b7a5f0", fontWeight: 500 }}>📥 輸入詞元</span>
                    <span style={{ color: "#e2d9ff", fontWeight: 600 }}>{cost.inputTokens.toLocaleString()}</span>
                  </div>
                  <div style={{
                    background: "rgba(30, 20, 55, 0.6)",
                    padding: "0.5rem 0.7rem",
                    borderRadius: "0.8rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    fontSize: "0.78rem",
                  }}>
                    <span style={{ color: "#b7a5f0", fontWeight: 500 }}>📤 輸出詞元</span>
                    <span style={{ color: "#e2d9ff", fontWeight: 600 }}>{cost.outputTokens.toLocaleString()}</span>
                  </div>
                  <div style={{
                    background: "rgba(30, 20, 55, 0.6)",
                    padding: "0.5rem 0.7rem",
                    borderRadius: "0.8rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    fontSize: "0.78rem",
                  }}>
                    <span style={{ color: "#b7a5f0", fontWeight: 500 }}>⚡ 輸入費用</span>
                    <span style={{ color: "#e2d9ff", fontWeight: 600 }}>{formatUSD(cost.inputCost)}</span>
                  </div>
                  <div style={{
                    background: "rgba(30, 20, 55, 0.6)",
                    padding: "0.5rem 0.7rem",
                    borderRadius: "0.8rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    fontSize: "0.78rem",
                  }}>
                    <span style={{ color: "#b7a5f0", fontWeight: 500 }}>✨ 輸出費用</span>
                    <span style={{ color: "#e2d9ff", fontWeight: 600 }}>{formatUSD(cost.outputCost)}</span>
                  </div>
                </div>
                <div style={{
                  background: "linear-gradient(95deg, #3a2d6e, #2a1f55)",
                  padding: "0.5rem 0.7rem",
                  borderRadius: "0.8rem",
                  marginTop: "6px",
                  borderLeft: "3px solid #ffdf8c",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  fontSize: "0.78rem",
                }}>
                  <span style={{ color: "#b7a5f0", fontWeight: 500 }}>💎 本次總費用 (USD)</span>
                  <span style={{ color: "#e2d9ff", fontWeight: 600 }}>{formatUSD(cost.totalCost)}</span>
                </div>
                <div style={{
                  background: "rgba(255, 220, 100, 0.1)",
                  borderRadius: "12px",
                  padding: "5px 12px",
                  fontSize: "0.7rem",
                  textAlign: "center",
                  marginTop: "8px",
                  color: "#ffe1a0",
                }}>
                  🤖 AI引擎：<strong>{PRICING[selectedAgent].label}</strong> · 費率依每百萬詞元計算
                </div>
              </div>
            )}
          </div>
        )}

        <hr style={{ margin: "1rem 0", borderColor: "#2a2350" }} />

        {/* Disclaimer */}
        <div style={{
          marginTop: "1.8rem",
          padding: "1rem 1.2rem",
          background: "rgba(255, 200, 80, 0.07)",
          border: "1px solid rgba(255, 200, 80, 0.25)",
          borderRadius: "1rem",
          fontSize: "0.72rem",
          color: "#c8b880",
          lineHeight: 1.8,
          textAlign: "center",
          letterSpacing: "0.5px",
        }}>
          <strong>⚠️ 娛樂性質聲明</strong><br />
          本占卜工具純屬娛樂參考，所有解讀均由人工智慧依據漢字結構與文化意涵生成，<br />
          <strong>不構成任何財務、醫療、法律或人生決策之建議。</strong><br />
          請以理性判斷為主，切勿因占卜結果影響重大決定。如有心理困擾，請尋求專業協助。
        </div>

        <div style={{
          textAlign: "center",
          fontSize: "0.68rem",
          color: "#6a5898",
          marginTop: "0.8rem",
          letterSpacing: "1px",
        }}>
          ✦ 拆字問天 · 字字有緣 · 僅供娛樂 ✦
        </div>
      </div>

      {/* Keyframes animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}