import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSpinner, 
    faTimes, 
    faChevronLeft, 
    faChevronRight,
    faTrashAlt,
    faHistory,
    faStar,
    faFire,
    faMagic,
    faArrowRight,
    faBug
} from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

// Types
type PunResult = {
    pun: string;
    original: string;
    emoji: string;
    homophones: string;
    explanation: string;
};

type HistoryEntry = {
    id: number;
    keyword: string;
    time: string;
};

type HistoryData = {
    [dateStr: string]: HistoryEntry[];
};

// Constants
// FIX: Removed response_format requirement from prompt - just ask for clean JSON
const SYSTEM_PROMPT = `你是一位精通中英文雙關語的語言創意大師，專門設計「同音不同義」的諧音梗成語。

核心規則：每個成語必須有至少一個字，與原成語中對應的字「同音（或近音）但字不同、義不同」，形成真正的諧音雙關。

用戶輸入中文或英文詞語，產生「正好四個」創意幽默的四字諧音成語，每個須：
1. 諧音自真實中文成語（標明原成語）
2. 改換 1～2 字為同音近音但字義不同的字，且與輸入主題相關
3. 標出諧音梗（原字→換字，注音）
4. 一句幽默解釋，點出雙關妙處

請只回傳以下 JSON 格式，不要任何前言或 markdown 代碼塊：
[
  {"pun":"四字諧音成語","original":"原成語","emoji":"emoji","homophones":"諧音說明，例如：甘→咖（ㄍㄚ）","explanation":"幽默解釋"},
  {"pun":"...","original":"...","emoji":"...","homophones":"...","explanation":"..."},
  {"pun":"...","original":"...","emoji":"...","homophones":"...","explanation":"..."},
  {"pun":"...","original":"...","emoji":"...","homophones":"...","explanation":"..."}
]`;

const EXAMPLES = ["咖啡", "ChatGPT", "減肥", "台灣", "程式設計", "愛情"];
const COLORS = [
  { bg: "#fff0f6", border: "#f9a8d4", text: "#9d174d", badge: "#fce7f3", badgeText: "#be185d" },
  { bg: "#eff6ff", border: "#93c5fd", text: "#1e40af", badge: "#dbeafe", badgeText: "#1d4ed8" },
  { bg: "#f0fdf4", border: "#86efac", text: "#166534", badge: "#dcfce7", badgeText: "#15803d" },
  { bg: "#fffbeb", border: "#fcd34d", text: "#92400e", badge: "#fef3c7", badgeText: "#b45309" },
];
const RANK_LABELS = ["🥇", "🥈", "🥉", "4️⃣"];
const STORAGE_KEY = "pun_hist";
const SECRET = "0329";
const KIMI_API_KEY = "sk-6WgIud23PdYluNxmJp6laFlAuBCE0hfsX4PJvtBXuGcoiapI";
const KIMI_API_URL = "https://api.moonshot.ai/v1/chat/completions";
const KIMI_MODEL = "kimi-k3";

// Helper functions
const tz = { timeZone: "Asia/Taipei" };

