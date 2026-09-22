import React, { useEffect, useRef, useState, useCallback } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import Zdog from 'zdog';
import { gsap, Linear } from 'gsap';

// ====================================================================
// 1. DYNAMIC CSS GENERATION - MODIFIED FOR BOUNDARY-AWARE ANIMATION & RESPONSIVE
// ====================================================================

const generateCssForEffect = (effect, index) => {
  const { moving_effect, moving_pattern } = effect;
  let keyframesCss = '';
  let mediaQueriesCss = '';

  // Responsive width calculations
  const getWidth = (baseWidth) => {
    return `
      width: ${baseWidth};
      height: ${baseWidth};
      
      @media (max-width: 1024px) {
        width: min(${baseWidth}, 220px);
        height: min(${baseWidth}, 220px);
      }
      
      @media (max-width: 768px) {
        width: min(${baseWidth}, 180px);
        height: min(${baseWidth}, 180px);
      }
      
      @media (max-width: 640px) {
        width: min(${baseWidth}, 150px);
        height: min(${baseWidth}, 150px);
      }
      
      @media (max-width: 480px) {
        width: min(${baseWidth}, 130px);
        height: min(${baseWidth}, 130px);
      }
      
      @media (max-width: 360px) {
        width: min(${baseWidth}, 110px);
        height: min(${baseWidth}, 110px);
      }
    `;
  };
  
  // Fixed widths with responsive fallbacks
  const fixedWidths = {
    saucer: getWidth('250px'),
    real: getWidth('300px'),
    bee: getWidth('250px'),
    default: getWidth('250px')
  };
  
  const effectWidth = fixedWidths[moving_effect] || fixedWidths.default;

  mediaQueriesCss = `
    .saucer${index} {
      position: fixed;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      row-gap: 0.5rem;
      border-radius: 0.5rem;
      ${effectWidth}
      will-change: transform;
      cursor: pointer;
      pointer-events: auto;
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(2px);
      transition: all 0.3s ease;
    }
    
    /* Hover effect for desktop */
    .saucer${index}:hover {
      transform: scale(1.05) !important;
      transition: transform 0.3s ease;
    }
    
    /* Responsive adjustments for content inside */
    .saucer${index} img,
    .saucer${index} svg,
    .saucer${index} canvas,
    .saucer${index} .video-cover,
    .saucer${index} .fairy {
      width: 100% !important;
      height: auto !important;
      max-width: 100%;
      object-fit: contain;
    }
    
    .saucer${index} iframe {
      width: 100% !important;
      height: 100% !important;
      max-width: 100%;
      min-height: 100px;
    }
    
    .saucer${index} .funky-text {
      font-size: clamp(0.7rem, 3.5vw, 1.25rem);
      text-align: center;
      word-break: break-word;
      margin-top: 0.5rem;
      line-height: 1.2;
    }
    
    @media (max-width: 768px) {
      .saucer${index} {
        padding: 0.5rem;
      }
      
      .saucer${index} .funky-text {
        margin-top: 0.25rem;
      }
    }
    
    @media (max-width: 480px) {
      .saucer${index} {
        padding: 0.25rem;
      }
    }
    
    /* Touch device optimizations */
    @media (hover: none) and (pointer: coarse) {
      .saucer${index} {
        cursor: pointer;
      }
      
      .saucer${index}:active {
        transform: scale(0.98) !important;
        transition: transform 0.1s ease;
      }
    }
  `;

  return `
    ${keyframesCss}
    ${mediaQueriesCss}
  `;
};

const GlobalEffectsStyle = createGlobalStyle`
  ${({ effects }) => effects.map((effect, index) => generateCssForEffect(effect, index)).join('\n')}
  
  /* Global responsive styles for all effects */
  @media (max-width: 768px) {
    .zdog-svg, .zdog-canvas, canvas, svg {
      width: 100% !important;
      height: auto !important;
    }
  }
`;

// ====================================================================
// 2. HELPER COMPONENTS
// ====================================================================

