<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>ez URI Scheme · Animated Specification · IANA Provisional</title>
  <meta name="description" content="ez URI Scheme – provisional registration for distributed compute, AI inference, and heterogeneous orchestration (IANA approved June 12, 2026)">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --teal-50: #f0fdfa;
      --teal-100: #ccfbf1;
      --teal-200: #99f6e4;
      --teal-300: #5eead4;
      --teal-400: #2dd4bf;
      --teal-500: #14b8a6;
      --teal-600: #0d9488;
      --teal-700: #0f766e;
      --teal-800: #115e59;
      --teal-900: #134e4a;
      --amber-50: #fffbeb;
      --amber-100: #fef3c7;
      --amber-200: #fde68a;
      --amber-300: #fcd34d;
      --amber-400: #fbbf24;
      --amber-500: #f59e0b;
      --amber-600: #d97706;
      --amber-700: #b45309;
      --rose-50: #fff1f2;
      --rose-100: #ffe4e6;
      --rose-200: #fecdd3;
      --rose-300: #fda4af;
      --rose-400: #fb7185;
      --rose-500: #f43f5e;
      --rose-600: #e11d48;
      --violet-50: #f5f3ff;
      --violet-100: #ede9fe;
      --violet-200: #ddd6fe;
      --violet-300: #c4b5fd;
      --violet-400: #a78bfa;
      --violet-500: #8b5cf6;
      --violet-600: #7c3aed;
      --violet-700: #6d28d9;
      --emerald-50: #ecfdf5;
      --emerald-100: #d1fae5;
      --emerald-200: #a7f3d0;
      --emerald-300: #6ee7b7;
      --emerald-400: #34d399;
      --emerald-500: #10b981;
      --emerald-600: #059669;
      --emerald-700: #047857;
      --sky-50: #f0f9ff;
      --sky-100: #e0f2fe;
      --sky-200: #bae6fd;
      --sky-300: #7dd3fc;
      --sky-400: #38bdf8;
      --sky-500: #0ea5e9;
      --sky-600: #0284c7;
      --sky-700: #0369a1;
      --orange-50: #fff7ed;
      --orange-100: #ffedd5;
      --orange-200: #fed7aa;
      --orange-300: #fdba74;
      --orange-400: #fb923c;
      --orange-500: #f97316;
      --orange-600: #ea580c;
      --orange-700: #c2410c;
      --cyan-50: #ecfeff;
      --cyan-100: #cffafe;
      --cyan-200: #a5f3fc;
      --cyan-300: #67e8f9;
      --cyan-400: #22d3ee;
      --cyan-500: #06b6d4;
      --cyan-600: #0891b2;
      --cyan-700: #0e7490;
      --pink-50: #fdf2f8;
      --pink-100: #fce7f3;
      --pink-200: #fbcfe8;
      --pink-300: #f9a8d4;
      --pink-400: #f472b6;
      --pink-500: #ec4899;
      --pink-600: #db2777;
      --pink-700: #be185d;
      --lime-50: #f7fee7;
      --lime-100: #ecfccb;
      --lime-200: #d9f99d;
      --lime-300: #bef264;
      --lime-400: #a3e635;
      --lime-500: #84cc16;
      --lime-600: #65a30d;
      --lime-700: #4d7c0f;
    }

    body {
      background: linear-gradient(135deg, #f0f9ff 0%, #fefce8 25%, #fdf2f8 50%, #f0fdf4 75%, #f0f5ff 100%);
      background-size: 400% 400%;
      animation: gradientShift 20s ease infinite;
      font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #0f172a;
      padding: 2rem 1.5rem;
      position: relative;
      min-height: 100vh;
      overflow-x: hidden;
    }

    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    /* Animated floating orbs */
    .orb {
      position: fixed;
      border-radius: 50%;
      z-index: -2;
      filter: blur(60px);
      opacity: 0.35;
      pointer-events: none;
    }
    .orb-1 {
      top: -10%; left: -10%; width: 500px; height: 500px;
      background: radial-gradient(circle, var(--teal-300), transparent 70%);
      animation: orbFloat1 18s ease-in-out infinite alternate;
    }
    .orb-2 {
      top: 40%; right: -15%; width: 400px; height: 400px;
      background: radial-gradient(circle, var(--amber-300), transparent 70%);
      animation: orbFloat2 22s ease-in-out infinite alternate-reverse;
    }
    .orb-3 {
      bottom: -10%; left: 30%; width: 450px; height: 450px;
      background: radial-gradient(circle, var(--violet-300), transparent 70%);
      animation: orbFloat3 25s ease-in-out infinite alternate;
    }
    .orb-4 {
      top: 20%; left: 60%; width: 300px; height: 300px;
      background: radial-gradient(circle, var(--rose-300), transparent 70%);
      animation: orbFloat4 20s ease-in-out infinite alternate-reverse;
    }
    .orb-5 {
      bottom: 30%; right: 10%; width: 350px; height: 350px;
      background: radial-gradient(circle, var(--emerald-300), transparent 70%);
      animation: orbFloat5 24s ease-in-out infinite alternate;
    }

    @keyframes orbFloat1 {
      0% { transform: translate(0, 0) scale(1); }
      100% { transform: translate(60px, 80px) scale(1.3); }
    }
    @keyframes orbFloat2 {
      0% { transform: translate(0, 0) scale(1); }
      100% { transform: translate(-50px, -60px) scale(1.2); }
    }
    @keyframes orbFloat3 {
      0% { transform: translate(0, 0) scale(1); }
      100% { transform: translate(40px, -50px) scale(1.4); }
    }
    @keyframes orbFloat4 {
      0% { transform: translate(0, 0) scale(1); }
      100% { transform: translate(-30px, 40px) scale(1.2); }
    }
    @keyframes orbFloat5 {
      0% { transform: translate(0, 0) scale(1); }
      100% { transform: translate(50px, -30px) scale(1.3); }
    }

    /* Floating particles */
    .particles {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: -1;
      pointer-events: none;
      overflow: hidden;
    }
    .particle {
      position: absolute;
      width: 6px; height: 6px;
      border-radius: 50%;
      opacity: 0.4;
      animation: particleFloat linear infinite;
    }
    .particle:nth-child(1) { left: 10%; background: var(--teal-400); animation-duration: 15s; animation-delay: 0s; }
    .particle:nth-child(2) { left: 20%; background: var(--amber-400); animation-duration: 18s; animation-delay: 2s; width: 4px; height: 4px; }
    .particle:nth-child(3) { left: 30%; background: var(--violet-400); animation-duration: 12s; animation-delay: 1s; }
    .particle:nth-child(4) { left: 40%; background: var(--rose-400); animation-duration: 20s; animation-delay: 3s; width: 3px; height: 3px; }
    .particle:nth-child(5) { left: 50%; background: var(--emerald-400); animation-duration: 16s; animation-delay: 0.5s; }
    .particle:nth-child(6) { left: 60%; background: var(--sky-400); animation-duration: 14s; animation-delay: 2.5s; width: 5px; height: 5px; }
    .particle:nth-child(7) { left: 70%; background: var(--orange-400); animation-duration: 19s; animation-delay: 1.5s; }
    .particle:nth-child(8) { left: 80%; background: var(--pink-400); animation-duration: 17s; animation-delay: 4s; width: 4px; height: 4px; }
    .particle:nth-child(9) { left: 90%; background: var(--lime-400); animation-duration: 13s; animation-delay: 3.5s; }
    .particle:nth-child(10) { left: 5%; background: var(--cyan-400); animation-duration: 21s; animation-delay: 5s; width: 3px; height: 3px; }

    @keyframes particleFloat {
      0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
      10% { opacity: 0.6; }
      90% { opacity: 0.6; }
      100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
    }

    /* Main container */
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 2.5rem;
      box-shadow: 
        0 25px 50px -12px rgba(0, 0, 0, 0.15),
        0 0 0 1px rgba(255, 255, 255, 0.5) inset,
        0 0 100px rgba(20, 184, 166, 0.08);
      overflow: hidden;
      transition: all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1);
      animation: fadeSlideUp 0.8s ease-out;
      position: relative;
    }

    .container::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      border-radius: 2.5rem;
      padding: 2px;
      background: linear-gradient(135deg, var(--teal-400), var(--amber-400), var(--violet-400), var(--rose-400), var(--emerald-400));
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      opacity: 0.3;
      pointer-events: none;
    }

    .container:hover {
      box-shadow: 
        0 35px 60px -15px rgba(0, 0, 0, 0.2),
        0 0 0 1px rgba(255, 255, 255, 0.6) inset,
        0 0 120px rgba(20, 184, 166, 0.12);
      transform: translateY(-4px);
    }

    @keyframes fadeSlideUp {
      0% { opacity: 0; transform: translateY(40px) scale(0.98); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* Hero */
    .hero {
      background: linear-gradient(135deg, #0c4a6e 0%, #0d9488 35%, #059669 70%, #0891b2 100%);
      background-size: 300% 300%;
      animation: heroGradient 8s ease infinite;
      padding: 3rem 2.5rem 2.5rem 2.5rem;
      color: white;
      position: relative;
      overflow: hidden;
    }

    @keyframes heroGradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .hero::before {
      content: '';
      position: absolute;
      top: -50%; left: -50%;
      width: 200%; height: 200%;
      background: 
        radial-gradient(circle at 30% 50%, rgba(20, 184, 166, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 70% 50%, rgba(251, 191, 36, 0.2) 0%, transparent 50%);
      animation: heroPulse 6s ease-in-out infinite;
      pointer-events: none;
    }

    @keyframes heroPulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }

    .hero::after {
      content: '';
      position: absolute;
      top: -50%; left: -20%;
      width: 150%; height: 200%;
      background: linear-gradient(115deg, rgba(255,255,255,0.08) 0%, rgba(255,255,240,0.15) 50%, transparent 80%);
      transform: rotate(25deg);
      animation: shimmer 10s infinite linear;
      pointer-events: none;
    }

    @keyframes shimmer {
      0% { transform: translateX(-40%) rotate(25deg); opacity: 0.15; }
      50% { transform: translateX(30%) rotate(25deg); opacity: 0.4; }
      100% { transform: translateX(110%) rotate(25deg); opacity: 0.15; }
    }

    .hero h1 {
      font-size: 3.2rem;
      font-weight: 900;
      letter-spacing: -0.03em;
      background: linear-gradient(130deg, #FFFFFF, #a7f3d0, #fde68a, #ddd6fe, #fecdd3);
      background-size: 300% 300%;
      animation: textGradient 4s ease infinite;
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
      text-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 0.6rem;
      position: relative;
      display: inline-block;
    }

    @keyframes textGradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .hero .subhead {
      font-size: 1.15rem;
      opacity: 0.95;
      display: flex;
      flex-wrap: wrap;
      gap: 2rem;
      margin-top: 0.8rem;
      border-left: 4px solid #fbbf24;
      padding-left: 1.2rem;
      font-weight: 500;
    }

    .status-card {
      background: rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-radius: 2rem;
      padding: 1.2rem 1.8rem;
      margin-top: 2rem;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      font-size: 0.95rem;
      border: 1px solid rgba(255,255,255,0.2);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .status-card::before {
      content: '';
      position: absolute;
      top: 0; left: -100%; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
      animation: statusShine 5s infinite;
    }

    @keyframes statusShine {
      0% { left: -100%; }
      100% { left: 100%; }
    }

    .status-card:hover {
      background: rgba(0, 0, 0, 0.25);
      border-color: rgba(255,255,255,0.35);
      transform: translateY(-2px);
    }

    .status-badge {
      background: linear-gradient(95deg, #fbbf24, #f59e0b, #f97316);
      background-size: 200% 200%;
      animation: badgeGradient 3s ease infinite;
      color: #1e293b;
      font-weight: 800;
      padding: 0.4rem 1.4rem;
      border-radius: 60px;
      font-size: 0.88rem;
      letter-spacing: 0.5px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 15px rgba(251, 191, 36, 0.4);
      animation: pulseBadge 2.5s infinite, badgeGradient 3s ease infinite;
      position: relative;
      z-index: 1;
    }

    @keyframes badgeGradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    @keyframes pulseBadge {
      0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.6); }
      70% { box-shadow: 0 0 0 12px rgba(251, 191, 36, 0); }
      100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
    }

    .hero-info {
      margin-top: 1.2rem;
      font-size: 0.88rem;
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
      opacity: 0.9;
    }
    .hero-info span {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: rgba(255,255,255,0.1);
      padding: 0.3rem 0.9rem;
      border-radius: 2rem;
      transition: all 0.2s;
    }
    .hero-info span:hover {
      background: rgba(255,255,255,0.2);
      transform: translateY(-1px);
    }

    .content {
      padding: 2.5rem 3rem 3rem 3rem;
    }

    /* Section headings with rainbow */
    h2 {
      font-size: 2rem;
      font-weight: 800;
      margin: 2.5rem 0 1.2rem 0;
      padding-bottom: 0.7rem;
      background: linear-gradient(120deg, var(--teal-600), var(--emerald-500), var(--amber-500), var(--orange-500), var(--rose-500), var(--violet-500), var(--sky-500));
      background-size: 300% 300%;
      animation: headingGradient 6s ease infinite;
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
      border-bottom: 3px solid transparent;
      border-image: linear-gradient(95deg, var(--teal-400), var(--amber-400), var(--rose-400), var(--violet-400), var(--emerald-400)) 1;
      border-image-slice: 1;
      display: inline-block;
      transition: all 0.3s ease;
      position: relative;
    }

    h2::after {
      content: '';
      position: absolute;
      bottom: -3px; left: 0;
      width: 100%; height: 3px;
      background: linear-gradient(95deg, var(--teal-400), var(--amber-400), var(--rose-400), var(--violet-400), var(--emerald-400));
      background-size: 200% 200%;
      animation: underlineShift 4s ease infinite;
      border-radius: 2px;
    }

    @keyframes headingGradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes underlineShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    h2:hover {
      transform: translateX(8px) scale(1.02);
    }

    h3 {
      font-weight: 700;
      font-size: 1.4rem;
      margin: 1.8rem 0 1rem 0;
      color: #0f766e;
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      border-left: 5px solid #f59e0b;
      padding-left: 14px;
      transition: all 0.3s ease;
    }
    h3:hover {
      border-left-color: #ec4899;
      transform: translateX(5px);
    }

    p {
      font-size: 1.05rem;
      line-height: 1.75;
      color: #334155;
      margin-bottom: 1rem;
    }

    code, pre {
      font-family: 'JetBrains Mono', 'Fira Code', monospace;
      font-size: 0.88rem;
    }

    code {
      background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
      padding: 0.25rem 0.6rem;
      color: #dc2626;
      border-radius: 10px;
      font-weight: 600;
      transition: all 0.2s ease;
      border: 1px solid rgba(0,0,0,0.05);
    }
    code:hover {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #b45309;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
    }

    pre {
      background: linear-gradient(135deg, #0f172a, #1e293b);
      color: #e2e8f0;
      padding: 1.5rem;
      border-radius: 1.5rem;
      overflow-x: auto;
      margin: 1.5rem 0;
      border: 1px solid rgba(56, 189, 248, 0.2);
      box-shadow: 
        0 10px 25px -10px rgba(0, 0, 0, 0.4),
        0 0 0 1px rgba(56, 189, 248, 0.1) inset;
      transition: all 0.3s ease;
      position: relative;
    }
    pre::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--teal-400), var(--sky-400), var(--violet-400), var(--rose-400), var(--amber-400));
      border-radius: 1.5rem 1.5rem 0 0;
    }
    pre:hover {
      transform: scale(1.01) translateY(-2px);
      box-shadow: 
        0 15px 35px -10px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(56, 189, 248, 0.2) inset;
    }

    pre code {
      background: transparent;
      color: #a5f3fc;
      padding: 0;
      border: none;
      font-weight: 400;
    }

    ul {
      list-style: none;
      padding-left: 0;
    }

    ul li {
      margin: 0.9rem 0;
      padding-left: 2.2rem;
      position: relative;
      transition: all 0.3s ease;
      font-size: 1.05rem;
      color: #475569;
      line-height: 1.7;
    }
    ul li:hover {
      transform: translateX(8px);
      color: #0f172a;
    }

    ul li::before {
      content: "✨";
      position: absolute;
      left: 0;
      color: #f59e0b;
      font-weight: bold;
      font-size: 1.1rem;
      transition: all 0.3s ease;
    }
    ul li:hover::before {
      transform: scale(1.3) rotate(15deg);
      color: #ec4899;
    }

    /* Example URIs card */
    .example-uris {
      background: linear-gradient(135deg, #fefce8, #fffbeb, #fdf2f8);
      background-size: 200% 200%;
      animation: exampleGlow 4s ease infinite;
      border-radius: 2rem;
      padding: 1.5rem 2rem;
      margin: 1.5rem 0;
      border: 2px solid transparent;
      background-clip: padding-box;
      position: relative;
      box-shadow: 0 8px 25px -12px rgba(251, 191, 36, 0.2);
      transition: all 0.3s ease;
    }
    .example-uris::before {
      content: '';
      position: absolute;
      top: -2px; left: -2px; right: -2px; bottom: -2px;
      border-radius: 2rem;
      padding: 2px;
      background: linear-gradient(135deg, var(--amber-400), var(--orange-400), var(--rose-400), var(--violet-400));
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      z-index: -1;
    }
    .example-uris:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 35px -12px rgba(251, 191, 36, 0.3);
    }

    @keyframes exampleGlow {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .example-uris h4 {
      font-size: 1.2rem;
      font-weight: 700;
      color: #b45309;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Grid stats */
    .grid-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin: 2rem 0;
    }

    .stat-card {
      background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9));
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 1.5rem;
      padding: 1.3rem 1.5rem;
      border-left: 6px solid var(--teal-500);
      transition: all 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1);
      cursor: default;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 15px -5px rgba(0,0,0,0.08);
    }
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(135deg, var(--teal-50), var(--sky-50));
      opacity: 0;
      transition: opacity 0.3s;
      z-index: -1;
    }
    .stat-card:hover::before { opacity: 1; }
    .stat-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.15);
      border-left-color: var(--amber-500);
    }
    .stat-card:nth-child(2) { border-left-color: var(--amber-500); }
    .stat-card:nth-child(2):hover { border-left-color: var(--rose-500); }
    .stat-card:nth-child(3) { border-left-color: var(--violet-500); }
    .stat-card:nth-child(3):hover { border-left-color: var(--emerald-500); }

    .stat-card span:first-child {
      font-size: 1.6rem;
      display: block;
      margin-bottom: 0.5rem;
    }
    .stat-card strong {
      font-size: 1.05rem;
      color: #0f172a;
      display: block;
      margin-bottom: 0.3rem;
    }
    .stat-card code {
      font-size: 0.8rem;
    }

    /* Transition boxes */
    .transition-box {
      background: linear-gradient(135deg, #f0f9ff, #ffffff, #fefce8);
      background-size: 200% 200%;
      animation: boxShift 8s ease infinite;
      border-radius: 2rem;
      padding: 1.5rem 2rem;
      border-left: 8px solid var(--amber-500);
      margin: 1.5rem 0;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px -5px rgba(0,0,0,0.08);
      position: relative;
      overflow: hidden;
    }
    .transition-box::after {
      content: '';
      position: absolute;
      top: -50%; right: -50%;
      width: 100%; height: 100%;
      background: radial-gradient(circle, rgba(251, 191, 36, 0.1), transparent 70%);
      animation: boxGlow 5s ease-in-out infinite;
      pointer-events: none;
    }
    .transition-box:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 30px -10px rgba(0,0,0,0.12);
    }

    @keyframes boxShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes boxGlow {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.2); }
    }

    .badge-modern {
      background: linear-gradient(135deg, var(--teal-500), var(--emerald-500));
      color: white;
      padding: 0.3rem 1.2rem;
      border-radius: 30px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      display: inline-block;
      box-shadow: 0 2px 10px rgba(20, 184, 166, 0.3);
      transition: all 0.2s ease;
    }
    .badge-modern:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 15px rgba(20, 184, 166, 0.4);
    }

    a {
      color: #0d9488;
      text-decoration: none;
      font-weight: 600;
      border-bottom: 2px dashed #99f6e4;
      transition: all 0.3s ease;
      position: relative;
    }
    a:hover {
      color: #ec4899;
      border-bottom-color: #fda4af;
      border-bottom-style: solid;
    }

    /* Contact block */
    .contact-block {
      background: linear-gradient(135deg, #f0fdf4, #fefce8, #fdf2f8);
      background-size: 200% 200%;
      animation: contactShift 6s ease infinite;
      border-radius: 2rem;
      padding: 1.5rem 2rem;
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      justify-content: space-between;
      margin: 0.8rem 0 1.2rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px -5px rgba(0,0,0,0.08);
      position: relative;
      overflow: hidden;
    }
    .contact-block::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      border-radius: 2rem;
      padding: 2px;
      background: linear-gradient(135deg, var(--teal-400), var(--amber-400), var(--rose-400));
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      opacity: 0.3;
    }
    .contact-block:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 30px -10px rgba(0,0,0,0.12);
    }
    .contact-block div {
      position: relative;
      z-index: 1;
    }
    .contact-block strong {
      color: #0f172a;
      font-size: 1.05rem;
    }

    @keyframes contactShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    /* Footer */
    footer {
      background: linear-gradient(135deg, #0f172a, #1e293b, #0f766e);
      background-size: 200% 200%;
      animation: footerGradient 10s ease infinite;
      padding: 1.5rem;
      text-align: center;
      color: #cbd5e1;
      font-size: 0.85rem;
      border-top: 3px solid transparent;
      border-image: linear-gradient(90deg, var(--teal-400), var(--amber-400), var(--rose-400), var(--violet-400)) 1;
      border-image-slice: 1;
      position: relative;
      overflow: hidden;
    }
    footer::before {
      content: '';
      position: absolute;
      top: 0; left: -100%; width: 100%; height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
      animation: footerShine 8s infinite;
    }
    @keyframes footerGradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes footerShine {
      0% { left: -100%; }
      100% { left: 100%; }
    }

    /* Rainbow divider */
    .rainbow-divider {
      margin: 2.5rem 0;
      border: none;
      height: 3px;
      background: linear-gradient(90deg, var(--teal-400), var(--emerald-400), var(--amber-400), var(--orange-400), var(--rose-400), var(--violet-400), var(--sky-400), var(--pink-400));
      background-size: 200% 200%;
      animation: rainbowShift 3s linear infinite;
      border-radius: 2px;
    }
    @keyframes rainbowShift {
      0% { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }

    /* Closing banner */
    .closing-banner {
      text-align: center;
      font-size: 1rem;
      background: linear-gradient(135deg, #fefce8, #fff1f2, #f0fdf4);
      background-size: 200% 200%;
      animation: bannerShift 5s ease infinite;
      border-radius: 2rem;
      padding: 1.2rem 1.5rem;
      margin-top: 0.5rem;
      font-weight: 600;
      color: #475569;
      border: 2px solid transparent;
      position: relative;
      box-shadow: 0 4px 15px -5px rgba(0,0,0,0.08);
    }
    .closing-banner::before {
      content: '';
      position: absolute;
      top: -2px; left: -2px; right: -2px; bottom: -2px;
      border-radius: 2rem;
      padding: 2px;
      background: linear-gradient(135deg, var(--amber-400), var(--rose-400), var(--violet-400), var(--teal-400));
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      z-index: -1;
    }
    .closing-banner strong {
      background: linear-gradient(135deg, var(--teal-600), var(--amber-600), var(--rose-600));
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
      font-weight: 800;
    }

    @keyframes bannerShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    /* Scrollbar */
    ::-webkit-scrollbar {
      width: 10px;
    }
    ::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 5px;
    }
    ::-webkit-scrollbar-thumb {
      background: linear-gradient(180deg, var(--teal-400), var(--amber-400), var(--rose-400));
      border-radius: 5px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(180deg, var(--teal-500), var(--amber-500), var(--rose-500));
    }

    /* Responsive */
    @media (max-width: 768px) {
      .content { padding: 1.5rem; }
      .hero { padding: 2rem 1.5rem 2rem 1.5rem; }
      .hero h1 { font-size: 2.2rem; }
      h2 { font-size: 1.5rem; }
      .grid-stats { grid-template-columns: 1fr; }
      .status-card { flex-direction: column; text-align: center; }
      .contact-block { flex-direction: column; }
    }

    /* Numbered section styling */
    .section-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, var(--teal-500), var(--emerald-500));
      color: white;
      border-radius: 50%;
      font-size: 0.9rem;
      font-weight: 700;
      margin-right: 0.5rem;
      box-shadow: 0 2px 8px rgba(20, 184, 166, 0.3);
      animation: numberPulse 3s ease infinite;
    }
    @keyframes numberPulse {
      0%, 100% { box-shadow: 0 2px 8px rgba(20, 184, 166, 0.3); }
      50% { box-shadow: 0 2px 15px rgba(20, 184, 166, 0.5); }
    }

    /* Status card special */
    .status-card-special {
      background: linear-gradient(135deg, #f0fdfa, #ffffff);
      border-radius: 1.5rem;
      padding: 1.2rem 1.5rem;
      border-left: 6px solid var(--amber-500);
      margin: 1rem 0;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px -5px rgba(0,0,0,0.08);
    }
    .status-card-special:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 30px -10px rgba(0,0,0,0.12);
      border-left-color: var(--rose-500);
    }
  </style>