function taipeiDateStr(ts: number): string {
  return new Date(ts).toLocaleDateString("zh-TW", { 
    ...tz, 
    year: "numeric", 
    month: "2-digit", 
    day: "2-digit" 
  }).replace(/\//g, "-");
}

function taipeiTimeStr(ts: number): string {
  return new Date(ts).toLocaleTimeString("zh-TW", { 
    ...tz, 
    hour: "2-digit", 
    minute: "2-digit", 
    second: "2-digit", 
    hour12: false 
  });
}

function taipeiHour(ts: number): string {
  return new Date(ts).toLocaleTimeString("zh-TW", { 
    ...tz, 
    hour: "2-digit", 
    hour12: false 
  }).slice(0, 2);
}

function dateLabel(dateStr: string): string {
  const today = taipeiDateStr(Date.now());
  if (dateStr === today) return "今天";
  if (dateStr === taipeiDateStr(Date.now() - 86400000)) return "昨天";
  const [, m, d] = dateStr.split("-");
  return `${m}/${d}`;
}

function groupByHour(entries: HistoryEntry[]): { [hour: string]: HistoryEntry[] } {
  const map: { [hour: string]: HistoryEntry[] } = {};
  entries.forEach(e => {
    const h = taipeiHour(e.id);
    if (!map[h]) map[h] = [];
    map[h].push(e);
  });
  return map;
}

async function storageGet(key: string): Promise<any> {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

async function storageSet(key: string, val: any): Promise<void> {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

// Password Modal Component
const PasswordModal = ({ 
  title, 
  onConfirm, 
  onCancel,
  tooltips 
}: { 
  title: string; 
  onConfirm: () => void; 
  onCancel: () => void;
  tooltips?: any;
}) => {
  const [password, setPassword] = useState("");
  const [shake, setShake] = useState(false);
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSubmit = () => {
    if (password === SECRET) {
      onConfirm();
    } else {
      setShake(true);
      setError(true);
      setPassword("");
      setTimeout(() => setShake(false), 420);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
      <div className="bg-[#235A72] border border-[#3a7a94] text-white p-6 rounded-lg shadow-lg w-80">
        <div className="text-center mb-4">
          <FontAwesomeIcon icon={faTrashAlt} className="text-red-400 text-2xl mb-2" />
          <h3 className="text-lg font-bold">刪除驗證</h3>
          <p className="text-sm text-[#a8d0e6] mt-1">{title}</p>
        </div>

        <input
          ref={inputRef}
          type="password"
          value={password}
          maxLength={8}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="輸入密碼"
          className={`w-full bg-gray-700 text-white py-2 px-4 rounded-md border focus:outline-none focus:ring-2 focus:ring-yellow-400 text-center tracking-widest ${
            error ? 'border-red-500' : 'border-gray-600'
          }`}
          style={{ animation: shake ? 'shake 0.4s ease' : 'none' }}
        />

        {error && (
          <p className="text-red-400 text-xs mt-2 text-center">密碼錯誤，請再試</p>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-600 text-white py-2 rounded-md hover:bg-gray-500 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            確認刪除
          </button>
        </div>

        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25%, 75% { transform: translateX(-6px); }
            50% { transform: translateX(6px); }
          }
        `}</style>
      </div>
    </div>
  );
};

// Delete Button Component
const DeleteButton = ({ 
  label, 
  onClick,
  tooltips 
}: { 
  label: string; 
  onClick: () => void;
  tooltips?: any;
}) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    className="text-xs px-2 py-0.5 rounded-md border border-red-500/50 bg-transparent text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer opacity-75 hover:opacity-100"
  >
    {label}
  </button>
);

export default function PunGenerator() {
  const { tooltips } = usePage<{ tooltips?: any }>().props || {};

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PunResult[] | null>(null);
  const [error, setError] = useState("");
  const [lastInput, setLastInput] = useState("");
  const [rankOrder, setRankOrder] = useState<number[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const [history, setHistory] = useState<HistoryData>({});
  const [storageReady, setStorageReady] = useState(false);
  const [expandedDays, setExpandedDays] = useState<{ [key: string]: boolean }>({});
  const [expandedHours, setExpandedHours] = useState<{ [key: string]: boolean }>({});
  const [modal, setModal] = useState<{ title: string; onConfirm: () => void } | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  // FIX: Added debug mode to see raw API responses
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");

  // Load from localStorage on mount
  useEffect(() => {
    storageGet(STORAGE_KEY).then(data => {
      if (data && typeof data === "object") setHistory(data);
      setStorageReady(true);
      const today = taipeiDateStr(Date.now());
      if (data?.[today]) setExpandedDays(prev => ({ ...prev, [today]: true }));
    });
  }, []);

  // Save whenever history changes
  useEffect(() => {
    if (storageReady) storageSet(STORAGE_KEY, history);
  }, [history, storageReady]);

  const addEntry = useCallback((keyword: string) => {
    const now = Date.now();
    const dateStr = taipeiDateStr(now);
    const entry: HistoryEntry = { id: now, keyword, time: taipeiTimeStr(now) };
    setHistory(prev => ({ 
      ...prev, 
      [dateStr]: [entry, ...(prev[dateStr] || [])] 
    }));
    setExpandedDays(prev => ({ ...prev, [dateStr]: true }));
  }, []);

  const generatePuns = async (text: string) => {
    const val = (text || input).trim();
    if (!val) return;

    setLoading(true);
    setError("");
    setResults(null);
    setRankOrder([]);
    setLastInput(val);
    setErrorMessage("");
    setDebugInfo("");

    try {
      // FIX: Build request body without response_format
      // FIX: Use temperature 0.6 for non-thinking mode (per Moonshot docs)
      // FIX: Add thinking disabled to prevent empty content
      const requestBody = {
        model: KIMI_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: val }
        ],
        max_tokens: 4096,
        temperature: 0.6,
        top_p: 0.95,
        // FIX: Disable thinking mode to ensure content is generated
        thinking: { type: "disabled" }
      };

      if (debugMode) {
        setDebugInfo(`Request: ${JSON.stringify(requestBody, null, 2)}\n\n`);
      }

      const response = await fetch(KIMI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${KIMI_API_KEY}`
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (debugMode) {
        setDebugInfo(prev => prev + `Response Status: ${response.status}\nResponse Body: ${JSON.stringify(data, null, 2)}\n\n`);
      }

      if (!response.ok) {
        throw new Error(data.error?.message || `API request failed: ${response.status}`);
      }

      // ROBUST RESPONSE PARSING
      const choice = data.choices?.[0];
      if (!choice) {
        throw new Error("API returned no choices in response");
      }

      // Handle both streaming (delta) and non-streaming (message) formats
      const rawContent = choice.message?.content || choice.delta?.content || "";

      // FIX: Check for reasoning_content if content is empty (K2.5 thinking mode)
      if (!rawContent || rawContent.trim().length === 0) {
        const reasoningContent = choice.message?.reasoning_content || choice.message?.reasoning || "";
        if (reasoningContent) {
          console.error("Model returned reasoning content instead of content:", reasoningContent);
          if (debugMode) {
            setDebugInfo(prev => prev + `⚠️ Reasoning Content (not used): ${reasoningContent.substring(0, 500)}...\n\n`);
          }
        }

        // Try to extract from refusal or other fields
        const refusal = choice.message?.refusal;
        if (refusal) {
          throw new Error(`Model refused: ${refusal}`);
        }

        throw new Error("API returned empty content. Try disabling thinking mode or increasing max_tokens.");
      }

      if (debugMode) {
        setDebugInfo(prev => prev + `Raw Content: ${rawContent}\n\n`);
      }

      // Log raw response for debugging
      console.log("Raw API response:", rawContent);

      let parsed: PunResult[];

      try {
        // Try direct parse first
        parsed = JSON.parse(rawContent);
      } catch (directErr) {
        // Fallback 1: Clean markdown fences and try again
        let cleanJson = rawContent
          .replace(/```json\s*/gi, "")
          .replace(/```\s*/gi, "")
          .trim();

        // Fallback 2: Extract JSON array from surrounding text if still not valid
        if (!cleanJson.startsWith("[")) {
          const arrayMatch = cleanJson.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            cleanJson = arrayMatch[0];
          }
        }

        if (cleanJson.length === 0) {
          throw new Error("Content was empty after cleaning markdown");
        }

        try {
          parsed = JSON.parse(cleanJson);
        } catch (cleanErr) {
          throw new Error(`Failed to parse JSON: ${(cleanErr as Error).message}`);
        }
      }

      // Validate it's an array
      if (!Array.isArray(parsed)) {
        throw new Error("API response is not a JSON array");
      }

      if (parsed.length !== 4) {
        console.warn(`Expected 4 puns, got ${parsed.length}`);
      }

      setResults(parsed);
      addEntry(val);
      setSuccessMessage("生成成功！");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("Generation error:", err);
      setErrorMessage(err.message || "產生失敗，請再試一次。");
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  const toggleRank = (idx: number) => {
    setRankOrder(prev => 
      prev.includes(idx) 
        ? prev.filter(i => i !== idx) 
        : prev.length >= 4 ? prev : [...prev, idx]
    );
  };

  const askDelete = (title: string, onConfirm: () => void) => {
    setModal({ title, onConfirm });
  };

  const deleteEntry = (dateStr: string, entryId: number) => {
    setHistory(prev => {
      const day = (prev[dateStr] || []).filter(e => e.id !== entryId);
      if (!day.length) {
        const newHistory = { ...prev };
        delete newHistory[dateStr];
        return newHistory;
      }
      return { ...prev, [dateStr]: day };
    });
  };

  const deleteHour = (dateStr: string, hour: string) => {
    setHistory(prev => {
      const day = (prev[dateStr] || []).filter(e => taipeiHour(e.id) !== hour);
      if (!day.length) {
        const newHistory = { ...prev };
        delete newHistory[dateStr];
        return newHistory;
      }
      return { ...prev, [dateStr]: day };
    });
  };

  const deleteDay = (dateStr: string) => {
    setHistory(prev => {
      const newHistory = { ...prev };
      delete newHistory[dateStr];
      return newHistory;
    });
  };

  const sortedDays = Object.keys(history).sort((a, b) => b.localeCompare(a));
  const today = taipeiDateStr(Date.now());
  const totalEntries = Object.values(history).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <>
      <Head>
        <title>雙關語產生器 - AI 諧音梗成語生成</title>
        <meta name="description" content="輸入詞語，AI 生成四字諧音成語，點擊排出你的最愛" />
      </Head>

      <Tooltip id="main-tooltip" />
      <Tooltip id="history-tooltip" />

      {modal && (
        <PasswordModal 
          title={modal.title} 
          onConfirm={() => {
            modal.onConfirm();
            setModal(null);
          }}
          onCancel={() => setModal(null)}
          tooltips={tooltips}
        />
      )}

      {/* Notification Messages */}
      {errorMessage && (
        <div className="fixed top-20 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center gap-2">
          <FontAwesomeIcon icon={faTimes} className="text-white" />
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="fixed top-20 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center gap-2">
          <FontAwesomeIcon icon={faMagic} className="text-white" />
          {successMessage}
        </div>
      )}

      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-[#1a2a3a] to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="text-5xl mb-3">🀄</div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  雙關語產生器
                </h1>
                <p className="text-gray-400 text-sm">
                  輸入詞語，AI 生成四字諧音成語，點擊排出你的最愛
                </p>
              </div>

              {/* Input Section */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && generatePuns(input)}
                    placeholder="輸入詞語，例如：咖啡、AI、台灣…"
                    className="flex-1 bg-gray-700 text-white py-3 px-5 rounded-xl border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                    data-tooltip-id="main-tooltip"
                    data-tooltip-content="輸入任何中文或英文詞語"
                  />
                  <button
                    onClick={() => generatePuns(input)}
                    disabled={!input.trim() || loading}
                    className={`px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                      input.trim() && !loading
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 hover:from-yellow-500 hover:to-yellow-600'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                    data-tooltip-id="main-tooltip"
                    data-tooltip-content={loading ? "AI 思考中..." : "生成諧音成語"}
                  >
                    {loading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faMagic} />
                        生成
                      </>
                    )}
                  </button>
                </div>

                {/* Example Chips */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="text-xs text-gray-500 self-center mr-1">試試：</span>
                  {EXAMPLES.map(ex => (
                    <button
                      key={ex}
                      onClick={() => {
                        setInput(ex);
                        generatePuns(ex);
                      }}
                      className="text-xs px-3 py-1.5 rounded-full border border-gray-600 bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-yellow-400 transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>

                {/* Debug Toggle */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={debugMode}
                      onChange={(e) => setDebugMode(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-yellow-400 focus:ring-yellow-400"
                    />
                    <span className="text-xs text-gray-400">除錯模式</span>
                    <FontAwesomeIcon icon={faBug} className="text-gray-500 text-xs" />
                  </label>
                  {debugMode && (
                    <span className="text-xs text-yellow-500">開啟中 - 將顯示 API 原始回應</span>
                  )}
                </div>
              </div>

              {/* Debug Panel */}
              {debugMode && debugInfo && (
                <div className="bg-gray-900/80 border border-yellow-500/30 rounded-xl p-4 mb-6 overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-yellow-400 uppercase tracking-wider">API 除錯資訊</h3>
                    <button
                      onClick={() => setDebugInfo("")}
                      className="text-xs text-gray-500 hover:text-white"
                    >
                      清除
                    </button>
                  </div>
                  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap overflow-auto max-h-96">
                    {debugInfo}
                  </pre>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-700">
                  <div className="text-4xl mb-4">🎭</div>
                  <p className="text-gray-400">
                    正在為「<span className="text-yellow-400">{lastInput}</span>」發揮創意...
                  </p>
                  <div className="mt-4 flex justify-center">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin text-yellow-400 text-2xl" />
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="bg-red-900/30 border border-red-500/50 rounded-2xl p-6 text-center">
                  <p className="text-red-400">{error}</p>
                </div>
              )}

              {/* Results */}
              {results && !loading && (
                <div className="space-y-4">
                  {/* Ranking Info */}
                  <div className="flex items-center justify-between bg-gray-800/30 backdrop-blur-sm rounded-xl p-3 border border-gray-700">
                    <span className="text-xs text-gray-400">
                      {rankOrder.length < 4 
                        ? `點擊卡片排名（已選 ${rankOrder.length}/4）` 
                        : "排名完成！再點可取消"}
                    </span>
                    {rankOrder.length > 0 && (
                      <button
                        onClick={() => setRankOrder([])}
                        className="text-xs px-3 py-1 rounded-full border border-gray-600 text-gray-400 hover:text-yellow-400 hover:border-yellow-400 transition-colors"
                      >
                        重置排名
                      </button>
                    )}
                  </div>

                  {/* Ranked Order Display */}
                  {rankOrder.length > 0 && (
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-3 border border-gray-700 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-gray-500 mr-1">🏆 排名：</span>
                      {rankOrder.map((idx, pos) => (
                        <span key={idx} className="text-sm text-white">
                          {RANK_LABELS[pos]} {results[idx]?.pun}
                          {pos < rankOrder.length - 1 && (
                            <FontAwesomeIcon icon={faArrowRight} className="text-gray-600 mx-1 text-xs" />
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Pun Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.map((result, idx) => {
                      const colors = COLORS[idx % COLORS.length];
                      const rank = rankOrder.indexOf(idx);
                      const isRanked = rank !== -1;

                      return (
                        <div
                          key={idx}
                          onClick={() => toggleRank(idx)}
                          className={`cursor-pointer transition-all duration-300 rounded-xl p-5 ${
                            isRanked ? 'ring-2 ring-offset-2 ring-offset-gray-900' : 'hover:translate-y-[-2px]'
                          } ${rankOrder.length === 4 && !isRanked ? 'opacity-60' : 'opacity-100'}`}
                          style={{
                            backgroundColor: colors.bg,
                            borderColor: isRanked ? colors.text : colors.border,
                            borderWidth: isRanked ? '2px' : '1px',
                            borderStyle: 'solid'
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="text-3xl">{result.emoji}</div>
                            <div className="text-sm font-semibold" style={{ color: colors.text }}>
                              {isRanked ? RANK_LABELS[rank] : "點擊排名"}
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="flex items-baseline flex-wrap gap-2 mb-2">
                              <span className="text-xl font-bold" style={{ color: colors.text }}>
                                {result.pun}
                              </span>
                              <span 
                                className="text-xs px-2 py-0.5 rounded-full"
                                style={{ 
                                  backgroundColor: colors.badge,
                                  color: colors.badgeText
                                }}
                              >
                                原：{result.original}
                              </span>
                            </div>

                            <div 
                              className="text-xs inline-block px-2 py-1 rounded-md mb-2"
                              style={{ 
                                backgroundColor: colors.badge,
                                color: colors.badgeText
                              }}
                            >
                              🔊 {result.homophones}
                            </div>

                            <p className="text-sm" style={{ color: colors.text, opacity: 0.8 }}>
                              {result.explanation}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Regenerate Button */}
                  <div className="text-center pt-4">
                    <button
                      onClick={() => generatePuns(input)}
                      className="px-6 py-2 rounded-full border border-gray-600 text-gray-400 hover:text-yellow-400 hover:border-yellow-400 transition-colors text-sm"
                    >
                      ↻ 再生成一組
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* History Sidebar */}
            <div className={`transition-all duration-300 ${showHistory ? 'w-72' : 'w-12'}`}>
              <div className="sticky top-6">
                {/* Sidebar Header */}
                <div className="flex items-center justify-between mb-3">
                  {showHistory && (
                    <span className="text-sm font-medium text-gray-400 flex items-center gap-2">
                      <FontAwesomeIcon icon={faHistory} />
                      使用紀錄
                      {totalEntries > 0 && (
                        <span className="text-xs text-gray-500">({totalEntries})</span>
                      )}
                      {!storageReady && (
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
                      )}
                    </span>
                  )}
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors"
                    data-tooltip-id="history-tooltip"
                    data-tooltip-content={showHistory ? "收起側邊欄" : "展開側邊欄"}
                  >
                    <FontAwesomeIcon 
                      icon={showHistory ? faChevronRight : faChevronLeft} 
                      className="text-gray-400 text-sm"
                    />
                  </button>
                </div>

                {/* History Content */}
                {showHistory && (
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden max-h-[calc(100vh-120px)] overflow-y-auto">
                    {storageReady && sortedDays.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-2">📭</div>
                        <p className="text-gray-500 text-sm">尚無使用紀錄</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-700">
                        {sortedDays.map(dateStr => {
                          const entries = history[dateStr] || [];
                          const isToday = dateStr === today;
                          const isDayExpanded = !!expandedDays[dateStr];
                          const hourMap = groupByHour(entries);
                          const sortedHours = Object.keys(hourMap).sort((a, b) => b.localeCompare(a));

                          return (
                            <div key={dateStr} className="overflow-hidden">
                              {/* Day Header */}
                              <div 
                                className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${
                                  isToday ? 'bg-yellow-500/10' : 'hover:bg-gray-700/50'
                                }`}
                                onClick={() => setExpandedDays(prev => ({ ...prev, [dateStr]: !prev[dateStr] }))}
                              >
                                <div className="flex items-center gap-2">
                                  {isToday && <FontAwesomeIcon icon={faFire} className="text-yellow-400 text-xs" />}
                                  <span className={`text-sm font-medium ${isToday ? 'text-yellow-400' : 'text-gray-300'}`}>
                                    {dateLabel(dateStr)}
                                  </span>
                                  <span className="text-xs text-gray-500">({entries.length})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <DeleteButton 
                                    label="刪當日"
                                    onClick={() => askDelete(
                                      `刪除「${dateLabel(dateStr)}」全部 ${entries.length} 筆？`,
                                      () => deleteDay(dateStr)
                                    )}
                                  />
                                  <span className="text-gray-500 text-xs">
                                    {isDayExpanded ? "▲" : "▼"}
                                  </span>
                                </div>
                              </div>

                              {/* Hour Groups */}
                              {isDayExpanded && sortedHours.map(hour => {
                                const hourEntries = hourMap[hour];
                                const hourKey = `${dateStr}_${hour}`;
                                const isHourExpanded = !!expandedHours[hourKey];

                                return (
                                  <div key={hour} className="border-t border-gray-700/50">
                                    <div 
                                      className="flex items-center justify-between p-2 pl-6 cursor-pointer hover:bg-gray-700/30"
                                      onClick={() => setExpandedHours(prev => ({ ...prev, [hourKey]: !prev[hourKey] }))}
                                    >
                                      <span className="text-xs text-gray-400">
                                        {hour}:xx 時段 ({hourEntries.length})
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <DeleteButton 
                                          label="刪此時"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            askDelete(
                                              `刪除 ${dateLabel(dateStr)} ${hour}:xx 時段共 ${hourEntries.length} 筆？`,
                                              () => deleteHour(dateStr, hour)
                                            );
                                          }}
                                        />
                                        <span className="text-gray-500 text-xs">
                                          {isHourExpanded ? "▲" : "▼"}
                                        </span>
                                      </div>
                                    </div>

                                    {isHourExpanded && (
                                      <div className="pl-8 pb-1">
                                        {hourEntries.map(entry => (
                                          <div
                                            key={entry.id}
                                            className="flex items-center justify-between py-2 px-2 hover:bg-gray-700/30 rounded-lg cursor-pointer group"
                                            onClick={() => {
                                              setInput(entry.keyword);
                                              generatePuns(entry.keyword);
                                            }}
                                          >
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm text-white truncate">{entry.keyword}</p>
                                              <p className="text-xs text-gray-500">{entry.time}</p>
                                            </div>
                                            <DeleteButton 
                                              label="刪"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                askDelete(
                                                  `刪除詞條「${entry.keyword}」（${entry.time}）？`,
                                                  () => deleteEntry(dateStr, entry.id)
                                                );
                                              }}
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Global styles for animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25%, 75% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
        }
      `}</style>
    </>
  );
}