const SuperheroSVG = () => (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2222 337.5" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="a" gradientUnits="userSpaceOnUse" x1="1003.7" y1="97.5" x2="1003.7" y2="965.6" gradientTransform="matrix(0 -1 -1 0 1211.6 1211.6)">
          <stop stop-color="#00AEEF"/>
          <stop offset="1" stop-color="#000" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="b" gradientUnits="userSpaceOnUse" x1="1060.1" y1="193.7" x2="1060.1" y2="991.8" gradientTransform="matrix(0 -1 -1 0 1211.6 1211.6)">
          <stop stop-color="#008ABE"/>
          <stop offset="1" stop-color="#000" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="c" gradientUnits="userSpaceOnUse" x1="1148.2" y1="-308.2" x2="1148.2" y2="682" gradientTransform="matrix(0 -1 -1 0 1211.6 1211.6)">
          <stop stop-color="#00AEEF"/>
          <stop offset="1" stop-color="#000" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="d" gradientUnits="userSpaceOnUse" x1="1021" y1="-206.7" x2="1021" y2="821.1" gradientTransform="matrix(0 -1 -1 0 1211.6 1211.6)">
          <stop stop-color="#00AEEF"/>
          <stop offset="1" stop-color="#000" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="e" gradientUnits="userSpaceOnUse" x1="1032.3" y1="183.4" x2="1032.3" y2="986.7" gradientTransform="matrix(0 -1 -1 0 1211.6 1211.6)">
          <stop stop-color="#008ABE"/>
          <stop offset="1" stop-color="#000" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="f" gradientUnits="userSpaceOnUse" x1="982.1" y1="91.4" x2="982.1" y2="962.7" gradientTransform="matrix(0 -1 -1 0 1211.6 1211.6)">
          <stop stop-color="#00AEEF"/>
          <stop offset="1" stop-color="#000" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="g" gradientUnits="userSpaceOnUse" x1="1084.6" y1="189.6" x2="1084.6" y2="989.8" gradientTransform="matrix(0 -1 -1 0 1211.6 1211.6)">
          <stop stop-color="#008ABE"/>
          <stop offset="1" stop-color="#000" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="h" gradientUnits="userSpaceOnUse" x1="1139.7" y1="-310.6" x2="1139.7" y2="680.8" gradientTransform="matrix(0 -1 -1 0 1211.6 1211.6)">
          <stop stop-color="#00AEEF"/>
          <stop offset="1" stop-color="#000" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="i" gradientUnits="userSpaceOnUse" x1="1024.3" y1="-233" x2="1024.3" y2="1162.5" gradientTransform="matrix(0 -1 -1 0 1211.6 1211.6)">
          <stop stop-color="#00AEEF"/>
          <stop offset="1" stop-color="#000" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="j" gradientUnits="userSpaceOnUse" x1="966.5" y1="-194.8" x2="966.5" y2="810.1" gradientTransform="matrix(0 -1 -1 0 1211.6 1211.6)">
          <stop stop-color="#008ABE"/>
          <stop offset="1" stop-color="#000" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="k" gradientUnits="userSpaceOnUse" x1="1092.6" y1="256.8" x2="1092.6" y2="1157.2" gradientTransform="matrix(0 -1 -1 0 1211.6 1211.6)">
          <stop stop-color="#2E2E2E"/>
          <stop offset="1" stop-color="#000" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="l" gradientUnits="userSpaceOnUse" x1="1124.9" y1="583.1" x2="1124.9" y2="1130.4" gradientTransform="matrix(0 -1 -1 0 1211.6 1211.6)">
          <stop stop-color="#FFD000"/>
          <stop offset=".63" stop-color="#000" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <g opacity=".7">
        <polygon fill="url(#a)" points="1571.4 183.7 1839.3 183.7 1839.3 232 1832.2 232 1832.2 226.9-540 226.9-540 197.5 1571.4 197.5"/>
        <polygon fill="url(#b)" points="1576.6 121.5 1580 121.5 1580 181.5 1571.4 181.5 1571.4 177-540 177-540 132.5 1576.6 132.5"/>
        <polygon fill="url(#c)" points="2008 50.2 2008 76.5 2005.2 76.5 2005.2 67.2-540 67.2-540 50.2"/>
        <rect x="-540" y="183.7" fill="url(#d)" width="2111.4" height="13.8"/>
        <rect x="-540" y="177" fill="url(#e)" width="2111.4" height="4.5"/>
        <rect x="-540" y="226.9" fill="url(#f)" width="2372.2" height="5.1"/>
        <rect x="-540" y="121.5" fill="url(#g)" width="2116.6" height="11.1"/>
        <rect x="-540" y="67.2" fill="url(#h)" width="2545.2" height="9.3"/>
      </g>
      <polygon fill="url(#i)" points="1571.4 181.5 1571.4 183.7 1571.4 197.5-540 197.5-540 197.5-540 177-540 177 1571.4 177"/>
      <polygon fill="url(#j)" points="1832.2 232 1832.2 263.1-540 263.1-540 226.9-540 226.9 1832.2 226.9"/>
      <polygon fill="url(#k)" points="-540 106 1576.6 106 1576.6 121.5 1576.6 132.5-540 132.5-540 132.5-540 105.4-540 105.4"/>
      <polygon fill="url(#l)" points="2005.2 76.5 2005.2 106 1576.6 106-540 106-540 105.4-540 67.2-540 67.2 2005.2 67.2"/>
      <path fill="#E2A500" d="M1959.3 131.4c-2.4-11.3-12.1-56.2-73.4-62.2-61.3-6-362.9 0-362.9 0s-171.1 4.3-174.5 4.3 14.7 7.8 16.4 12.1c1.7 4.3-89 18.1-83.8 18.1 55.3 3.5 96.8 15.6 96.8 19c0 3.5.9 18.1.9 18.1l546 24.2C1924.8 165.1 1963.6 151.3 1959.3 131.4z"/>
      <path fill="#D09300" d="M1744.7 66.5c61.8-.2 118.3.4 141.2 2.7 23 2.3 38.7 10 49.5 19.3.5 2 1.9 3.6 4.7 4.5 1.1 1.1 2.1 2.3 3.1 3.4 0 0 0 0 .1.1 1 1.2 1.9 2.3 2.7 3.5l-37.5 48.9s-259.9 0-349 0l-37.7-1.7c-29.1-6.2 17.3-27.7 23.8-28.5 7.5-.9 56.6-2.8 56.6-2.8s27.3-17 35.8-18.9c8.5-1.9 39.6-5.7 51.8-5.7 12.3 0 48.1-12.3 48.1-12.3S1734.3 72.2 1744.7 66.5z"/>
      <path fill="#D09300" d="M1894.6 78.6c-10.7-2.5-437.3 5.8-472.9 5.8s-50.4 9.1 50.4 9.9 409.2 0 409.2 0l-13.3-15.7z"/>
      <path fill="#D09300" d="M1752.4 104.3s-261.2 0-320.8 0-45.5 5-10.7 5c34.7 0 86 0 122.4 0 36.4 0 71.9 5-28.1 5-100 0-23.1 6.6 46.3 6.6 69.4 0 195.9 0 195.9 0l-5 12.1z"/>
      <polygon fill="#D09300" points="1627.5 132.4 1398.5 132.4 1477.1 139.8 1648.2 139.8"/>
      <path fill="#1C1C1C" d="M1287.7 155c8.9 1 60.6-.7 68.5-2.4 7.9-1.7 24-2.1 24-2.1l96.5 10.2c-2.2 5.3-4.5 9.9-6.5 11.2-5.4 3.5-8.5 16.7-6.6 22.1.5 1.4 1.1 2.5 1.7 3.3-30.3-6.5-69.5-14.2-75.6-14.7-9.9-.7-53.7-3.1-69.5-5.1-15.7-2.1-37.7-11.6-40.1-15.1-2.4-3.6-1.3-8.8 7.6-8.7z"/>
      <path fill="#008ABE" d="M1465.2 197.4c-.6-.8-1.2-1.9-1.7-3.3-1.9-5.4 1.2-18.6 6.6-22.1 2-1.3 4.3-5.9 6.5-11.2l-55.2-5.9 139.4 14.8s130.8 8.6 111.3 40.1c-9.3 15-44.2 17.5-83.9 16.8-38-.7-52.7-9.2-58.5-12.7-8.2-3.4-26.4-5.8-28.4-7.9-.8-.8-16.9-4.5-36.6-8.7z"/>
      <path fill="#00AEEF" d="M1960.2 152.9c-1.2 18.5-19.1 75-62.5 97.1-43.4 22.1-94.9 16.6-122.9-1.5-12.5-8.1-25.7-17.7-32.4-19.9s-41.2-9.6-41.2-9.6v-92s97.8-9.6 113.3-14.7 89.7-28 107.4-22.8c17.7 5.2 41.2 19.2 38.3 63.4z"/>
      <path fill="#2E2E2E" d="M1711.8 211.5c-.8 3.8-2.7 10.6-4.8 10.6-2.1 0-20.5 1.7-60.6-9.9-3.8-2.7-.3-6.2-.3-6.2s35.6-10.6 39.7-32.2c4.1-21.6-16.1-45.9-32.9-49.6-9.9-3.4-1.4-3.4-1.4-3.4s70.2 1.4 71.2 4.5c1.1 3.1-8.5 79.8-9.9 86.3z"/>
      <path fill="#00AEEF" d="M1463.1 142.9c2.5-9.3 4.3-14.9 7.2-17.3 6-.7 10.8-1.1 13.5-1.1 13.4 0 38.3 34.2 39.4 32.5 1-1.7 6.2-1.4 10.6-6.2 3.1-7.5 101.3-54.4 145.8-15.1 12.5 11.1 13 71.2-25 80.4-38 9.2-88.7 4.5-102 1.7-13.4-2.7-15.4-12.3-18.8-13-3.4-.7-16.4-15.4-17.5-16.8-1.8 0-26.3-5.3-53.8-12.1-3.1-5.4-3.6-20.6-.1-33.6z"/>
      <path fill="#2E2E2E" d="M1462.5 176.1c-23.7-5.9-49.8-12.8-65.7-18.3-6.5-2.7-21.9-5.5-25.3-5.1-3.4.3-31.8-4.5-31.8-4.5s-47.9-2.7-67.8-9.6c-9.2-6.2 8.6-11.3 17.1-11 9.9-1 24.3-10.6 37.3-9.9 13 .7 34.9 13.4 40.7 12.7 5.8-.7 18.5-5.8 25.3-1.7 6.8 4.1 9.9 6.2 9.9 6.2s43.7-6.6 68-9.2c-2.9 2.4-4.7 8-7.2 17.3.1 15.2-3.5 30.4-6.6 42.8z"/>
      <path fill="#BB906D" d="M1955.4 178.6l-.7 1.4s-12.6 28.8-24.7 35.7-11.6 3.9-11.6 3.9l26.2-71.2 6.4-30.3 4.4 60.5z"/>
      <g fill="#ECC19C">
        <path d="M1932.9 195.2s15.5-35.6 18.1-77.1c-6.5-8.4-13.6-14.9-13.6-14.9s47.3-42.8 59-50.5 55.1-8.4 55.1 27.9-22.7 103-22.7 103 7.8 6.5 3.2 16.8-12.3 13-33.7 1.3c-21.4-11.7-33.7-28.5-33.7-28.5l-31.7 13z"/>
        <path d="M2034 152.4l18.1 7.8s-6.5-42.1-3.2-68c-14.3 19.4 0 57.8 0 57.8z"/>
        <path d="M2025.5 174.3s.1-11 6.5-6.2c6.4 4.9 5.9 5.8 5.2 8.5s-2 4.3-5.2 2.7c-1.7-.8-6.5-5-6.5-5z"/>
        <path d="M1975.7 99.6s-17.6-9.5-11.5-23.9 25.3-4.9 27.4 3.2c2.1 8-1.1 19.8-15.9 20.7z"/>
      </g>
      <path fill="#BB906D" d="M1971.3 141.9c3.1 6.3 19.7 37 26.2 42.7 6.6 5.8 15 10.1 19.1 15 3.6 4.2-1.6 3.3 1.6 6.8 1.9 1.2 1.4 2.1-.8 2.7-4.8-.7-11-3-19.1-7.5-21.4-11.7-33.7-28.5-33.7-28.5C1948.6 151 1938.4 100.3 1971.3 141.9z"/>
      <path fill="#2E2E2E" d="M2048.5 125.4s-7.5-3.6-15.6 1.7c-1.1-1.9-6.5-20.9-19.8-28.4s5.1-27.9 5.1-27.9l31.8 22.1.3 5.1s.7 1.5.7 2.2c0 .6-1.1 19.1-1.6 25.2-.1 1.2-.7 1.6-.7 1.6l-.2 1.4z"/>
      <path fill="#00AEEF" d="M1996.4 52.6c11.7-7.8 55.1-8.4 55.1 27.9 0 5.3-.5 11.2-1.3 17.4-4.3-5.1-11.6-11.7-22.5-14.7-10.5 15.3-10.2 43.5-10.2 43.5s-17.3-6.8-40.7 18.8c-1.1 1.2-7.1 3-26.8-16 .4-3.8-3.4-5.2-3.1-9.1-6.5-8.4-9.4-17.3-9.4-17.3s11.3-45.1 23-52.9z"/>
      <path class="eye" fill="#FFF" d="M2037.8 105.3s-3.5 3.8-5 2.8-7-10.7-7-10.7l12-7.5z"/>
      <path fill="#BB906D" d="M1990.4 77.3s8.9 9.5-4.6 23.9-21.3-1.4-18.7-8.6c2.6-7.3 23.3-15.3 23.3-15.3z"/>
      <path fill="#DFB28B" d="M1991.1 78.2c1.8 2.7 5.6 11-4.9 22.5-1.9.9-3.6 1.4-4.4 1.5-2.6.5-6.2-2.6-6.2-2.6l13.7-20.7 1.8-.7zM2028.8 199.9c-1.2 2.3-3.2 5.2-5.9 5.4-2.7.2-3.1-.3-4.8-1.3-1.6.5 1 3.4 3.1 3.4 2 0 1.4-1.4 1.4-1.4s3 1.2 6.8-5.6c1.5-3.3 1.7-5.7 1.9-6.9.1-.6.9-1.1.1-1.7-1.4-1.3-1.4-.3-.7.9.7 1.2.9 3.8-.9 7.1zM2028.9 176.8c.5.4 3.9 3.4 5.6 2.9s2.6-1.3.4-2.8-6.9-4.7-9.3-5.9-2.2 4.1-3.5 5z"/>
      <path fill="#BB906D" d="M2033.4 169.1c-4.8-3.3-24-20.3-24-20.3s4.5-6.7 4.2-6c-.4.7-.8 6.2-.8 6.2S2025.8 162.3 2033.4 169.1zM2052.1 160.2l-19.7-13.6c-.2-.1-.5.1-.3.3l5.8 7.2 14.2 6.1z"/>
      <path fill="#FFF200" d="M1949.5 116.1c2.6 45.8-13.5 79.2-24.5 95.7 17.4-6.3 29.7-31.9 29.7-31.9-3.4 9-15 36-27.9 42.6-12.9 6.6-21.1 9.3-21.1 9.3s35.4-59 37.4-105.7c-1.1-7.9-.8-13.4 0-17.3 2.5 2.6 3.7 3.8 6.4 7.3z"/>
      <path fill="#FFF200" d="m1881.6 242-2.3 1.6c-.6.5-1.1 1.1-1.3 1.5-.3.5-.3.9-.2 1.2.1.3.5.5.9.6.5.1 1.1.1 1.8 0 .7-.1 1.5-.3 2.4-.5.9-.3 1.8-.6 2.7-1l11.4-5.1c.3-.1.6-.2.9-.3.3-.1.5-.1.7-.1.2 0 .3 0 .4.1.1 0 .2.1.1.2s-.1.2-.2.4c-.1.1-.3.3-.5.5-.2.2-.4.3-.7.5-.3.2-.6.3-.9.4l-11 4.9c-.9.4-1.7.8-2.4 1.3.8-.4 1.4-.9 2-1.4.6-.5 1.1-.9 1.5-1.3.4-.4.6-.8.7-1.2.1-.3 0-.6-.3-.8-.3-.2-.7-.2-1.3-.2-.6 0-1.3.2-2.1.4-.8.2-1.7.6-2.7 1l-11.9 5.3c-.3.1-.7.3-1 .4-.3.1-.6.1-.8.2-.2 0-.4 0-.6 0-.2 0-.2-.1-.3-.2s0-.3.1-.4c.1-.2.3-.3.5-.5.2-.2.5-.4.8-.5.3-.2.6-.3 1-.5l23-10.1-27.3-11.9c-1.1.5-2.1 1-3 1.5z"/>
      <path fill="#FFD000" d="M1917.2 229.1c1.2-2.3 1.5-4.2 1-5.7-.6-1.7-2.2-2.8-4.8-3.4-2.8-.6-6.6-.5-11.4.4-5 .9-11 2.8-17.4 5.5-6.5 2.8-12.6 6.1-17.9 9.6-5.1 3.4-9.2 6.8-12.1 10.1-2.7 3-4.3 5.7-4.8 8-.4 2.1.3 3.7 1.9 4.9 1.5 1 3.8 1.5 6.4 1.6 2.5.1 5.4-.2 8.5-.9 3-.6 6.2-1.5 9.5-2.6 3.2-1.1 6.6-2.4 10.1-4 3.5-1.6 6.7-3.3 9.8-5.1 3.1-1.8 6-3.7 8.7-5.7 2.7-2 5.2-4.1 7.3-6.2 2.1-2.1 3.8-4.3 5-6.4zM1857 256c-1.2-1-1.5-2.5-1-4.3.6-1.9 2.1-4.2 4.4-6.7 2.5-2.6 5.9-5.4 10.1-8.1 4.2-2.8 9.1-5.4 14.3-7.6 5.1-2.2 9.9-3.7 14-4.6 3.9-.8 7.2-1 9.6-.6 2.3.4 3.8 1.2 4.5 2.5.6 1.2.5 2.7-.3 4.6-.8 1.7-2.2 3.6-4 5.4-1.7 1.8-3.8 3.6-6.2 5.3-2.3 1.7-4.8 3.4-7.5 5-2.7 1.6-5.6 3.1-8.6 4.5-3.1 1.4-6.1 2.6-8.9 3.5-2.9 1-5.7 1.7-8.2 2.2-2.7.5-5.1.7-7.1.6-2-.1-3.7-.7-4.8-1.7z"/>
      <path fill="#2E2E2E" d="M1912.6 231.1c.9-1.8.9-3.4.3-4.6-.7-1.3-2.2-2.1-4.5-2.5-2.4-.4-5.7-.2-9.6.6-4.1.9-8.9 2.4-14 4.6-5.2 2.2-10.1 4.9-14.3 7.6-4.1 2.7-7.6 5.5-10.1 8.1-2.4 2.5-3.9 4.7-4.4 6.7-.5 1.8-.2 3.3 1 4.3 1.1 1 2.9 1.5 5 1.6 2 .1 4.5-.1 7.1-.6 2.5-.5 5.3-1.2 8.2-2.2 2.8-.9 5.8-2.1 8.9-3.5 3-1.4 5.9-2.9 8.6-4.5 2.7-1.6 5.3-3.3 7.5-5 2.4-1.8 4.5-3.6 6.2-5.3 1.8-1.8 3.2-3.7 4-5.4zm-40.5 13.5c-.1-.3-.1-.7.2-1.2.3-.5.7-1 1.3-1.5.6-.5 1.4-1.1 2.3-1.6.9-.5 1.9-1.1 3-1.5l27.3-11.9-3.9 3.6-23 10.1c-.3.2-.7.3-1 .5-.3.2-.5.4-.8.5-.2.2-.4.3-.5.5-.1.2-.1.3-.1.4s.1.2.3.2c.2 0 .4 0 .6 0 .2 0 .5-.1.8-.2.3-.1.6-.2 1-.4l11.9-5.3c1-.4 1.9-.7 2.7-1 .8-.2 1.5-.4 2.1-.4.6 0 1 0 1.3.2.3.2.4.4.3.8-.1.3-.3.7-.7 1.2-.4.4-.9.9-1.5 1.3-.6.5-1.3.9-2 1.4-.8.4-1.6.9-2.4 1.3l-10.7 4.8c-.3.1-.6.3-.8.4-.3.1-.5.3-.7.4-.2.1-.3.3-.4.4-.1.1-.1.2-.1.3s.1.1.2.2c.1 0 .3 0 .5 0 .2 0 .4-.1.7-.2.3-.1.5-.2.8-.3l10.3-4.6c.8-.4 1.6-.7 2.3-.9.7-.2 1.3-.4 1.8-.4.5-.1.9 0 1.1.1.2.1.4.3.3.6-.1.3-.3.6-.6.9-.3.3-.8.7-1.3 1.1-.5.4-1.1.8-1.8 1.2-.7.4-1.4.8-2.1 1.1l-20.4 9.3 2.1-2.1 18.4-8.3c.3-.1.5-.2.7-.4.2-.1.4-.3.6-.4.2-.1.3-.3.4-.4.1-.1.2-.2.2-.3s0-.1-.1-.2c-.1 0-.2 0-.4 0-.2 0-.4.1-.6.1-.2.1-.5.2-.8.3l-10 4.5c-.8.4-1.6.7-2.4.9-.7.2-1.4.4-2 .5-.6.1-1.1.1-1.5.1-.4-.1-.7-.2-.8-.4-.1-.2 0-.6.2-.9.2-.4.6-.8 1.2-1.2.5-.4 1.2-.9 2-1.4.8-.5 1.6-.9 2.5-1.3l11-4.9c.3-.1.6-.3.9-.4.3-.2.5-.3.7-.5.2-.2.4-.3.5-.5.1-.1.2-.3.2-.4s0-.2-.1-.2c-.1 0-.3-.1-.4-.1-.2 0-.4.1-.7.1-.3.1-.6.2-.9.3l-11.4 5.1c-.9.4-1.9.8-2.7 1-.9.4-1.7.4-2.4.5-.7.1-1.3.1-1.8 0-.4 0-.7-.2-.8-.6z"/>
      <path fill="#008ABE" d="M1758.1 234.6c1.1.2 5.7-29.4 2.5-39-3.2-9.6-2.8-20.9-21.3-22.8-5.8-.6 12.7 15.1 10.8 36.3-1.2 14.4-10.4 27.4-10.4 25.5zM1913.6 172.5s-9.8 21.3-58.6.6c-15-6.4-12.3-8.7-17.1-8.7s-45.7 3.9-71.5-25.2c-2-2-34.2-2.8-43.5-6.5-9.3-3.6 25.2-21.6 26.1-21.6s157.5 19 164.6 40.9zM1536 198.6c-.3-1.5-1.1-7.3-4.7-10.1-3.6-2.8-3.1-15.2.7-16.6 3.7-1.5 17.9-13.7 32.3-15.2s-4.4 4.6-9 5.9c-4.6 1.3-22.3 16.3-20.2 26.1.9 9.8.5 12.6 0 9.9zM1530.5 182.3c-1 .5-2.2-.4-3.9-.9-1.8-.5-7.4.7-7.2-.7s13.3-2.2 14.3-4.5c1.1-2.4-1.4 5.2-3.2 6.1z"/>
      <path fill="#00AEEF" d="M1859.7 75.8s76.6-16.9 89 31.1c6.5 25-13.9 56.5-13.9 56.5-3.7 3.7-25 27.8-64 15.8l-29.2-19s-26 0-32.9-2.3c-7-2.3-34.8-16.7-38-20.4-2-.9-8.6-1.7-17.5-2.5 2.6-4.6 3.6-12.4 2.6-21.3-1-8.9.8-20.3-9.4-25.8-9 1.5 7-2 14.1-1.4 6 .9 7-.9 9.3-1.9s11.6-10.2 43.6-15.8c25.7-4.4 40 6.9 40 6.9z"/>
      <path fill="#2E2E2E" d="M1647.6 90.5c2.5 1.4 9.6 4.1 9.6 4.1l9.5 4.1 29.8.4c13-3.2 34.8-8.6 49.9-11.2 10.2 5.5 8.4 16.9 9.4 25.8 1 8.8 0 16.7-2.6 21.3-23.8-2.1-64.1-4.1-75.9-6.7-3.8-.4-7.6-.7-8.3-.5-1.4.4-5.7.4-8.1-.9-2.3-1.3-11.8-1.8-16.3-2.7-4.5-.9-23.1-.7-25.8-4.3-2.7-3.6-14-11.6-16.1-14.1s.4-6.1 1.4-10.7c1.1-4.7 6.1-5.2 6.1-5.2s2.1-5.2 4.7-7c2.5-1.8 2.7-1.8 4.3-1.8 1.6 0 3.8.4 3.8.4s.9-1.3 6.1-2.3c5.2-1.1 13.8 2.9 14.5 3.4.4.3-.4 2.1-.9 6z"/>
      <path fill="#1C1C1C" d="M1603 104c.2.6 1.5-2.1 2.8-3 1.3-.9 4.8-.4 5.6-.2.8.2 1.1-.6 1.1-.6s2.5-4.3 4.1-5.2 3.9-.4 4.6 0c.7.4 2.2-1.1 4.8-1.6 2.2-.5 4 1.1 4.1-.3.1-1.4 1.4-9.6 1.8-10.7s1.3-3.4-2.6-2.6c-3.9.8-6.3 2.4-6.3 2.4s-4.1-.8-5.4-.4c-1.3.4-5.7 5.4-6.7 8.3-1.7.7-4.7 1.8-5.1 2.6-.4.8-1.1 3.2-1.3 4.9-1.2 1.3-3.2 3.6-2.5 5.9z"/>
      <path fill="#008ABE" d="M1933.3 96.5c-8.8-1.5-20-8.8-43.8-5.8-18.6 2.9-34.4 11-34.4 11s-40.5-14.1-48.8-16.3c-10.9 2-24.3 2.6-21.7 1s24-8.2 28.4-9.3c4.4-1 18.3 11.1 22.4 12.6 4.1 1.5 18.4.1 24.5-1.9 6.1-2-4.9-5.2-4.7-7.2.1-2 4-1.3 10.3-3.8 6.4-2.5 14.5-3.2 35.7-1.4 21.4 1.8 52.6 24.6 32.9 21.2zM1819.8 110.9c-2.4 0 7.2-3.8 5.4-3.8s-8.6 3.5-12.4 4-20.8-.7-22.8-.3-12.8 4.5-12.5 6.1c.3 1.6 18 3.3 25 2s16.5-3.7 18.3-5.3c1.7-1.5.5-2.7-1-2.7z"/>
    </svg>
);