<base target="_blank">
</head>
<body>
  <!-- Animated orbs -->
  <div class="orb orb-1"></div>
  <div class="orb orb-2"></div>
  <div class="orb orb-3"></div>
  <div class="orb orb-4"></div>
  <div class="orb orb-5"></div>

  <!-- Floating particles -->
  <div class="particles">
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
    <div class="particle"></div>
  </div>

  <div class="container">
    <div class="hero">
      <h1>ez URI Scheme</h1>
      <div class="subhead">
        <span>Provisional Specification · v0.0</span>
        <span>⚡ hardware-agnostic · AI-ready</span>
      </div>
      <div class="status-card">
        <div><span class="status-badge">✓ IANA APPROVED</span> <span style="margin-left: 8px;">June 12, 2026</span></div>
        <div><span style="background:rgba(0,0,0,0.25); padding:6px 14px; border-radius:32px; font-weight:600;">🎫 #1454153</span> <span style="background:rgba(0,0,0,0.25); padding:6px 14px; border-radius:32px; font-weight:600;">↻ supersedes #1453765</span></div>
        <div><a href="#" style="color:#fde68a; font-weight:700;">📖 registry: ez (provisional)</a></div>
      </div>
      <div class="hero-info">
        <span>✉️ KuoChun Fang &lt;RoyFang@M-Cmmerce.com&gt;</span>
        <span>🏢 M-Cmmerce.com</span>
        <span>📅 Sun, 14 June 2026</span>
      </div>
    </div>

    <div class="content">
      <h2><span class="section-number">1</span> Scheme Name</h2>
      <p><code style="font-size:1.6rem; font-weight:800;">ez</code> — <strong>ease, efficiency, extensible</strong>. Built for next-gen scheduling fabrics and inference grids.</p>

      <h2><span class="section-number">2</span> Status</h2>
      <div class="status-card-special">
        <span style="font-size:1.2rem;">✅</span> <strong>Provisional</strong> · IANA registered · path to permanent within 24 months
      </div>

      <h2><span class="section-number">3</span> URI Scheme Syntax</h2>
      <p>Formal ABNF (RFC 3986 compliant):</p>
      <pre><code>ez-URI = "ez" ":" hier-part [ "?" query ] [ "#" fragment ]