const DynamicMedia = ({ avatarLink }) => {
  const containerStyle = { 
    display: 'flex', 
    justifyContent: 'center', 
    width: '100%', 
    height: 'auto',
    maxWidth: '100%'
  };
  
  const mediaStyle = {
    width: '100%',
    height: 'auto',
    maxWidth: '100%',
    objectFit: 'contain'
  };
  
  // Check for raw SVG string
  if (typeof avatarLink === 'string' && avatarLink.trim().startsWith('<')) {
    return <div style={containerStyle} className="rounded-lg" dangerouslySetInnerHTML={{ __html: avatarLink }} />;
  }

  // Check for YouTube
  const ytMatch = avatarLink.match(/(?:youtube(?:-nocookie)?\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return (
      <div style={containerStyle} className="video-cover">
        <iframe 
          style={{ width: '100%', height: '100%', minHeight: '100px' }}
          src={`https://www.youtube.com/embed/${ytMatch[1]}?controls=0&showinfo=0&rel=0`} 
          frameBorder="0" 
          allowFullScreen
        />
      </div>
    );
  }

  // Check for Vimeo
  const vimeoMatch = avatarLink.match(/^https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)(?:[?]?.*)$/im);
  if (vimeoMatch && vimeoMatch[3]) {
    return (
      <div style={containerStyle}>
        <iframe 
          style={{ width: '100%', height: '100%', minHeight: '100px' }}
          allow="camera; microphone; fullscreen; display-capture; autoplay" 
          src={`https://player.vimeo.com/video/${vimeoMatch[3]}?h=33160d1512&color=de0101`} 
          frameBorder="0" 
          allow="autoplay; fullscreen; picture-in-picture" 
          allowFullScreen
        />
      </div>
    );
  }
  
  // Default to an image
  return (
    <div className="fairy flex flex-col items-center justify-center p-4 space-y-2 rounded-lg" style={containerStyle}>
      <img 
        className="rounded-lg" 
        loading="lazy" 
        src={avatarLink} 
        style={mediaStyle}
        alt="Effect visual" 
      />
    </div>
  );
};

// ====================================================================
// 3. ANIMATION INITIALIZERS (Modified for fixed dimensions)
// ====================================================================

const animationInitializers = {
    bee: (element) => {
    const TAU = Zdog.TAU;
    let isSpinning = true;
    
    // Color palette
    const yellow = 'rgb(255, 200, 0, 1)';

    let illo = new Zdog.Illustration({
        element: element,
        dragRotate: true,
        width: 250,
        height: 250,
    });

    let body = new Zdog.Anchor({
        addTo: illo,
    });

    let head = new Zdog.Ellipse({
        addTo: body,
        diameter: 16,
        stroke: 32,
        fill: true,
        color: yellow,
    });

    let eyes = new Zdog.Shape({
        addTo: body,
        translate: { z: -24 },
        path: [
            { x: 12, y: -4 },  // start
            { x: 12, y: 4 },   // line to 
            { move: { x: -12, y: -4 } }, // move to left
            { x: -12, y: 4 },  // line to 
        ],
        closed: false,
        stroke: 12,
        color: '#000',
    });

    let sensor = new Zdog.Ellipse({
        addTo: head,
        translate: { x: 8, y: -32, z: -16 },
        rotate: { y: TAU/4 },
        diameter: 32,
        quarters: 1,
        stroke: 12,
        color: '#000',
    });
    
    sensor.copy({
        translate: { x: -8, y: -32, z: -16 },
    });

    let ring1 = new Zdog.Ellipse({
        addTo: head,
        translate: { z: 26 },
        diameter: 42,
        stroke: 16,
        color: '#000',
    });

    let ring2 = new Zdog.Ellipse({
        addTo: ring1,
        translate: { z: 18 },
        diameter: 48,
        stroke: 16,
        color: yellow,
    });

    let ring3 = new Zdog.Ellipse({
        addTo: ring2,
        translate: { z: 18 },
        diameter: 42,
        stroke: 16,
        color: '#000',
    });

    let ring4 = new Zdog.Ellipse({
        addTo: ring3,
        translate: { z: 18 },
        diameter: 24,
        stroke: 16,
        color: yellow,
    });

    let stinger = new Zdog.Shape({
        addTo: ring4,
        translate: { z: 18 },
        stroke: 16,
        color: '#000',
    });

    let anchorWingL = new Zdog.Anchor({
        addTo: body,
        translate: { x: 42, z: 42 },
    });

    let wing = new Zdog.RoundedRect({
        addTo: anchorWingL,
        translate: { x: 32 },
        rotate: { x: TAU/4 },
        width: 64,
        height: 42,
        cornerRadius: 8,
        stroke: 12,
        fill: true,
        color: 'rgba(89, 171, 255, 0.6)',
    });

    let anchorWingR = new Zdog.Anchor({
        addTo: body,
        translate: { x: -42, z: 42 },
    });

    let wingR = new Zdog.RoundedRect({
        addTo: anchorWingR,
        translate: { x: -32 },
        rotate: { x: TAU/4 },
        width: 64,
        height: 42,
        cornerRadius: 8,
        stroke: 12,
        fill: true,
        color: 'rgba(89, 171, 255, 0.6)',
    });

    let t = 1;
    const tSpeed = 1/2.89;
    let animationFrameId;

    function animate() {
        t += tSpeed;
        var theta = t * TAU;
        anchorWingL.rotate.z = 1.5 * (Math.sin(theta));
        anchorWingL.rotate.x = 0.5 * (Math.cos(theta));
        anchorWingR.rotate.z = -1.5 * (Math.sin(theta));
        anchorWingR.rotate.x = -0.5 * (Math.cos(theta));
        illo.rotate.y += isSpinning ? -0.02 : 0;
        illo.updateRenderGraph();
        animationFrameId = requestAnimationFrame(animate);
    }

    animate();
    
    return () => {
        cancelAnimationFrame(animationFrameId);
    };
},
  // Other animation initializers would go here with fixed dimensions
  // For brevity, I'm showing only the bee example, but apply similar fixed dimensions to all
  
  // Simplified placeholder for other effects
  plane: () => () => {},
  saucer: () => () => {},
  bird: () => () => {},
  real: () => () => {},
  coffee: () => () => {},
  time: () => () => {},
  fire: () => () => {},
  burger: () => () => {},
  ball: () => () => {}
};