hier-part = "//" authority path-abempty
authority = [ userinfo "@" ] host [ ":" port ]
host = IP-literal / IPv4address / reg-name
path-abempty = *( "/" segment )
query = *( pchar / "/" / "?" )</code></pre>

      <div class="grid-stats">
        <div class="stat-card">
          <span>🔍</span>
          <strong>Authority required</strong>
          <code>ez://:1618/path</code> → invalid syntax
        </div>
        <div class="stat-card">
          <span>📏</span>
          <strong>Length limit (REC)</strong>
          128 octets recommended
        </div>
        <div class="stat-card">
          <span>🧩</span>
          <strong>UserInfo discouraged</strong>
          no plaintext secrets
        </div>
      </div>

      <div class="example-uris">
        <h4>🌈 Example URIs (interactive highlight)</h4>
        <ul style="margin-bottom:0;">
          <li><code>ez://localhost:1618/task/123</code></li>
          <li><code>ez://inference.local/gpt-oss-120b/chat</code></li>
          <li><code>ez://192.168.1.45:1618/execute/task-847</code></li>
          <li><code>ez://gpu-cluster-01/job/abc/status?priority=high</code></li>
          <li><code>ez://scheduler.zone-A/queue/batch#summary</code></li>
        </ul>
      </div>

      <h2><span class="section-number">4</span> Semantics & Resource Model</h2>
      <p>The <code>ez</code> scheme identifies resources in <strong>distributed compute, task queues, inference endpoints, and scheduling domains</strong>. Authority = service endpoint or scheduler. Path = resource identifier (job, result, model, node).<br>💡 No transport baked in — use with HTTP, gRPC, or custom RPC. Enables cross-vendor orchestration.</p>

      <h2><span class="section-number">5</span> Encoding Considerations</h2>
      <ul>
        <li>UTF-8 + percent-encoding for non-ASCII characters.</li>
        <li>Reserved characters outside delimiters MUST be percent-encoded.</li>
        <li>Scheme name <code>ez</code> conforms to RFC 7595 lowercase naming.</li>
      </ul>

      <h2><span class="section-number">6</span> Applications & Protocols</h2>
      <ul>
        <li><strong>AI Inference Scheduling</strong> — vLLM, TGI, Ray Serve</li>
        <li><strong>Heterogeneous compute (GPU/TPU/CPU)</strong> — Volcano, Kueue, Slurm</li>
        <li><strong>Orchestration control planes</strong> & resource-oriented APIs</li>
        <li><strong>Edge-to-cloud job coordination</strong></li>
      </ul>

      <h2><span class="section-number">7</span> Interoperability</h2>
      <ul>
        <li>No vendor-specific semantics → true cross-platform compatibility.</li>
        <li>Built on generic URI syntax → works with existing parsers and validators.</li>
        <li>Protocol bindings define mapping to actual RPC actions.</li>
      </ul>
      <div class="transition-box">
        <strong>🧪 Illustrative: Distributed AI inference</strong><br>
        📤 Request: <code>ez://scheduler.prod/inference/llama-3-70b</code><br>
        ⚙️ Scheduler routes → executor node.<br>
        📥 Result: <code>ez://node-05:1618/result/batch-442</code><br>
        <span class="badge-modern" style="display: inline-block; margin-top: 10px;">use-case only</span>
      </div>

      <h2><span class="section-number">8</span> Port Considerations</h2>
      <p>No universal default, but port <strong>1618</strong> (user range) is anticipated for many profiles. Formal protocol specs may define different defaults.</p>

      <h2><span class="section-number">9</span> Security Considerations (best practices)</h2>
      <ul>
        <li><code>ez</code> does not replace transport security – use TLS, mTLS, or network encryption.</li>
        <li>Plaintext credentials FORBIDDEN in userinfo/path/query.</li>
        <li>Mandatory sanitization: prevent injection, traversal, and oversized URIs.</li>
        <li>Deploy length limits (128-256 octets) to mitigate DoS.</li>
        <li>See RFC 3986 security section.</li>
      </ul>

      <h2><span class="section-number">10</span> Contact & Change Controller</h2>
      <div class="contact-block">
        <div><strong>📌 KuoChun Fang</strong><br>RoyFang@M-Cmmerce.com<br>M-Cmmerce.com</div>
        <div><strong>🔄 Change Controller</strong><br>KuoChun Fang (authorized)<br>Maintains registration & updates</div>
        <div><strong>🗓️ Registration</strong><br>Sun, 14 June 2026</div>
      </div>

      <h2><span class="section-number">11</span> Transition Plan → Permanent</h2>
      <div class="transition-box" style="background: linear-gradient(135deg, #f0f9ff, #ffffff, #fdf2f8);">
        <p><strong>📅 Within 24 months of provisional approval, permanent registration request will include:</strong></p>
        <ul>
          <li>Deployment & interoperability evidence (minimum 2 independent implementations).</li>
          <li>Complete Internet-Draft or RFC specification for <code>ez</code> scheme + protocol binding.</li>
          <li>Community review, security analysis, and operational feedback.</li>
        </ul>
        <span class="badge-modern">RFC 7595 staged model</span>
      </div>

      <h2><span class="section-number">12</span> References</h2>
      <ul>
        <li><a href="https://datatracker.ietf.org/doc/html/rfc3986" target="_blank">📘 RFC 3986 – URI Generic Syntax</a></li>
        <li><a href="https://datatracker.ietf.org/doc/html/rfc7595" target="_blank">📙 RFC 7595 – URI Scheme Registration</a></li>
        <li><a href="https://www.iana.org/assignments/uri-schemes/prov/ez" target="_blank">🌐 IANA Provisional Registry – ez</a></li>
      </ul>

      <hr class="rainbow-divider">
      <div class="closing-banner">
        ✨ <strong>ez</strong> — bridging infrastructure and intelligence. The future of resource naming, now provisional. ✨
      </div>
    </div>
    <footer>
      <span style="font-weight:600; font-size:0.9rem;">© 2026 M-Cmmerce.com · IANA provisional registration (ez) · version 0.0</span><br>
      <span style="font-size:0.75rem; opacity:0.8; margin-top:0.3rem; display:block;">Last updated: June 14, 2026 — designed with animations, full RFC 3986 alignment</span>
    </footer>
  </div>
</body>
</html>