// ====================================================================
// 4. BOUNDARY-AWARE MOVEMENT HOOK - WITH RESIZE OBSERVER
// ====================================================================

const useBoundaryAwareMovement = (elementRef, movingPattern, speed = 2) => {
  const animationRef = useRef(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const directionRef = useRef({ x: 1, y: 1 });
  const elementSizeRef = useRef({ width: 250, height: 250 });
  const isAnimatingRef = useRef(true);

  useEffect(() => {
    if (!elementRef.current || movingPattern === 'none') return;

    const element = elementRef.current;
    
    // Get element dimensions with resize observer for responsiveness
    const updateElementSize = () => {
      const rect = element.getBoundingClientRect();
      const newWidth = rect.width;
      const newHeight = rect.height;
      
      // Only update if size actually changed
      if (newWidth !== elementSizeRef.current.width || newHeight !== elementSizeRef.current.height) {
        const oldWidth = elementSizeRef.current.width;
        const oldHeight = elementSizeRef.current.height;
        
        elementSizeRef.current = {
          width: newWidth,
          height: newHeight
        };
        
        // Adjust position proportionally when size changes
        if (oldWidth > 0 && oldHeight > 0) {
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          // Recalculate position boundaries
          let newX = Math.min(Math.max(positionRef.current.x, 0), viewportWidth - newWidth);
          let newY = Math.min(Math.max(positionRef.current.y, 0), viewportHeight - newHeight);
          
          positionRef.current = { x: newX, y: newY };
          element.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
        }
      }
    };
    
    // Use ResizeObserver for responsive size changes
    const resizeObserver = new ResizeObserver(() => {
      updateElementSize();
    });
    resizeObserver.observe(element);
    
    updateElementSize();
    
    // Set initial position based on moving pattern
    const setInitialPosition = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const elementW = elementSizeRef.current.width;
      const elementH = elementSizeRef.current.height;
      
      let startX, startY;
      
      switch(movingPattern) {
        case 'topright':
          startX = viewportWidth - elementW - 20;
          startY = 20;
          directionRef.current = { x: -1, y: 1 };
          break;
        case 'bottomleft':
          startX = 20;
          startY = viewportHeight - elementH - 20;
          directionRef.current = { x: 1, y: -1 };
          break;
        case 'leftbottom':
          startX = 20;
          startY = viewportHeight - elementH - 20;
          directionRef.current = { x: 1, y: -1 };
          break;
        case 'lefttop':
          startX = 20;
          startY = 20;
          directionRef.current = { x: 1, y: 1 };
          break;
        default:
          startX = 20;
          startY = 20;
          directionRef.current = { x: 1, y: 1 };
      }
      
      positionRef.current = { x: startX, y: startY };
      element.style.transform = `translate3d(${startX}px, ${startY}px, 0)`;
    };
    
    setInitialPosition();
    
    // Handle window resize
    const handleResize = () => {
      updateElementSize();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const elementW = elementSizeRef.current.width;
      const elementH = elementSizeRef.current.height;
      
      // Clamp position to new boundaries
      let newX = Math.min(Math.max(positionRef.current.x, 0), viewportWidth - elementW);
      let newY = Math.min(Math.max(positionRef.current.y, 0), viewportHeight - elementH);
      
      positionRef.current = { x: newX, y: newY };
      element.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation loop with boundary checking
    const moveSpeed = speed;
    
    const animateMovement = () => {
      if (!isAnimatingRef.current) return;
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const elementW = elementSizeRef.current.width;
      const elementH = elementSizeRef.current.height;
      
      let newX = positionRef.current.x + directionRef.current.x * moveSpeed;
      let newY = positionRef.current.y + directionRef.current.y * moveSpeed;
      
      // Check X boundaries and bounce
      if (newX <= 0) {
        newX = 0;
        directionRef.current.x = 1;
      } else if (newX >= viewportWidth - elementW) {
        newX = viewportWidth - elementW;
        directionRef.current.x = -1;
      }
      
      // Check Y boundaries and bounce
      if (newY <= 0) {
        newY = 0;
        directionRef.current.y = 1;
      } else if (newY >= viewportHeight - elementH) {
        newY = viewportHeight - elementH;
        directionRef.current.y = -1;
      }
      
      // Only update if position changed
      if (newX !== positionRef.current.x || newY !== positionRef.current.y) {
        positionRef.current = { x: newX, y: newY };
        element.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
      }
      
      animationRef.current = requestAnimationFrame(animateMovement);
    };
    
    isAnimatingRef.current = true;
    animationRef.current = requestAnimationFrame(animateMovement);
    
    return () => {
      isAnimatingRef.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [elementRef, movingPattern, speed]);
};

// ====================================================================
// 5. THE INDIVIDUAL EFFECT COMPONENT (Modified with fixed container)
// ====================================================================

const AnimatedEffect = ({ effect, index }) => {
  const animationRef = useRef(null);
  const containerRef = useRef(null);
  const movingPattern = effect.moving_pattern || 'topright';
  
  // Apply boundary-aware movement
  useBoundaryAwareMovement(containerRef, movingPattern, 2);

  useEffect(() => {
    if (!animationRef.current) return;
    
    const initializer = animationInitializers[effect.moving_effect];
    if (initializer) {
      const cleanup = initializer(animationRef.current);
      return cleanup;
    }
  }, [effect.moving_effect]);

  const renderVisual = () => {
    switch(effect.moving_effect) {
      case 'bee': 
        return <svg ref={animationRef} className="zdog-svg" style={{ width: '100%', height: 'auto' }}></svg>;
      case 'qr': 
        return <div className="fairy rounded-lg" style={{ width: '100%', height: 'auto' }}>
          <img 
            className="rounded-lg" 
            loading="lazy" 
            src="/qr/123.png" 
            style={{ width: '100%', height: 'auto' }}
            alt="QR Code" 
          />
        </div>;
      case 'saucer': 
        return <svg ref={animationRef} id="challenge" style={{ width: '100%', height: 'auto' }}></svg>;
      case 'bird': 
        return <canvas ref={animationRef} id="canvas" style={{ width: '100%', height: 'auto' }}></canvas>;
      case 'plane': 
        return <canvas ref={animationRef} className="zdog-canvas" style={{ width: '100%', height: 'auto' }}></canvas>;
      case 'real': 
        return <canvas ref={animationRef} className="illo" style={{ width: '100%', height: 'auto' }}></canvas>;
      case 'coffee': 
        return <svg ref={animationRef} id="coffee" style={{ width: '100%', height: 'auto' }}></svg>;
      case 'time': 
        return <canvas ref={animationRef} className="time" style={{ width: '100%', height: 'auto' }}></canvas>;
      case 'fire': 
        return <canvas ref={animationRef} id="fire" style={{ width: '100%', height: 'auto', zIndex:999999 }}></canvas>;
      case 'burger': 
        return <canvas ref={animationRef} className="zdog-burger" style={{ width: '100%', height: 'auto' }}></canvas>;
      case 'ball': 
        return <canvas ref={animationRef} className="zdog-ball" style={{ width: '100%', height: 'auto' }}></canvas>;
      case 'superhero': 
        return <div style={{ width: '100%', height: 'auto' }}><SuperheroSVG /></div>;
      default: 
        return <DynamicMedia avatarLink={effect.avatar_link} />;
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`saucer${index}`} 
      style={{ 
        position: 'fixed',
        left: 0,
        top: 0,
        width: 'min(250px, 25vw)',
        height: 'min(250px, 25vw)',
        transform: 'translate3d(0, 0, 0)',
        transition: 'none',
        willChange: 'transform'
      }}
    >
      <a href={effect.landing_page} className="w-full text-center text-white-600" style={{ width: '100%', height: '100%', display: 'block' }} target="_blank" rel="noopener noreferrer">
        {renderVisual()}
        <h1 className="funky-text text-4xl text-lime-400 font-extrabold">
          <div dangerouslySetInnerHTML={{ __html: (effect.brand_message || '').replace(/ /g, '<br />') }} />
        </h1>
      </a>
      <style jsx>{`
        .funky-text {
          font-family: 'Comic Sans MS', cursive, sans-serif;
          text-shadow: 2px 2px 0 #000;
          font-size: clamp(0.75rem, 3vw, 1.25rem);
        }
      `}</style>
    </div>
  );
};

// ====================================================================
// 6. THE MAIN PARENT COMPONENT
// ====================================================================

const EffectsDisplay = ({ effects }) => {
  if (!Array.isArray(effects) || effects.length === 0) {
    return null;
  }
  
  return (
    <>
      <GlobalEffectsStyle effects={effects} />
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', overflow: 'hidden', pointerEvents: 'none' }}>
        {effects.map((effect, index) => (
          <AnimatedEffect key={index} effect={effect} index={index} />
        ))}
      </div>
    </>
  );
};

export default EffectsDisplay;