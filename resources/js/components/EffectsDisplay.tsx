import React, { useEffect, useRef } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import Zdog from 'zdog';
import { gsap, Linear } from 'gsap';

// ====================================================================
// 1. DYNAMIC CSS GENERATION
// This part replaces the PHP <style> block. It dynamically generates
// all the necessary keyframes and class styles based on the effects data.
// ====================================================================

const generateCssForEffect = (effect, index) => {
  const { moving_effect, moving_pattern } = effect;
  let keyframesCss = '';
  let mediaQueriesCss = '';

  const widths = {
    saucer: { base: '42%', sm: '42%', md: '31%', lg: '24%', xl: '19%' },
    real: { base: '80%', sm: '80%', md: '40%', lg: '32%', xl: '25%' },
    default: { base: '44%', sm: '44%', md: '33%', lg: '25%', xl: '21%' }
  };
  const effectWidths = widths[moving_effect] || widths.default;

  // Diagonal animations using 'transform'
  if (['bottomleft', 'leftbottom', 'lefttop', 'topright'].includes(moving_pattern)) {
    switch (moving_pattern) {
      case 'bottomleft':
        keyframesCss = `@keyframes fly${index} {
          0% { transform: translate(600px, 600px); } 
          10% { transform: translate(500px, 500px); }
          40% { transform: translate(400px, 400px); } 
          50% { transform: translate(300px, 300px); }
          60% { transform: translate(200px, 200px); } 
          90% { transform: translate(100px, 100px); }
          100% { transform: translate(10px, 10px); }
        }`;
        break;
      case 'leftbottom':
        keyframesCss = `@keyframes fly${index} {
          0% { bottom:150%; transform: translate(600px, 600px); } 
          10% { bottom:130%; transform: translate(500px, 500px); }
          40% { bottom:100%; transform: translate(400px, 400px); } 
          50% { bottom:80%; transform: translate(300px, 300px); }
          60% { bottom:50%; transform: translate(200px, 200px); } 
          90% { bottom:40%; transform: translate(100px, 100px); }
          100% { bottom:10%; transform: translate(10px, 10px); }
        }`;
        break;
      case 'lefttop':
        keyframesCss = `@keyframes fly${index} {
          0% { bottom:0%; transform: translate(10px, 10px); } 
          10% { bottom:20%; transform: translate(100px, 100px); }
          40% { bottom:50%; transform: translate(200px, 200px); } 
          50% { bottom:60%; transform: translate(300px, 300px); }
          60% { bottom:80%; transform: translate(400px, 400px); } 
          90% { bottom:100%; transform: translate(500px, 500px); }
          100% { bottom:120%; transform: translate(600px, 600px); }
        }`;
        break;
      case 'topright':
        keyframesCss = `@keyframes fly${index} {
          0% { transform: translate(10px, 10px); } 
          10% { transform: translate(100px, 100px); }
          40% { transform: translate(200px, 200px); } 
          50% { transform: translate(300px, 300px); }
          60% { transform: translate(400px, 400px); } 
          90% { transform: translate(500px, 500px); }
          100% { transform: translate(600px, 600px); }
        }`;
        break;
      default: break;
    }
    
    mediaQueriesCss = `
      .saucer${index} { 
        animation: fly${index} 6s linear infinite alternate; /* Changed from 3s to 6s */
        font-size: ${moving_effect === 'bee' ? '40px' : 'inherit'};
      }
    `;
  } else { // Horizontal/Vertical animations
    keyframesCss = `@keyframes fly${index} {
      0% { ${moving_pattern}: 0%; }
      50% { ${moving_pattern}: 50%; }
      100% { ${moving_pattern}: 0%; }
    }`;
    mediaQueriesCss = `
      .saucer${index} {
        animation: fly${index} 20s ease-in-out infinite; /* Changed from 10s to 20s */
      }
    `;
  }

  // Common styles and media queries for width
  return `
    ${keyframesCss}
    .saucer${index} {
      margin: 2em auto;
      position: absolute;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      row-gap: 0.5rem;
      border-radius: 0.5rem;
    }
    @media (max-width: 576px) { .saucer${index} { width: ${effectWidths.base}; } }
    @media (min-width: 576px) { .saucer${index} { width: ${effectWidths.sm}; } }
    @media (min-width: 768px) { .saucer${index} { width: ${effectWidths.md}; } }
    @media (min-width: 992px) { .saucer${index} { width: ${effectWidths.lg}; } }
    @media (min-width: 1200px) { .saucer${index} { width: ${effectWidths.xl}; } }
    ${mediaQueriesCss}
  `;
};

const GlobalEffectsStyle = createGlobalStyle`
  ${({ effects }) => effects.map((effect, index) => generateCssForEffect(effect, index)).join('\n')}
`;

// ====================================================================
// 2. HELPER COMPONENTS
// For rendering specific complex visuals like the Superhero SVG
// or dynamic media like YouTube/Vimeo videos.
// ====================================================================

const SuperheroSVG = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2222 337.5"><defs><linearGradient id="a" gradientUnits="userSpaceOnUse" x1="1003.7" y1="97.5" x2="1003.7" y2="965.6" gradientTransform="matrix(0 -1 -1 0 1211.6 1211.6)"><stop stop-color="#00AEEF"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient><linearGradient id="b" gradientUnits="userSpaceOnUse" x1="1060.1" y1="193.7" x2="1060.1" y2="991.8" gradientTransform="matrix(0 -1 -1 0 1211.6 1211.6)"><stop stop-color="#008ABE"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient><linearGradient id="c" gradientUnits="userSpaceOnUse" x1="1148.2" y1="-308.2" x2="1148.2" y2="682" gradientTransform="matrix(0 -1 -1 0 1211.6 1211.6)"><stop stop-color="#00AEEF"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient><linearGradient id="d" gradientUnits="userSpaceOnUse" x1="1021" y1="-206.7" x2="1021" y2="821.1" gradientTransform="matrix(0 -1 -1 0 1211.6 1211.6)"><stop stop-color="#00AEEF"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient><linearGradient id="e" gradientUnits="userSpaceOnUse" x1="1032.3" y1="183.4" x2="1032.3" y2="986.7" gradientTransform="matrix(0 -1 -1 0 1211.6 1211.6)"><stop stop-color="#008ABE"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient><linearGradient id="f" gradientUnits="userSpaceOnUse" x1="982.1" y1="91.4" x2="982.1" y2="962.7" gradientTransform="matrix(0 -1 -1 0 1211.6 1211.6)"><stop stop-color="#00AEEF"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="1084.6" y1="189.6" x2="1084.6" y2="989.8" gradientTransform="matrix(0 -1 -1 0 1211.6 1211.6)"><stop stop-color="#008ABE"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient><linearGradient id="h" gradientUnits="userSpaceOnUse" x1="1139.7" y1="-310.6" x2="1139.7" y2="680.8" gradientTransform="matrix(0 -1 -1 0 1211.6 1211.6)"><stop stop-color="#00AEEF"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient><linearGradient id="i" gradientUnits="userSpaceOnUse" x1="1024.3" y1="-233" x2="1024.3" y2="1162.5" gradientTransform="matrix(0 -1 -1 0 1211.6 1211.6)"><stop stop-color="#00AEEF"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient><linearGradient id="j" gradientUnits="userSpaceOnUse" x1="966.5" y1="-194.8" x2="966.5" y2="810.1" gradientTransform="matrix(0 -1 -1 0 1211.6 1211.6)"><stop stop-color="#008ABE"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient><linearGradient id="k" gradientUnits="userSpaceOnUse" x1="1092.6" y1="256.8" x2="1092.6" y2="1157.2" gradientTransform="matrix(0 -1 -1 0 1211.6 1211.6)"><stop stop-color="#2E2E2E"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient><linearGradient id="l" gradientUnits="userSpaceOnUse" x1="1124.9" y1="583.1" x2="1124.9" y2="1130.4" gradientTransform="matrix(0 -1 -1 0 1211.6 1211.6)"><stop stop-color="#FFD000"/><stop offset=".63" stop-color="#000" stop-opacity="0"/></linearGradient></defs><g opacity=".7"><polygon fill="url(#a)" points="1571.4 183.7 1839.3 183.7 1839.3 232 1832.2 232 1832.2 226.9-540 226.9-540 197.5 1571.4 197.5"/><polygon fill="url(#b)" points="1576.6 121.5 1580 121.5 1580 181.5 1571.4 181.5 1571.4 177-540 177-540 132.5 1576.6 132.5"/><polygon fill="url(#c)" points="2008 50.2 2008 76.5 2005.2 76.5 2005.2 67.2-540 67.2-540 50.2"/><rect x="-540" y="183.7" fill="url(#d)" width="2111.4" height="13.8"/><rect x="-540" y="177" fill="url(#e)" width="2111.4" height="4.5"/><rect x="-540" y="226.9" fill="url(#f)" width="2372.2" height="5.1"/><rect x="-540" y="121.5" fill="url(#g)" width="2116.6" height="11.1"/><rect x="-540" y="67.2" fill="url(#h)" width="2545.2" height="9.3"/></g><polygon fill="url(#i)" points="1571.4 181.5 1571.4 183.7 1571.4 197.5-540 197.5-540 197.5-540 177-540 177 1571.4 177"/><polygon fill="url(#j)" points="1832.2 232 1832.2 263.1-540 263.1-540 226.9-540 226.9 1832.2 226.9"/><polygon fill="url(#k)" points="-540 106 1576.6 106 1576.6 121.5 1576.6 132.5-540 132.5-540 132.5-540 105.4-540 105.4"/><polygon fill="url(#l)" points="2005.2 76.5 2005.2 106 1576.6 106-540 106-540 105.4-540 67.2-540 67.2 2005.2 67.2"/><path fill="#E2A500" d="M1959.3 131.4c-2.4-11.3-12.1-56.2-73.4-62.2-61.3-6-362.9 0-362.9 0s-171.1 4.3-174.5 4.3 14.7 7.8 16.4 12.1c1.7 4.3-89 18.1-83.8 18.1 55.3 3.5 96.8 15.6 96.8 19c0 3.5.9 18.1.9 18.1l546 24.2C1924.8 165.1 1963.6 151.3 1959.3 131.4z"/><path fill="#D09300" d="M1744.7 66.5c61.8-.2 118.3.4 141.2 2.7 23 2.3 38.7 10 49.5 19.3.5 2 1.9 3.6 4.7 4.5 1.1 1.1 2.1 2.3 3.1 3.4 0 0 0 0 .1.1 1 1.2 1.9 2.3 2.7 3.5l-37.5 48.9s-259.9 0-349 0l-37.7-1.7c-29.1-6.2 17.3-27.7 23.8-28.5 7.5-.9 56.6-2.8 56.6-2.8s27.3-17 35.8-18.9c8.5-1.9 39.6-5.7 51.8-5.7 12.3 0 48.1-12.3 48.1-12.3S1734.3 72.2 1744.7 66.5z"/><path fill="#D09300" d="M1894.6 78.6c-10.7-2.5-437.3 5.8-472.9 5.8s-50.4 9.1 50.4 9.9 409.2 0 409.2 0l-13.3-15.7z"/><path fill="#D09300" d="M1752.4 104.3s-261.2 0-320.8 0-45.5 5-10.7 5c34.7 0 86 0 122.4 0 36.4 0 71.9 5-28.1 5-100 0-23.1 6.6 46.3 6.6 69.4 0 195.9 0 195.9 0l-5 12.1z"/><polygon fill="#D09300" points="1627.5 132.4 1398.5 132.4 1477.1 139.8 1648.2 139.8"/><path fill="#1C1C1C" d="M1287.7 155c8.9 1 60.6-.7 68.5-2.4 7.9-1.7 24-2.1 24-2.1l96.5 10.2c-2.2 5.3-4.5 9.9-6.5 11.2-5.4 3.5-8.5 16.7-6.6 22.1.5 1.4 1.1 2.5 1.7 3.3-30.3-6.5-69.5-14.2-75.6-14.7-9.9-.7-53.7-3.1-69.5-5.1-15.7-2.1-37.7-11.6-40.1-15.1-2.4-3.6-1.3-8.8 7.6-8.7z"/><path fill="#008ABE" d="M1465.2 197.4c-.6-.8-1.2-1.9-1.7-3.3-1.9-5.4 1.2-18.6 6.6-22.1 2-1.3 4.3-5.9 6.5-11.2l-55.2-5.9 139.4 14.8s130.8 8.6 111.3 40.1c-9.3 15-44.2 17.5-83.9 16.8-38-.7-52.7-9.2-58.5-12.7-8.2-3.4-26.4-5.8-28.4-7.9-.8-.8-16.9-4.5-36.6-8.7z"/><path fill="#00AEEF" d="M1960.2 152.9c-1.2 18.5-19.1 75-62.5 97.1-43.4 22.1-94.9 16.6-122.9-1.5-12.5-8.1-25.7-17.7-32.4-19.9s-41.2-9.6-41.2-9.6v-92s97.8-9.6 113.3-14.7 89.7-28 107.4-22.8c17.7 5.2 41.2 19.2 38.3 63.4z"/><path fill="#2E2E2E" d="M1711.8 211.5c-.8 3.8-2.7 10.6-4.8 10.6-2.1 0-20.5 1.7-60.6-9.9-3.8-2.7-.3-6.2-.3-6.2s35.6-10.6 39.7-32.2c4.1-21.6-16.1-45.9-32.9-49.6-9.9-3.4-1.4-3.4-1.4-3.4s70.2 1.4 71.2 4.5c1.1 3.1-8.5 79.8-9.9 86.3z"/><path fill="#00AEEF" d="M1463.1 142.9c2.5-9.3 4.3-14.9 7.2-17.3 6-.7 10.8-1.1 13.5-1.1 13.4 0 38.3 34.2 39.4 32.5 1-1.7 6.2-1.4 10.6-6.2 3.1-7.5 101.3-54.4 145.8-15.1 12.5 11.1 13 71.2-25 80.4-38 9.2-88.7 4.5-102 1.7-13.4-2.7-15.4-12.3-18.8-13-3.4-.7-16.4-15.4-17.5-16.8-1.8 0-26.3-5.3-53.8-12.1-3.1-5.4-3.6-20.6-.1-33.6z"/><path fill="#2E2E2E" d="M1462.5 176.1c-23.7-5.9-49.8-12.8-65.7-18.3-6.5-2.7-21.9-5.5-25.3-5.1-3.4.3-31.8-4.5-31.8-4.5s-47.9-2.7-67.8-9.6c-9.2-6.2 8.6-11.3 17.1-11 9.9-1 24.3-10.6 37.3-9.9 13 .7 34.9 13.4 40.7 12.7 5.8-.7 18.5-5.8 25.3-1.7 6.8 4.1 9.9 6.2 9.9 6.2s43.7-6.6 68-9.2c-2.9 2.4-4.7 8-7.2 17.3.1 15.2-3.5 30.4-6.6 42.8z"/><path fill="#BB906D" d="M1955.4 178.6l-.7 1.4s-12.6 28.8-24.7 35.7-11.6 3.9-11.6 3.9l26.2-71.2 6.4-30.3 4.4 60.5z"/><g fill="#ECC19C"><path d="M1932.9 195.2s15.5-35.6 18.1-77.1c-6.5-8.4-13.6-14.9-13.6-14.9s47.3-42.8 59-50.5 55.1-8.4 55.1 27.9-22.7 103-22.7 103 7.8 6.5 3.2 16.8-12.3 13-33.7 1.3c-21.4-11.7-33.7-28.5-33.7-28.5l-31.7 13z"/><path d="M2034 152.4l18.1 7.8s-6.5-42.1-3.2-68c-14.3 19.4 0 57.8 0 57.8z"/><path d="M2025.5 174.3s.1-11 6.5-6.2c6.4 4.9 5.9 5.8 5.2 8.5s-2 4.3-5.2 2.7c-1.7-.8-6.5-5-6.5-5z"/><path d="M1975.7 99.6s-17.6-9.5-11.5-23.9 25.3-4.9 27.4 3.2c2.1 8-1.1 19.8-15.9 20.7z"/></g><path fill="#BB906D" d="M1971.3 141.9c3.1 6.3 19.7 37 26.2 42.7 6.6 5.8 15 10.1 19.1 15 3.6 4.2-1.6 3.3 1.6 6.8 1.9 1.2 1.4 2.1-.8 2.7-4.8-.7-11-3-19.1-7.5-21.4-11.7-33.7-28.5-33.7-28.5C1948.6 151 1938.4 100.3 1971.3 141.9z"/><path fill="#2E2E2E" d="M2048.5 125.4s-7.5-3.6-15.6 1.7c-1.1-1.9-6.5-20.9-19.8-28.4s5.1-27.9 5.1-27.9l31.8 22.1.3 5.1s.7 1.5.7 2.2c0 .6-1.1 19.1-1.6 25.2-.1 1.2-.7 1.6-.7 1.6l-.2 1.4z"/><path fill="#00AEEF" d="M1996.4 52.6c11.7-7.8 55.1-8.4 55.1 27.9 0 5.3-.5 11.2-1.3 17.4-4.3-5.1-11.6-11.7-22.5-14.7-10.5 15.3-10.2 43.5-10.2 43.5s-17.3-6.8-40.7 18.8c-1.1 1.2-7.1 3-26.8-16 .4-3.8-3.4-5.2-3.1-9.1-6.5-8.4-9.4-17.3-9.4-17.3s11.3-45.1 23-52.9z"/><path class="eye" fill="#FFF" d="M2037.8 105.3s-3.5 3.8-5 2.8-7-10.7-7-10.7l12-7.5z"/><path fill="#BB906D" d="M1990.4 77.3s8.9 9.5-4.6 23.9-21.3-1.4-18.7-8.6c2.6-7.3 23.3-15.3 23.3-15.3z"/><path fill="#DFB28B" d="M1991.1 78.2c1.8 2.7 5.6 11-4.9 22.5-1.9.9-3.6 1.4-4.4 1.5-2.6.5-6.2-2.6-6.2-2.6l13.7-20.7 1.8-.7zM2028.8 199.9c-1.2 2.3-3.2 5.2-5.9 5.4-2.7.2-3.1-.3-4.8-1.3-1.6.5 1 3.4 3.1 3.4 2 0 1.4-1.4 1.4-1.4s3 1.2 6.8-5.6c1.5-3.3 1.7-5.7 1.9-6.9.1-.6.9-1.1.1-1.7-1.4-1.3-1.4-.3-.7.9.7 1.2.9 3.8-.9 7.1zM2028.9 176.8c.5.4 3.9 3.4 5.6 2.9s2.6-1.3.4-2.8-6.9-4.7-9.3-5.9-2.2 4.1-3.5 5z"/><path fill="#BB906D" d="M2033.4 169.1c-4.8-3.3-24-20.3-24-20.3s4.5-6.7 4.2-6c-.4.7-.8 6.2-.8 6.2S2025.8 162.3 2033.4 169.1zM2052.1 160.2l-19.7-13.6c-.2-.1-.5.1-.3.3l5.8 7.2 14.2 6.1z"/><path fill="#FFF200" d="M1949.5 116.1c2.6 45.8-13.5 79.2-24.5 95.7 17.4-6.3 29.7-31.9 29.7-31.9-3.4 9-15 36-27.9 42.6-12.9 6.6-21.1 9.3-21.1 9.3s35.4-59 37.4-105.7c-1.1-7.9-.8-13.4 0-17.3 2.5 2.6 3.7 3.8 6.4 7.3z"/><path fill="#FFF200" d="m1881.6 242-2.3 1.6c-.6.5-1.1 1.1-1.3 1.5-.3.5-.3.9-.2 1.2.1.3.5.5.9.6.5.1 1.1.1 1.8 0 .7-.1 1.5-.3 2.4-.5.9-.3 1.8-.6 2.7-1l11.4-5.1c.3-.1.6-.2.9-.3.3-.1.5-.1.7-.1.2 0 .3 0 .4.1.1 0 .2.1.1.2s-.1.2-.2.4c-.1.1-.3.3-.5.5-.2.2-.4.3-.7.5-.3.2-.6.3-.9.4l-11 4.9c-.9.4-1.7.8-2.4 1.3.8-.4 1.4-.9 2-1.4.6-.5 1.1-.9 1.5-1.3.4-.4.6-.8.7-1.2.1-.3 0-.6-.3-.8-.3-.2-.7-.2-1.3-.2-.6 0-1.3.2-2.1.4-.8.2-1.7.6-2.7 1l-11.9 5.3c-.3.1-.7.3-1 .4-.3.1-.6.1-.8.2-.2 0-.4 0-.6 0-.2 0-.2-.1-.3-.2s0-.3.1-.4c.1-.2.3-.3.5-.5.2-.2.5-.4.8-.5.3-.2.6-.3 1-.5l23-10.1-27.3-11.9c-1.1.5-2.1 1-3 1.5z"/><path fill="#FFD000" d="M1917.2 229.1c1.2-2.3 1.5-4.2 1-5.7-.6-1.7-2.2-2.8-4.8-3.4-2.8-.6-6.6-.5-11.4.4-5 .9-11 2.8-17.4 5.5-6.5 2.8-12.6 6.1-17.9 9.6-5.1 3.4-9.2 6.8-12.1 10.1-2.7 3-4.3 5.7-4.8 8-.4 2.1.3 3.7 1.9 4.9 1.5 1 3.8 1.5 6.4 1.6 2.5.1 5.4-.2 8.5-.9 3-.6 6.2-1.5 9.5-2.6 3.2-1.1 6.6-2.4 10.1-4 3.5-1.6 6.7-3.3 9.8-5.1 3.1-1.8 6-3.7 8.7-5.7 2.7-2 5.2-4.1 7.3-6.2 2.1-2.1 3.8-4.3 5-6.4zM1857 256c-1.2-1-1.5-2.5-1-4.3.6-1.9 2.1-4.2 4.4-6.7 2.5-2.6 5.9-5.4 10.1-8.1 4.2-2.8 9.1-5.4 14.3-7.6 5.1-2.2 9.9-3.7 14-4.6 3.9-.8 7.2-1 9.6-.6 2.3.4 3.8 1.2 4.5 2.5.6 1.2.5 2.7-.3 4.6-.8 1.7-2.2 3.6-4 5.4-1.7 1.8-3.8 3.6-6.2 5.3-2.3 1.7-4.8 3.4-7.5 5-2.7 1.6-5.6 3.1-8.6 4.5-3.1 1.4-6.1 2.6-8.9 3.5-2.9 1-5.7 1.7-8.2 2.2-2.7.5-5.1.7-7.1.6-2-.1-3.7-.7-4.8-1.7z"/><path fill="#2E2E2E" d="M1912.6 231.1c.9-1.8.9-3.4.3-4.6-.7-1.3-2.2-2.1-4.5-2.5-2.4-.4-5.7-.2-9.6.6-4.1.9-8.9 2.4-14 4.6-5.2 2.2-10.1 4.9-14.3 7.6-4.1 2.7-7.6 5.5-10.1 8.1-2.4 2.5-3.9 4.7-4.4 6.7-.5 1.8-.2 3.3 1 4.3 1.1 1 2.9 1.5 5 1.6 2 .1 4.5-.1 7.1-.6 2.5-.5 5.3-1.2 8.2-2.2 2.8-.9 5.8-2.1 8.9-3.5 3-1.4 5.9-2.9 8.6-4.5 2.7-1.6 5.3-3.3 7.5-5 2.4-1.8 4.5-3.6 6.2-5.3 1.8-1.8 3.2-3.7 4-5.4zm-40.5 13.5c-.1-.3-.1-.7.2-1.2.3-.5.7-1 1.3-1.5.6-.5 1.4-1.1 2.3-1.6.9-.5 1.9-1.1 3-1.5l27.3-11.9-3.9 3.6-23 10.1c-.3.2-.7.3-1 .5-.3.2-.5.4-.8.5-.2.2-.4.3-.5.5-.1.2-.1.3-.1.4s.1.2.3.2c.2 0 .4 0 .6 0 .2 0 .5-.1.8-.2.3-.1.6-.2 1-.4l11.9-5.3c1-.4 1.9-.7 2.7-1 .8-.2 1.5-.4 2.1-.4.6 0 1 0 1.3.2.3.2.4.4.3.8-.1.3-.3.7-.7 1.2-.4.4-.9.9-1.5 1.3-.6.5-1.3.9-2 1.4-.8.4-1.6.9-2.4 1.3l-10.7 4.8c-.3.1-.6.3-.8.4-.3.1-.5.3-.7.4-.2.1-.3.3-.4.4-.1.1-.1.2-.1.3s.1.1.2.2c.1 0 .3 0 .5 0 .2 0 .4-.1.7-.2.3-.1.5-.2.8-.3l10.3-4.6c.8-.4 1.6-.7 2.3-.9.7-.2 1.3-.4 1.8-.4.5-.1.9 0 1.1.1.2.1.4.3.3.6-.1.3-.3.6-.6.9-.3.3-.8.7-1.3 1.1-.5.4-1.1.8-1.8 1.2-.7.4-1.4.8-2.1 1.1l-20.4 9.3 2.1-2.1 18.4-8.3c.3-.1.5-.2.7-.4.2-.1.4-.3.6-.4.2-.1.3-.3.4-.4.1-.1.2-.2.2-.3s0-.1-.1-.2c-.1 0-.2 0-.4 0-.2 0-.4.1-.6.1-.2.1-.5.2-.8.3l-10 4.5c-.8.4-1.6.7-2.4.9-.7.2-1.4.4-2 .5-.6.1-1.1.1-1.5.1-.4-.1-.7-.2-.8-.4-.1-.2 0-.6.2-.9.2-.4.6-.8 1.2-1.2.5-.4 1.2-.9 2-1.4.8-.5 1.6-.9 2.5-1.3l11-4.9c.3-.1.6-.3.9-.4.3-.2.5-.3.7-.5.2-.2.4-.3.5-.5.1-.1.2-.3.2-.4s0-.2-.1-.2c-.1 0-.3-.1-.4-.1-.2 0-.4.1-.7.1-.3.1-.6.2-.9.3l-11.4 5.1c-.9.4-1.9.8-2.7 1-.9.3-1.7.4-2.4.5-.7.1-1.3.1-1.8 0-.4 0-.7-.2-.8-.6z"/><path fill="#008ABE" d="M1758.1 234.6c1.1.2 5.7-29.4 2.5-39-3.2-9.6-2.8-20.9-21.3-22.8-5.8-.6 12.7 15.1 10.8 36.3-1.2 14.4-10.4 27.4-10.4 25.5zM1913.6 172.5s-9.8 21.3-58.6.6c-15-6.4-12.3-8.7-17.1-8.7s-45.7 3.9-71.5-25.2c-2-2-34.2-2.8-43.5-6.5-9.3-3.6 25.2-21.6 26.1-21.6s157.5 19 164.6 40.9zM1536 198.6c-.3-1.5-1.1-7.3-4.7-10.1-3.6-2.8-3.1-15.2.7-16.6 3.7-1.5 17.9-13.7 32.3-15.2s-4.4 4.6-9 5.9c-4.6 1.3-22.3 16.3-20.2 26.1.9 9.8.5 12.6 0 9.9zM1530.5 182.3c-1 .5-2.2-.4-3.9-.9-1.8-.5-7.4.7-7.2-.7s13.3-2.2 14.3-4.5c1.1-2.4-1.4 5.2-3.2 6.1z"/><path fill="#00AEEF" d="M1859.7 75.8s76.6-16.9 89 31.1c6.5 25-13.9 56.5-13.9 56.5-3.7 3.7-25 27.8-64 15.8l-29.2-19s-26 0-32.9-2.3c-7-2.3-34.8-16.7-38-20.4-2-.9-8.6-1.7-17.5-2.5 2.6-4.6 3.6-12.4 2.6-21.3-1-8.9.8-20.3-9.4-25.8-9 1.5 7-2 14.1-1.4 6 .9 7-.9 9.3-1.9s11.6-10.2 43.6-15.8c25.7-4.4 40 6.9 40 6.9z"/><path fill="#2E2E2E" d="M1647.6 90.5c2.5 1.4 9.6 4.1 9.6 4.1l9.5 4.1 29.8.4c13-3.2 34.8-8.6 49.9-11.2 10.2 5.5 8.4 16.9 9.4 25.8 1 8.8 0 16.7-2.6 21.3-23.8-2.1-64.1-4.1-75.9-6.7-3.8-.4-7.6-.7-8.3-.5-1.4.4-5.7.4-8.1-.9-2.3-1.3-11.8-1.8-16.3-2.7-4.5-.9-23.1-.7-25.8-4.3-2.7-3.6-14-11.6-16.1-14.1s.4-6.1 1.4-10.7c1.1-4.7 6.1-5.2 6.1-5.2s2.1-5.2 4.7-7c2.5-1.8 2.7-1.8 4.3-1.8 1.6 0 3.8.4 3.8.4s.9-1.3 6.1-2.3c5.2-1.1 13.8 2.9 14.5 3.4.4.3-.4 2.1-.9 6z"/><path fill="#1C1C1C" d="M1603 104c.2.6 1.5-2.1 2.8-3 1.3-.9 4.8-.4 5.6-.2.8.2 1.1-.6 1.1-.6s2.5-4.3 4.1-5.2 3.9-.4 4.6 0c.7.4 2.2-1.1 4.8-1.6 2.2-.5 4 1.1 4.1-.3.1-1.4 1.4-9.6 1.8-10.7s1.3-3.4-2.6-2.6c-3.9.8-6.3 2.4-6.3 2.4s-4.1-.8-5.4-.4c-1.3.4-5.7 5.4-6.7 8.3-1.7.7-4.7 1.8-5.1 2.6-.4.8-1.1 3.2-1.3 4.9-1.2 1.3-3.2 3.6-2.5 5.9z"/><path fill="#008ABE" d="M1933.3 96.5c-8.8-1.5-20-8.8-43.8-5.8-18.6 2.9-34.4 11-34.4 11s-40.5-14.1-48.8-16.3c-10.9 2-24.3 2.6-21.7 1s24-8.2 28.4-9.3c4.4-1 18.3 11.1 22.4 12.6 4.1 1.5 18.4.1 24.5-1.9 6.1-2-4.9-5.2-4.7-7.2.1-2 4-1.3 10.3-3.8 6.4-2.5 14.5-3.2 35.7-1.4 21.4 1.8 52.6 24.6 32.9 21.2zM1819.8 110.9c-2.4 0 7.2-3.8 5.4-3.8s-8.6 3.5-12.4 4-20.8-.7-22.8-.3-12.8 4.5-12.5 6.1c.3 1.6 18 3.3 25 2s16.5-3.7 18.3-5.3c1.7-1.5.5-2.7-1-2.7z"/></svg>
);

const DynamicMedia = ({ avatarLink }) => {
  // Check for raw SVG string
  if (typeof avatarLink === 'string' && avatarLink.trim().startsWith('<')) {
    return <div style={{ display: 'flex', justifyContent: 'center' }} className="rounded-lg" dangerouslySetInnerHTML={{ __html: avatarLink }} />;
  }

  // Check for YouTube
  const ytMatch = avatarLink.match(/(?:youtube(?:-nocookie)?\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }} className="video-cover">
        <iframe src={`https://www.youtube.com/embed/${ytMatch[1]}?controls=0&showinfo=0&rel=0`} frameBorder="0" allowFullScreen></iframe>
      </div>
    );
  }

  // Check for Vimeo
  const vimeoMatch = avatarLink.match(/^https?:\/\/(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)(?:[?]?.*)$/im);
  if (vimeoMatch && vimeoMatch[3]) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <iframe allow="camera; microphone; fullscreen; display-capture; autoplay" src={`https://player.vimeo.com/video/${vimeoMatch[3]}?h=33160d1512&color=de0101`} width="50%" frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen></iframe>
      </div>
    );
  }
  
  // Default to an image
  return (
    <div className="fairy flex flex-col items-center justify-center p-4 space-y-2 rounded-lg ">
      <img className="rounded-lg" loading="lazy" src={avatarLink} width="100%" alt="Effect visual" />
    </div>
  );
};

const animationInitializers = {
    bee: (element) => {
    const TAU = Zdog.TAU;
    let isSpinning = true;
    let delta = TAU * 2/32;
    
    // Color palette
    const white = '#ffffff';
    const lightblue = '#2ce8f4';
    const darkblue = '#0484d1';
    const lightgrey = '#afbfd2';
    const darkgrey = '4f6781';
    const lightgreen = '#63c64d';
    const midgreen = '#327345';
    const darkgreen = '#193d3f';
    const yellow = 'rgb(255, 200, 0, 1)';
    const orange = '#fb922b';
    const red = '#e53b44';
    const bordeaux = '#9e2835';
    const lightbrown = '#e4a672';
    const midbrown = '#b86f50';
    const darkbrown = '#743f39';
    const darkerbrown = '#3f2832';

    let illo = new Zdog.Illustration({
        element: element,
        dragRotate: true,
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
   plane: (element) => {
    const TAU = Zdog.TAU;

    let sceneSize = 800;
    let propSpeed = 4;
    let cloudSpeed = 10;
    let isSpinning = false;
    const camgreen = "#78866b";
    const grey = "#C1C1C1";
    const yellow = "#FFB904";
    const red = "#BE251D";
    const blue = "#2D347E";
    const lightblue = "#a8ccd7";
    const black = "#000000";
    const white = "#FFFFFF";
    const ivory = "#FAFAF8";
    const lightyellowgreen = "#F5F5F3";

    let animationObject = { bladeRotationY: 0, cloudZ: 1000 };

    const illo = new Zdog.Illustration({
        element: element,
        dragRotate: true,
        resize: "fullscreen",
        onDragStart: function () {
            isSpinning = false;
        },
        onResize: function (width, height) {
            let minSize = Math.min(width, height);
            this.zoom = minSize / sceneSize;
        },
        rotate: { x: -TAU / 8, y: -Zdog.TAU / -8 }
    });

    let plane = new Zdog.Anchor({
        addTo: illo,
        translate: { y: 24 },
        rotate: { x: TAU / 4 }
    });

    let bodyfront = new Zdog.Cylinder({
        addTo: plane,
        diameter: 40,
        length: 20,
        translate: { y: 60, z: 10 },
        rotate: { x: -TAU / 4 },
        stroke: false,
        color: camgreen
    });

    let propcone = new Zdog.Cone({
        addTo: plane,
        diameter: 40,
        length: 40,
        stroke: false,
        color: grey,
        translate: { y: 70, z: 10 },
        rotate: { x: -TAU / 4 }
    });

    let pAnchor = new Zdog.Anchor({
        addTo: plane,
        translate: { y: 100, z: 10 },
        rotate: { z: (Math.PI / 180) * animationObject.bladeRotationY }
    });

    let conetip = new Zdog.Cone({
        addTo: pAnchor,
        length: 10,
        diameter: 10,
        color: yellow,
        rotate: { x: -TAU / 4 }
    });

    let propblade = new Zdog.Shape({
        addTo: pAnchor,
        path: [
            { z: 0, y: 0 },
            {
                arc: [
                    { z: 20, y: 0, x: 10 },
                    { z: 50, y: 0, x: 0 }
                ]
            },
            {
                arc: [
                    { z: 20, y: 0, x: -10 },
                    { z: 0, y: 0 }
                ]
            }
        ],
        closed: true,
        stroke: 1,
        color: black,
        fill: true
    });

    propblade.copy({ rotate: { y: -TAU / 3 } });
    propblade.copy({ rotate: { y: TAU / 3 } });

    let bodygroup = new Zdog.Group({ addTo: plane, translate: { x: 0, y: 15, z: 10 } });

    let bodymid = new Zdog.Rect({
        addTo: plane,
        width: 20,
        height: 80,
        stroke: 35,
        color: camgreen,
        translate: { z: 10, y: 10 }
    });

    bodymid.copy({
        height: 20,
        translate: { z: 20, y: -60 },
        depth: 40,
        width: 10,
        stroke: 45
    });

    bodymid.copy({
        height: 10,
        translate: { z: 20, y: -100 },
        depth: 10,
        width: 5,
        stroke: 35
    });

    bodymid.copy({
        height: 10,
        translate: { z: 20, y: -130 },
        depth: 20,
        width: 1,
        stroke: 25
    });

    let cockpit = new Zdog.Rect({
        addTo: plane,
        width: 10,
        height: 15,
        stroke: 15,
        color: lightblue,
        translate: { z: 35, x: 0, y: -15 }
    });

    let bodyoutercircleL = new Zdog.Ellipse({
        addTo: bodymid,
        diameter: 35,
        stroke: 5,
        fill: false,
        color: yellow,
        translate: { z: 10, y: -70, x: 21 },
        rotate: { x: TAU / 4, y: TAU / 4 }
    });

    bodyoutercircleL.copy({ color: blue, diameter: 25 });
    bodyoutercircleL.copy({ color: white, diameter: 15 });
    bodyoutercircleL.copy({ color: red, diameter: 5 });
    bodyoutercircleL.copy({ translate: { z: 10, y: -70, x: -21 } });
    bodyoutercircleL.copy({ color: blue, diameter: 25, translate: { z: 10, y: -70, x: -21 } });
    bodyoutercircleL.copy({ color: white, diameter: 15, translate: { z: 10, y: -70, x: -21 } });
    bodyoutercircleL.copy({ color: red, diameter: 5, translate: { z: 10, y: -70, x: -21 } });

    let tail = new Zdog.RoundedRect({
        addTo: plane,
        width: 20,
        height: 30,
        cornerRadius: 100,
        stroke: 20,
        color: camgreen,
        translate: { z: 35, y: -150 },
        rotate: { x: TAU / 4, y: TAU / 4 }
    });

    tail.copy({
        rotate: { x: TAU / 2, z: TAU / 4 },
        translate: { x: 20, z: 35, y: -140 },
        stroke: 5,
        color: camgreen,
        fill: true
    });

    tail.copy({
        rotate: { x: TAU / 2, z: TAU / 4 },
        translate: { x: -20, z: 35, y: -140 },
        stroke: 5,
        color: camgreen,
        fill: true
    });

    let tailstripe = new Zdog.Rect({
        addTo: tail,
        width: 3,
        height: 15,
        stroke: 2,
        fill: true,
        color: blue,
        translate: { z: -10, y: 10, x: 5 }
    });

    let stripe2 = tailstripe.copy({
        color: white,
        height: 15,
        translate: { x: 0, z: -10, y: 10 }
    });

    let stripe3 = tailstripe.copy({
        color: red,
        height: 9,
        translate: { x: -5, z: -10, y: 7 }
    });

    tailstripe.copy({ translate: { z: 10, y: 10, x: 5 } });
    stripe2.copy({ translate: { x: 0, z: 10, y: 10 } });
    stripe3.copy({ translate: { x: -5, z: 10, y: 7 } });

    let wingL = new Zdog.Group({
        addTo: plane,
        translate: { z: -20, y: -10 },
        rotate: { x: TAU / 4 }
    });

    let wing = new Zdog.Shape({
        addTo: wingL,
        path: [
            { z: 0, y: 30, x: 30 },
            {
                arc: [
                    { z: 0, y: 30, x: 150 },
                    { z: 0, y: 0, x: 150 }
                ]
            },
            {
                arc: [
                    { z: 0, y: -30, x: 150 },
                    { z: 0, y: -30, x: 30 }
                ]
            }
        ],
        closed: true,
        stroke: 10,
        color: camgreen,
        fill: true,
        translate: { y: 20, z: -20, x: -10 },
        rotate: { x: TAU / 4 }
    });

    wing.copy({
        translate: { y: 20, z: -20, x: 10 },
        rotate: { z: -TAU / 2, x: TAU / 4 }
    });

    let wingoutercircleL = new Zdog.Ellipse({
        addTo: wingL,
        diameter: 40,
        stroke: 2,
        fill: true,
        color: blue,
        translate: { y: 15, z: -22, x: 90 },
        rotate: { x: TAU / 4 }
    });

    let winginnercircleL = new Zdog.Ellipse({
        addTo: wingL,
        diameter: 20,
        stroke: 2,
        fill: true,
        color: red,
        translate: { y: 15, z: -22, x: 90 },
        rotate: { x: TAU / 4 }
    });

    wingoutercircleL.copy({ translate: { x: -90, z: -22, y: 15 } });
    winginnercircleL.copy({ translate: { x: -90, z: -22, y: 15 } });

    let cloudAnchor = new Zdog.Anchor({
        addTo: illo,
        translate: { x: -50, y: -10, z: animationObject.cloudZ }
    });

    let cloudShape = new Zdog.Shape({
        addTo: cloudAnchor,
        translate: { x: -50, y: -50, z: -3 },
        stroke: 40,
        color: lightyellowgreen
    });

    cloudShape.copyGraph({ translate: { x: -50, y: -46, z: 3 }, stroke: 34, color: ivory });
    cloudShape.copyGraph({ translate: { x: -30, y: -44 }, stroke: 30, color: ivory });
    cloudShape.copyGraph({ translate: { x: -66, y: -40 }, stroke: 20, color: ivory });

    let cloud2 = cloudAnchor.copyGraph({ translate: { x: 150, y: 120, z: animationObject.cloudZ } });
    let cloud3 = cloudAnchor.copyGraph({ translate: { x: -20, y: 120, z: animationObject.cloudZ } });
    let cloud4 = cloudAnchor.copyGraph({ translate: { x: -220, y: 70, z: animationObject.cloudZ } });
    let cloud5 = cloudAnchor.copyGraph({ translate: { x: 250, y: 40, z: animationObject.cloudZ } });

    const tl = gsap.timeline({ repeat: -1 });
    const tl2 = gsap.timeline({ repeat: -1 });

    tl.to(animationObject, propSpeed, {
        bladeRotationY: 360,
        ease: Linear.easeNone
    });

    tl2.to(animationObject, cloudSpeed, {
        cloudZ: -1000,
        ease: Linear.easeNone
    });

    let animationFrameId;
    function animate() {
        pAnchor.rotate.y = (Math.PI / 180) * animationObject.bladeRotationY;
        cloudAnchor.translate.z = animationObject.cloudZ;
        cloud2.translate.z = animationObject.cloudZ;
        cloud3.translate.z = animationObject.cloudZ;
        cloud4.translate.z = animationObject.cloudZ;
        cloud5.translate.z = animationObject.cloudZ;
        illo.rotate.y -= isSpinning ? -0.02 : 0;
        illo.updateRenderGraph();
        animationFrameId = requestAnimationFrame(animate);
    }

    animate();

    return () => {
        tl.kill();
        tl2.kill();
        cancelAnimationFrame(animationFrameId);
    };
},
    saucer: (element) => { // color palette
		let pink = "#F8E2EF";
		let yellow = "#F1E4A4";
		let lightmint = "#EDFFF9";
		let mint = "#B6EFC6";
		let vividgreen = "#62CE76";
		let swamp = "#4E6142";
		let lavendar = "#9F92E3";
		let lavendar2 = "#D9C8F3";
		let purple = "#A498E2";
		let violet = "#6D5E9F";
		let sheer = "rgba(255,255,255,.55)";

		let TAU = Zdog.TAU;

		let illo = new Zdog.Illustration({
		element: "#challenge",
		dragRotate: true
		});

		// alien
		const alienGroup = new Zdog.Group({
		addTo: illo,
		translate: { y: -55, z: 60 }
		});
		new Zdog.Shape({
		addTo: alienGroup,
		stroke: 20,
		color: mint
		});
		const antenna = new Zdog.Group({
		addTo: alienGroup,
		rotate: { z: TAU / 20 }
		});
		new Zdog.Shape({
		addTo: antenna,
		path: [{ y: -15 }, { y: -18 }],
		color: mint
		});
		new Zdog.Shape({
		addTo: antenna,
		stroke: 2.5,
		color: mint,
		translate: { y: -18 }
		});
		antenna.copyGraph({
		rotate: { z: -TAU / 20 }
		});

		const alienFaceGroup = new Zdog.Group({
		addTo: illo,
		translate: { y: -55, z: 60 }
		});
		const eye = new Zdog.Ellipse({
		addTo: alienFaceGroup,
		width: 1,
		height: 2,
		color: swamp,
		rotate: { z: TAU / 10 },
		translate: { x: 2.5, z: 15 }
		});
		eye.copy({
		rotate: { z: -TAU / 10 },
		translate: { x: -2.5, z: 15 }
		});
		new Zdog.Ellipse({
		addTo: alienFaceGroup,
		height: 3,
		quarters: 2,
		rotate: { z: TAU / 4 },
		translate: { y: 2, z: 15 },
		color: swamp
		});

		// ufo
		const ufoGroup = new Zdog.Group({
		addTo: illo,
		rotate: { x: TAU / 4 },
		translate: { y: -47.5, z: 50 }
		});
		new Zdog.Ellipse({
		addTo: ufoGroup,
		diameter: 130,
		stroke: 5,
		color: lightmint,
		fill: true
		});
		const pit = new Zdog.Hemisphere({
		addTo: ufoGroup,
		diameter: 80,
		rotate: { x: TAU / 2 },
		color: lightmint
		});
		pit.copy({
		rotate: { x: 0 },
		translate: { z: 2.5 },
		color: sheer,
		fill: false
		});

		// background
		new Zdog.Ellipse({
		addTo: illo,
		diameter: 160,
		stroke: 50,
		translate: { z: -25 },
		color: violet,
		fill: true
		});

		// midground
		const midground = new Zdog.Group({
		addTo: illo,
		translate: { z: 25 }
		});
		new Zdog.Ellipse({
		addTo: midground,
		stroke: 50,
		diameter: 160,
		quarters: 2,
		rotate: { z: TAU / 4 },
		color: purple
		});
		const smallPuffMG = new Zdog.Shape({
		addTo: midground,
		stroke: 20,
		color: purple,
		translate: { x: 17.5, y: 35 }
		});
		const medPuffMG = new Zdog.Shape({
		addTo: midground,
		stroke: 35,
		color: purple,
		translate: { y: 45 }
		});
		smallPuffMG.copy({
		translate: { x: -20, y: 32.5 }
		});
		medPuffMG.copy({
		translate: { x: 37.5, y: 20 }
		});
		medPuffMG.copy({
		translate: { x: -35, y: 20 }
		});
		smallPuffMG.copy({
		translate: { x: 55, y: 5 }
		});
		smallPuffMG.copy({
		translate: { x: -50, y: 7.5 }
		});
		const filler = new Zdog.Ellipse({
		addTo: midground,
		diameter: 100,
		quarters: 1,
		rotate: { z: (3 * TAU) / 8 },
		stroke: 35,
		color: purple
		});

		// foreground
		const foreground = new Zdog.Group({
		addTo: illo,
		translate: { z: 75 }
		});
		new Zdog.Ellipse({
		addTo: foreground,
		diameter: 160,
		quarters: 1,
		stroke: 50,
		rotate: { z: (3 * TAU) / 8 },
		translate: { y: 5 },
		color: lavendar2
		});
		const smallPuffFG = new Zdog.Shape({
		addTo: foreground,
		stroke: 20,
		color: lavendar2,
		translate: { x: 20, y: 55 }
		});
		const medPuffFG = new Zdog.Shape({
		addTo: foreground,
		stroke: 35,
		color: lavendar2,
		translate: { y: 65 }
		});
		const bigPuffFG = new Zdog.Shape({
		addTo: foreground,
		stroke: 50,
		translate: { x: 80, y: 32.5 },
		color: lavendar2
		});
		smallPuffFG.copy({
		translate: { x: 35, y: 45 }
		});
		medPuffFG.copy({
		translate: { x: 100, y: 22.5 }
		});
		medPuffFG.copy({
		translate: { x: 80, y: 50 }
		});
		smallPuffFG.copy({
		translate: { x: -17.5, y: 50 }
		});
		medPuffFG.copy({
		translate: { x: -40, y: 45 }
		});
		medPuffFG.copy({
		translate: { x: -65, y: 40 }
		});
		bigPuffFG.copy({
		translate: { x: -90, y: 22.5 }
		});
		medPuffFG.copy({
		translate: { x: -85, y: 55 }
		});

		// stars from Dave DeSandro's Kirby
		const starGroup = new Zdog.Group({
		addTo: illo
		});
		const starArray = [];

		var starPath = (function () {
		var path = [];
		var starRadiusA = 3;
		var starRadiusB = 1.7;
		for (var i = 0; i < 10; i++) {
			var radius = i % 2 ? starRadiusA : starRadiusB;
			var angle = (TAU * i) / 10 + TAU / 4;
			var point = {
			x: Math.cos(angle) * radius,
			y: Math.sin(angle) * radius
			};
			path.push(point);
		}
		return path;
		})();
		var star = new Zdog.Shape({
		addTo: starGroup,
		path: starPath,
		translate: { y: -4.5 },
		stroke: 2,
		translate: { y: -85 },
		color: yellow,
		fill: true
		});
		starArray.push(star);
		starArray.push(
		star.copy({
			translate: { x: 42.5, y: -73.6 },
			rotate: { y: 1 }
		})
		);
		starArray.push(
		star.copy({
			translate: { x: 73.6, y: -42.5 },
			rotate: { y: -3 }
		})
		);
		starArray.push(
		star.copy({
			translate: { x: -42.5, y: -73.6 },
			rotate: { y: -1 }
		})
		);
		starArray.push(
		star.copy({
			translate: { x: -73.6, y: -42.5 },
			rotate: { y: 3 }
		})
		);
		starArray.push(
		star.copy({
			translate: { x: 0, y: -55 },
			rotate: { y: 1.25 }
		})
		);
		starArray.push(
		star.copy({
			translate: { x: 39, y: -27.5 },
			rotate: { y: -1 }
		})
		);
		starArray.push(
		star.copy({
			translate: { x: -39, y: -27.5 },
			rotate: { y: 1 }
		})
		);
		starArray.push(
		star.copy({
			translate: { y: -20 },
			rotate: { y: 3.5 }
		})
		);
		starArray.push(
		star.copy({
			translate: { y: 15 },
			rotate: { y: 4.75 }
		})

		);

		let isSpinning = true;
		let alienDirection = "up";

		function animate() {
		for (let s of starArray) {
			s.rotate.y += isSpinning ? 0.025 : 0;
		}

		if (isSpinning && alienGroup.translate.y < -55) {
			alienDirection = "down";
		} else if (isSpinning && alienGroup.translate.y > -45) {
			alienDirection = "up";
		}
		alienGroup.translate.y += !isSpinning
			? 0
			: alienDirection == "up"
			? -0.1
			: 0.1;
		alienFaceGroup.translate.y += !isSpinning
			? 0
			: alienDirection == "up"
			? -0.1
			: 0.1;
		ufoGroup.translate.y += !isSpinning ? 0 : alienDirection == "up" ? -0.1 : 0.1;

		alienGroup.rotate.y += isSpinning ? 0.025 : 0;
		alienFaceGroup.rotate.y += isSpinning ? 0.025 : 0;

		illo.updateRenderGraph();
		requestAnimationFrame(animate);
		}
		animate();
		return () => {
        cancelAnimationFrame(animationFrameId);
		};
		},
    bird: (element) => { var TAU, animate, beak, comb, combAnchor, eyeLeft, eyeRight, head, illo, iris, isDrag, legLeft, legRight, n, pkm, sclera, shadow, tailAnchor, tailLeft, tailMid, tailRight, wingAnchorLeft, wingAnchorRight, wingFeather, wingGroup, wingLower, wingMid, wingUpper;

		TAU = Zdog.TAU;

		isDrag = false;

		illo = new Zdog.Illustration({
			element: "#canvas",
			dragRotate: true,
			rotate: {
			y: TAU / 16,
			x: -TAU / 16
			},
			width: 250,
			height: 250,
			resize: true,
			onDragStart: function() {
			isDrag = true;
			},
			onResize: function() {
			this.zoom = 4;
			}
		});

		pkm = new Zdog.Anchor({
			addTo: illo
		});

		head = new Zdog.Shape({
			addTo: pkm,
			stroke: 16,
			color: "#8c5"
		});

		beak = new Zdog.Cone({
			addTo: head,
			diameter: 4,
			length: 4,
			translate: {
			z: 8
			},
			color: "#ec5"
		});

		eyeLeft = new Zdog.Group({
			addTo: head,
			translate: (new Zdog.Vector({
			x: -1,
			y: -2,
			z: 7.5
			})).rotate({
			y: -TAU / 8
			}),
			rotate: {
			y: -TAU / 8
			}
		});

		sclera = new Zdog.Ellipse({
			addTo: eyeLeft,
			width: 6,
			height: 3,
			stroke: false,
			fill: true,
			backface: false,
			color: "#fee"
		});

		iris = new Zdog.Ellipse({
			addTo: sclera,
			diameter: 3,
			stroke: false,
			fill: true,
			backface: false
		});

		eyeRight = eyeLeft.copyGraph({
			rotate: {
			y: TAU / 8
			}
		});

		eyeRight.translate.x = -eyeLeft.translate.x;

		combAnchor = new Zdog.Anchor({
			addTo: head,
			translate: {
			y: -8,
			z: 2
			}
		});

		comb = new Zdog.Shape({
			addTo: combAnchor,
			path: [
			{
				y: 0
			},
			{
				x: 1,
				y: -6
			},
			{
				arc: [
				{
					y: -12
				},
				{
					x: -1,
					y: -6
				}
				]
			}
			],
			rotate: {
			x: TAU / 8
			},
			fill: true,
			color: "#d56"
		});

		wingAnchorLeft = new Zdog.Anchor({
			addTo: pkm,
			translate: {
			x: 8
			}
		});

		wingGroup = new Zdog.Group({
			addTo: wingAnchorLeft
		});

		wingLower = new Zdog.Ellipse({
			addTo: wingGroup,
			width: 10,
			height: 8,
			quarters: 2,
			translate: {
			x: 5
			},
			rotate: {
			x: TAU / 4,
			z: TAU / 2
			},
			fill: true,
			color: "#ec5",
			backface: "#d56"
		});

		wingUpper = new Zdog.Ellipse({
			addTo: wingLower,
			width: 10,
			height: 8,
			quarters: 2,
			rotate: {
			z: TAU / 2
			},
			fill: true,
			color: "#d56"
		});

		wingMid = new Zdog.Rect({
			addTo: wingLower,
			height: 8,
			backface: "#d56"
		});

		wingFeather = new Zdog.RoundedRect({
			addTo: wingUpper,
			width: 4,
			translate: {
			x: 2.5,
			y: 2
			}
		});

		wingFeather.copy().translate.y = -2;

		wingAnchorRight = wingAnchorLeft.copyGraph({
			translate: {
			x: -8
			},
			rotate: {
			x: TAU / 2
			}
		});

		legLeft = new Zdog.Shape({
			addTo: pkm,
			path: [
			{
				y: 0
			},
			{
				y: 2
			},
			{
				x: -1,
				y: 3,
				z: 3
			},
			{
				move: {
				y: 2
				}
			},
			{
				x: 1,
				y: 3,
				z: 3
			},
			{
				move: {
				y: 2
				}
			},
			{
				y: 2.5,
				z: -2
			}
			],
			closed: false,
			translate: {
			x: 2.5,
			y: 7.5,
			z: -2
			},
			rotate: {
			x: -TAU / 16,
			z: -TAU / 64
			},
			color: "#d56"
		});

		legRight = legLeft.copyGraph({
			translate: {
			x: -2.5,
			y: 7.5,
			z: -2
			},
			rotate: {
			x: -TAU / 16,
			z: TAU / 64
			}
		});

		tailAnchor = new Zdog.Anchor({
			addTo: head,
			translate: (new Zdog.Vector({
			z: -11
			})).rotate({
			x: TAU / 16
			}),
			rotate: {
			x: TAU / 16
			}
		});

		tailMid = new Zdog.RoundedRect({
			addTo: tailAnchor,
			width: 6,
			height: 2,
			translate: {
			y: -.75
			},
			rotate: {
			x: -TAU / 4,
			z: TAU / 4
			},
			fill: true,
			color: "#d56"
		});

		tailLeft = tailMid.copy({
			translate: {
			x: 2.5,
			z: .1
			},
			rotate: {
			x: -TAU / 4,
			y: TAU / 16,
			z: TAU / 5
			}
		});

		tailRight = tailMid.copy({
			translate: {
			x: -2.5,
			z: .1
			},
			rotate: {
			x: -TAU / 4,
			y: -TAU / 16,
			z: -TAU / 5
			}
		});

		shadow = new Zdog.Ellipse({
			addTo: illo,
			diameter: 16,
			translate: {
			y: 16
			},
			rotate: {
			x: TAU / 4
			},
			stroke: false,
			fill: true,
			backface: false,
			color: "#3332"
		});

		n = 0;

		(animate = function() {
			wingAnchorLeft.rotate.z = TAU / 8 * Math.sin(n / 4);
			wingAnchorRight.rotate.z = TAU / 2 + TAU / 8 * Math.sin(n / 4);
			combAnchor.rotate.x = TAU / 32 * Math.sin(n / 12);
			head.rotate.x = TAU / 80 * -Math.sin(n / 12);
			pkm.translate.y = -2 + -2 * Math.sin(n / 12);
			if (!isDrag) {
			illo.rotate.y += TAU / 1024;
			}
			illo.updateRenderGraph();
			n++;
			requestAnimationFrame(animate);
		})();
		return () => {
        //cancelAnimationFrame(animationFrameId);
		};
		},
    real: (element) => {
    // colors
    const red = '#F44';
    const navy = '#247';
    const blue = '#5AE';
    const gold = '#FB3';
    const white = 'white';
    const TAU = Zdog.TAU;

    // -------------------------- makeBuilding -------------------------- //
    function makeBuilding(options) {
        const wallX = options.width/2;
        const wallY = options.height;
        const wallZ = options.depth/2;

        // collect walls
        const building = {};

        // south/north walls
        [ true, false ].forEach( function( isSouth ) {
            const wallTZ = isSouth ? -wallZ : wallZ;
            const wallGroup = new Zdog.Group({
                addTo: options.addTo,
                translate: { z: -wallTZ },
            });

            let wallPath = [
                { x: -wallX, y: -wallY }
            ];

            if ( options.gable == 'ns' ) {
                wallPath.push({ x: 0, y: -wallY - wallX });
            }

            wallPath = wallPath.concat([
                { x: wallX, y: -wallY },
                { x: wallX, y: 0 },
                { x: -wallX, y: 0 },
            ]);

            // wall
            new Zdog.Shape({
                path: wallPath,
                addTo: wallGroup,
                color: isSouth ? red : gold,
            });

            const windowColor = isSouth ? navy : red;
            const windowProperty = isSouth ? 'southWindows' : 'northWindows';
            handleWindows( options, windowProperty, wallGroup, windowColor );

            const wallProperty = isSouth ? 'southWall' : 'northWall';
            building[ wallProperty ] = wallGroup;
        });

        // east/west wall
        [ true, false ].forEach( function( isWest ) {
            const wallGroup = new Zdog.Group({
                addTo: options.addTo,
                translate: { x: isWest ? -wallX : wallX },
                rotate: { y: TAU/4 },
            });

            let wallPath = [
                { x: -wallZ, y: -wallY }
            ];

            if ( options.gable == 'ew' ) {
                wallPath.push({ x: 0, y: -wallY - wallZ });
            }

            wallPath = wallPath.concat([
                { x: wallZ, y: -wallY },
                { x: wallZ, y: 0 },
                { x: -wallZ, y: 0 },
            ]);

            // wall
            new Zdog.Shape({
                path: wallPath,
                addTo: wallGroup,
                color: isWest ? blue : white,
            });

            const windowColor = isWest ? navy : blue;
            const windowProperty = isWest ? 'westWindows' : 'eastWindows';
            handleWindows( options, windowProperty, wallGroup, windowColor );

            const wallProperty = isWest ? 'westWall' : 'eastWall';
            building[ wallProperty ] = wallGroup;
        });

        const roofMakers = {
            ns: function() {
                const y0 = -wallY - wallX;
                const roofPanel = new Zdog.Shape({
                    path: [
                        { x: 0, y: y0, z: wallZ },
                        { x: 0, y: y0, z: -wallZ },
                        { x: wallX, y: -wallY, z: -wallZ },
                        { x: wallX, y: -wallY, z: wallZ },
                    ],
                    addTo: options.addTo,
                    color: gold,
                });
                roofPanel.copy({
                    scale: { x: -1 },
                    color: navy,
                });
            },

            ew: function() {
                const y0 = -wallY - wallZ;
                const xA = options.isChurch ? -wallX + 8 : -wallX;
                const roofPanel = new Zdog.Shape({
                    path: [
                        { z: 0, y: y0, x: xA },
                        { z: 0, y: y0, x: wallX },
                        { z: -wallZ, y: -wallY, x: wallX },
                        { z: -wallZ, y: -wallY, x: xA },
                    ],
                    addTo: options.addTo,
                    color: red,
                });
                roofPanel.copy({
                    path: [
                        { z: 0, y: y0, x: -wallX },
                        { z: 0, y: y0, x: wallX },
                        { z: -wallZ, y: -wallY, x: wallX },
                        { z: -wallZ, y: -wallY, x: -wallX },
                    ],
                    scale: { z: -1 },
                    color: navy,
                });
            },
        };

        const roofMaker = roofMakers[ options.gable ];
        if ( roofMaker ) {
            roofMaker();
        }

        return building;
    }

    function handleWindows( options, windowProperty, wallGroup, color ) {
        const windowOption = options[ windowProperty ];
        if ( !windowOption ) {
            return;
        }

        const columns = windowOption[0];
        const rows = windowOption[1];
        for ( let row=0; row < rows; row++ ) {
            for ( let col=0; col < columns; col++ ) {
                const x = ( col - (columns-1)/2 ) * 6;
                const y = -options.height + (row + 0.75) * 8;
                const windowPath = [
                    { x: x + -1, y: y + -2 },
                    { x: x +  1, y: y + -2 },
                    { x: x +  1, y: y +  2 },
                    { x: x + -1, y: y +  2 },
                ];
                new Zdog.Shape({
                    path: windowPath,
                    addTo: wallGroup,
                    color: color,
                });
            }
        }
    }

    // -------------------------- lilPyramid -------------------------- //
    function lilPyramid( options ) {
        const anchor = new Zdog.Anchor({
            addTo: options.addTo,
            translate: options.translate,
        });

        const panel = new Zdog.Shape({
            path: [
                { x: 0, y: -3, z: 0 },
                { x: 3, y:  0, z: 0 },
                { x: 0, y:  0, z: 3 },
            ],
            addTo: anchor,
            color: red,
        });

        panel.copy({ rotate: { y: TAU/4 }, color: red });
        panel.copy({ rotate: { y: TAU/2 }, color: navy });
        panel.copy({ rotate: { y: TAU * 3/4 }, color: navy });
    }

    function hedge( options ) {
        const anchor = new Zdog.Anchor({
            addTo: options.addTo,
            translate: options.translate,
        });

        const ball = new Zdog.Shape({
            path: [ { y: 0 }, { y: -1 } ],
            addTo: anchor,
            translate: { y: -2.5 },
            stroke: 5,
            color: options.color || navy,
        });

        ball.copy({ stroke: 4, translate: { y: -5 } });
        ball.copy({ stroke: 2.5, translate: { y: -7.5 } });
    }

    // -------------------------- setup -------------------------- //
    const w = 160;
    const h = 160;
    const minWindowSize = Math.min( window.innerWidth, window.innerHeight );
    const zoom = Math.min( 2, Math.floor( minWindowSize / w ) );
    
    let isSpinning = true;
    const illo = new Zdog.Illustration({
        element: element,
        zoom: zoom,
        rotate: { y: TAU/8 },
        dragRotate: true,
        onDragStart: function() {
            isSpinning = false;
        },
    });

    // default to flat, filled shapes
    [ Zdog.Shape, Zdog.Rect, Zdog.Ellipse ].forEach( function( ItemClass ) {
        ItemClass.defaults.fill = true;
        ItemClass.defaults.stroke = false;
    });

    // -- illustration shapes --- //
    const quarterView = 1/Math.sin(TAU/8);

    // anchor
    const town = new Zdog.Group({
        addTo: illo,
        translate: { y: 36 },
        scale: { x: quarterView, z: quarterView },
        updateSort: true,
    });

    // ----- front building ----- //
    const frontAnchor = new Zdog.Anchor({
        addTo: town,
        translate: { x: 16, y: -4, z: 20 },
    });

    const frontBuilding = makeBuilding({
        width: 22,
        depth: 16,
        height: 20,
        addTo: frontAnchor,
        gable: 'ew',
        southWindows: [ 3, 1 ],
        eastWindows: [ 2, 2 ],
        westWindows: [ 2, 2 ],
        northWindows: [ 3, 2 ],
    });

    // east gable dot
    const gableDot = new Zdog.Ellipse({
        diameter: 2,
        addTo: frontBuilding.eastWall,
        color: blue,
        translate: { y: -20 },
    });
    // west gable dot
    gableDot.copy({ addTo: frontBuilding.westWall, color: navy });

    // south doors
    const door = new Zdog.Shape({
        path: [
            { x: -2.5, y: 0 },
            { x: -2.5, y: -5.5 },
            { arc: [
                { x: -2.5, y: -8 },
                { x:    0, y: -8 },
            ]},
            { arc: [
                { x:  2.5, y: -8 },
                { x:  2.5, y: -5.5 },
            ]},
            { x: 2.5, y: 0 },
        ],
        addTo: frontBuilding.southWall,
        translate: { x: -4.5 },
        color: navy,
    });
    door.copy({ translate: { x: 4.5 } });

    [ -1, 1 ].forEach( function( zSide ) {
        const frontGableGroup = new Zdog.Group({
            addTo: frontAnchor,
            translate: { y: -20, z: -8*zSide },
        });

        // front building gable
        new Zdog.Shape({
            path: [
                { x:  0, y: -6 },
                { x: -6, y: 0 },
                { x:  6, y: 0 },
            ],
            addTo: frontGableGroup,
            translate: { y: 1 },
            color: zSide == -1 ? red : gold,
        });

        gableDot.copy({
            addTo: frontGableGroup,
            translate: { y: -2 },
            color: zSide == -1 ? navy : red,
        });

        const frontGableSide = new Zdog.Shape({
            path: [
                { x: 0, y: 0, z: 0 },
                { x: 5, y: 5, z: 0 },
                { x: 0, y: 0, z: 5*zSide },
            ],
            addTo: frontAnchor,
            translate: { y: -25, z: -8*zSide },
            color: gold,
        });
        frontGableSide.copy({ scale: { x: -1 }, color: navy });
    });

    // ----- left building ----- //
    const leftAnchor = new Zdog.Anchor({
        addTo: town,
        translate: { x: -13, y: -10, z: 23 },
    });

    const leftBuilding = makeBuilding({
        width: 16,
        depth: 22,
        height: 20,
        addTo: leftAnchor,
        gable: 'ns',
        southWindows: [ 2, 2 ],
        eastWindows: [ 3, 2 ],
        westWindows: [ 3, 1 ],
        northWindows: [ 2, 2 ],
    });

    door.copy({ addTo: leftBuilding.westWall, translate: { x: -4.5 } });
    door.copy({ addTo: leftBuilding.westWall, translate: { x: 4.5 } });

    // ----- cupola ----- //
    const cupolaNSPanel = new Zdog.Shape({
        path: [
            { x: -1, y: 0 },
            { x: 3, y: 0 },
            { x: 3, y: 9 },
            { x: -1, y: 5 },
            // HACK add point to sort in front of roof
            { move: { x: 8, z: 4 } },
        ],
        addTo: leftAnchor,
        translate: { y: -34, z: 3 },
        color: red,
    });
    cupolaNSPanel.copy({ scale: { x: -1 } });
    cupolaNSPanel.copy({
        scale: { z: -1 },
        translate: { y: -34, z: -3 },
        color: gold,
    });
    cupolaNSPanel.copy({
        translate: { y: -34, z: -3 },
        scale: { x: -1, z: -1 },
        color: gold,
    });

    [ -1, 1 ].forEach( function( xSide ) {
        const group = new Zdog.Group({
            addTo: leftAnchor,
            translate: { y: -34, x: 3*xSide },
        });
        // ew panel
        new Zdog.Shape({
            path: [
                { z:  3, y:  0 },
                { z:  0, y: -3 },
                { z: -3, y:  0 },
                { z: -3, y:  9 },
                { z:  3, y:  9 },
                // HACK add point to sort in front of roof
                { move: { x: 16*xSide } },
            ],
            addTo: group,
            color: xSide == -1 ? blue : white,
        });
        gableDot.copy({
            addTo: group,
            translate: { y: 3 },
            rotate: { y: TAU/4 },
            color: xSide == -1 ? navy : blue,
        });
    });

    // cupola roof panel
    const cupolaRoofPanel = new Zdog.Shape({
        path: [
            { x: -3, y: -3, z:  0 },
            { x:  3, y: -3, z:  0 },
            { x:  3, y:  0, z:  3 },
            { x: -3, y:  0, z:  3 },
        ],
        addTo: leftAnchor,
        translate: { y: -34 },
        color: navy,
    });
    cupolaRoofPanel.copy({ scale: { z: -1 }, color: red });

    // ----- left building slopes ----- //
    // east slope
    const leftEWSlope = new Zdog.Shape({
        path: [
            { x: 0, y: 0, z:  11 },
            { x: 0, y: 0, z: -11 },
            { x: 6, y: 6, z: -11 },
            { x: 6, y: 6, z:  11 },
        ],
        addTo: leftAnchor,
        translate: { x: 8 },
        color: gold,
    });
    // west slope
    leftEWSlope.copy({ scale: { x: -1 }, translate: { x: -8 }, color: gold });

    // south slope
    new Zdog.Shape({
        path: [
            { z:  0, y: 0, x: -8 },
            { z:  0, y: 0, x:  8 },
            { z:  6, y: 6, x:  8 },
            { z:  6, y: 6, x: -8 },
        ],
        addTo: leftAnchor,
        translate: { z: 11 },
        color: navy,
    });

    // south east corner
    const leftCorner = new Zdog.Shape({
        path: [
            { x: 0, y: 0, z:  0 },
            { x: 6, y: 6, z:  0 },
            { x: 0, y: 6, z:  6 },
        ],
        addTo: leftAnchor,
        translate: { x: 8, z: 11 },
        color: red,
    });
    // south west corner
    leftCorner.copy({ scale: { x: -1 }, translate: { x: -8, z: 11 }, color: blue });

    // ----- back tower ----- //
    const towerAnchor = new Zdog.Anchor({
        addTo: town,
        translate: { x: -13, y: -24, z: -4 },
    });

    const tower = makeBuilding({
        width: 16,
        depth: 16,
        height: 28,
        addTo: towerAnchor,
        gable: 'ns',
        southWindows: [ 2, 3 ],
        eastWindows: [ 2, 2 ],
        westWindows: [ 2, 3 ],
        northWindows: [ 2, 3 ],
    });

    door.copy({ addTo: tower.eastWall, translate: { x: 0 }, color: blue });

    gableDot.copy({ addTo: tower.southWall, translate: { y: -29 }, color: navy });
    gableDot.copy({ addTo: tower.northWall, translate: { y: -29 }, color: red });

    const towerChimney = new Zdog.Shape({
        addTo: towerAnchor,
        path: [ { y: 0 }, { y: 4 } ],
        translate: { x: -2, y: -37, z: 1 },
        stroke: 2,
        color: navy,
    });
    towerChimney.copy({ translate: { x: -2, y: -37, z: -3 } });

    // plume
    new Zdog.Shape({
        path: [
            { x: -3, y: 1 },
            { arc: [
                { x: -3, y: -1 },
                { x: -1, y: -1 },
            ]},
            { x:  3, y: -1 },
            { arc: [
                { x:  3, y:  1 },
                { x:  1, y:  1 },
            ]},
        ],
        addTo: towerAnchor,
        translate: { x: -2, y: -42, z: -6 },
        rotate: { y: -TAU/4 },
        stroke: 2,
        color: blue
    });

    // ----- tower slopes ----- //
    // big east slope
    const towerEWSlope = new Zdog.Shape({
        path: [
            { x: 0, y: 0, z:  1 },
            { x: 0, y: 0, z: -1 },
            { x: 1, y: 1, z: -1 },
            { x: 1, y: 1, z:  1 },
        ],
        addTo: towerAnchor,
        translate: { x: 8 },
        // size by scaling
        scale: { x: 20, y: 20, z: 8 },
        color: gold,
    });

    // south slope down to left building
    const towerNSSLope = new Zdog.Shape({
        path: [
            { z: 0, y: 0, x:  1 },
            { z: 0, y: 0, x: -1 },
            { z: 1, y: 1, x: -1 },
            { z: 1, y: 1, x:  1 },
        ],
        addTo: towerAnchor,
        translate: { z: 8 },
        scale: { x: 8, y: 14, z: 8 },
        color: navy,
    });

    // south east corner
    new Zdog.Shape({
        path: [
            { x: 0, y: 0, z: 0 },
            { x: 20, y: 20, z: 0 },
            { x: 6, y: 20, z: 8 },
            { x: 0, y: 14, z: 8 },
        ],
        addTo: towerAnchor,
        translate: { x: 8, z: 8 },
        color: red,
    });

    // north slope
    towerNSSLope.copy({
        translate: { z: -8 },
        scale: { x: 8, y: 20, z: -7 },
        color: gold,
    });

    // north east corner
    new Zdog.Shape({
        path: [
            { x: 0, y: 0, z: 0 },
            { x: 20, y: 20, z: 0 },
            { x: 0, y: 20, z: -7 },
        ],
        addTo: towerAnchor,
        translate: { x: 8, z: -8 },
        color: gold,
    });

    // west slope
    towerEWSlope.copy({
        scale: { x: -12, y: 20, z: 8 },
        translate: { x: -8 },
        color: gold,
    });

    // north west corner
    new Zdog.Shape({
        path: [
            { x: 0, y: 0, z: 0 },
            { x: -12, y: 20, z: 0 },
            { x: 0, y: 20, z: -7 },
        ],
        addTo: towerAnchor,
        translate: { x: -8, z: -8 },
        color: red,
    });

    // south west corner back to left building
    new Zdog.Shape({
        path: [
            { x: 0, y: 0, z: 0 },
            { x: -12, y: 20, z: 0 },
            { x: -6, y: 20, z: 8 },
            { x: 0, y: 14, z: 8 },
        ],
        addTo: towerAnchor,
        translate: { x: -8, z: 8 },
        color: blue,
    });

    // ----- church ----- //
    const churchAnchor = new Zdog.Anchor({
        addTo: town,
        translate: { x: -5, y: -4, z: -27 },
    });

    const church = makeBuilding({
        isChurch: true, // special flag for roof
        width: 22,
        depth: 16,
        height: 28,
        addTo: churchAnchor,
        gable: 'ew',
        southWindows: [ 3, 2 ],
        eastWindows: [ 2, 2 ],
        northWindows: [ 3, 2 ],
    });

    door.copy({ addTo: church.westWall, translate: { x: -3.5 } });
    door.copy({ addTo: church.westWall, translate: { x: 3.5 } });

    // big circle window
    new Zdog.Ellipse({
        diameter: 8,
        addTo: church.westWall,
        translate: { y: -22 },
        color: navy,
    });

    // ----- bell tower ----- //
    ( function() {
        const bellTowerAnchor = new Zdog.Anchor({
            addTo: churchAnchor,
            translate: { x: -7, y: -36, z: -4 },
        });

        // tower ledge
        new Zdog.Rect({
            width: 8,
            height: 8,
            addTo: bellTowerAnchor,
            translate: { y: -12 },
            rotate: { x: TAU/4 },
            color: navy,
        });

        const wallColors = [ red, white, gold, blue ];
        const accentColors = [ navy, blue, red, navy ];
        const roofColors = [ navy, gold, red, navy ];

        for ( let i=0; i < 4; i++ ) {
            const wallAnchor = new Zdog.Anchor({
                addTo: bellTowerAnchor,
                rotate: { y: TAU/4 * -i },
            });
            const bottomWallGroup = new Zdog.Group({
                addTo: wallAnchor,
                translate: { z: 4 }
            });

            const wallColor = wallColors[i];
            const accentColor = accentColors[i];
            const roofColor = roofColors[i];

            // bottom wall
            new Zdog.Rect({
                width: 8,
                height: 12,
                addTo: bottomWallGroup,
                translate: { y: -6 },
                color: wallColor,
            });
            // circle cut-out
            new Zdog.Ellipse({
                diameter: 4,
                addTo: bottomWallGroup,
                translate: { y: -4 },
                color: accentColor,
            });
            // top stripe
            new Zdog.Rect({
                width: 8,
                height: 2,
                addTo: bottomWallGroup,
                translate: { y: -9 },
                color: accentColor,
            });

            const topWallGroup = new Zdog.Group({
                addTo: wallAnchor,
                translate: { y: -12, z: 3 },
            });
            // top wall
            new Zdog.Rect({
                width: 6,
                height: 7,
                addTo: topWallGroup,
                translate: { y: -3.5 },
                color: wallColor,
            });
            // top window
            new Zdog.Rect({
                width: 2,
                height: 5,
                addTo: topWallGroup,
                translate: { y: -2.5 },
                color: accentColor,
            });

            // roof
            new Zdog.Shape({
                path: [
                    { x:  0, y: 0, z:  0 },
                    { x: -3, y: 6, z: 3 },
                    { x:  3, y: 6, z: 3 },
                ],
                addTo: wallAnchor,
                translate: { y: -25 },
                color: roofColor,
            });
        }

        // roof connectors
        // south, white side
        new Zdog.Shape({
            path: [
                { z:  4, y:  0 },
                { z: -4, y: -1 },
                { z: -4, y:  8 },
            ],
            addTo: bellTowerAnchor,
            translate: { x: 4 },
            color: white,
        });
        // east gold side
        const connector = new Zdog.Rect({
            width: 8,
            height: 10,
            addTo: bellTowerAnchor,
            translate: { z: -4, y: 4 },
            color: gold,
        });
        // north blue side
        connector.copy({
            translate: { x: -4, y: 4 },
            rotate: { y: TAU/4 },
            color: blue,
        });
    })();

    // ----- hill ----- //
    new Zdog.Shape({
        path: [
            { x:  0, y: 2 },
            { x:  10, y: 2 },
            { bezier: [
                { x: 14, y: 2 },
                { x: 20, y: 10 },
                { x: 24, y: 10 },
            ]},
            { x: 30, y: 10 },
            { arc: [
                { x: 34, y: 10 },
                { x: 34, y: 14 },
            ]},
            // bring it back into hill
            { x: 14, y: 14, z: 0 },
        ],
        addTo: town,
        translate: { x: -6, y: -20, z: -12 },
        stroke: 4,
        color: gold,
    });

    // ----- lil pyramids ----- //
    // front in front of left building
    lilPyramid({ addTo: town, translate: { x: 6, z: 35, y: -4 } });
    // behind left building
    lilPyramid({ addTo: town, translate: { x: -34, z: 20, y: -4 } });
    // front right
    lilPyramid({ addTo: town, translate: { x: 35, z: 8, y: -4 } });
    lilPyramid({ addTo: town, translate: { x: 31, z: -2, y: -4 } });
    // in front of church
    lilPyramid({ addTo: town, translate: { x: 22, z: -28, y: -4 } });

    // ----- hedges ----- //
    // to right of front building
    hedge({ addTo: town, translate: { x: 24, y: -4, z: 4 } });
    // right of church
    hedge({ addTo: town, translate: { x: -4, y: -4, z: -42 } });
    // in between tower & church
    hedge({ addTo: town, translate: { x: -30, y: -4, z: -18 } });
    hedge({ addTo: town, translate: { x: 9, y: -4, z: -17 } });

    // ----- sun ----- //
    new Zdog.Shape({
        addTo: town,
        translate: { x: -6, y: -52, z: -42 },
        stroke: 6,
        color: gold,
    });

    // ----- sky particles ----- //
    // dot above left building
    const skyDot = new Zdog.Shape({
        translate: { x: -3, y: -48, z: 42 },
        addTo: town,
        stroke: 2,
        color: white,
    });

    // in front of church
    skyDot.copy({ translate: { x: 30, y: -28, z: -28 } });

    const skyDiamond = new Zdog.Shape({
        path: [
            { x:  0, y: -1 },
            { x:  1, y:  0 },
            { x:  0, y:  1 },
            { x: -1, y:  0 },
        ],
        addTo: town,
        translate: { x: -27, y: -45, z: 29 },
        scale: 0.75,
        stroke: 0.5,
        color: white,
    });
    skyDiamond.copy({ rotate: { y: TAU/4 } });

    const skyDiamond2 = skyDiamond.copy({
        translate: { x: 8, y: -34, z: -42 },
    });
    skyDiamond2.copy({ rotate: { y: TAU/4 } });

    const skyStar = new Zdog.Shape({
        path: [
            { x: 0, y: -1 },
            { arc: [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
            ]},
            { arc: [
                { x: 0, y: 0 },
                { x: 0, y: 1 },
            ]},
            { arc: [
                { x: 0, y: 0 },
                { x: -1, y: 0 },
            ]},
            { arc: [
                { x: 0, y: 0 },
                { x: 0, y: -1 },
            ]},
        ],
        addTo: town,
        translate: { x: -39, y: -51, z: 12 },
        scale: 1.5,
        stroke: 1,
        color: white,
    });
    skyStar.copy({ rotate: { y: TAU/4 } });

    // up front
    const skyStar2 = skyStar.copy({
        translate: { x: 29, y: -42, z: 30 },
        color: white,
    });
    skyStar2.copy({ rotate: { y: TAU/4 } });

    // ----- clouds ----- //
    const cloud = new Zdog.Ellipse({
        addTo: town,
        diameter: 3,
        quarters: 2,
        translate: { x: -30, y: -56, z: 10 },
        rotate: { y: TAU/4, z: -TAU/4 },
        stroke: 2,
        closed: true,
        color: white,
    });
    cloud.copy({ translate: { x: -30, y: -57, z: 6 } });
    cloud.copy({ translate: { x: -30, y: -56, z: 2 } });

    // line underneath
    new Zdog.Shape({
        addTo: town,
        path: [ { x: -1 }, { x: 1 } ],
        translate: { x: -30, y: -56, z: 6 },
        scale: { x: 2 },
        rotate: { y: TAU/4 },
        stroke: 2,
        color: white,
    });

    // ----- flat earth ----- //
    const flatEarth = new Zdog.Ellipse({
        diameter: 128,
        addTo: illo,
        translate: town.translate,
        rotate: { x: TAU/4 },
        stroke: 8,
        color: navy,
    });

    // ----- sky ----- //
    const sky = new Zdog.Group({
        addTo: illo,
        translate: town.translate,
    });

    ( function() {
        const topYs = [
            -64, -64, -52, -52,
            -44, -44, -36, -36,
            -44, -44, -52, -52,
            -60, -60, -52, -52,
        ];
        const bottomYs = [
            -24, -24, -16, -16,
            -8, -8, -0, -0,
            -8, -8, -16, -16,
            -24, -24, -32, -32,
        ];
        const radius = 64;
        const skyPanelCount = topYs.length;
        const angle = TAU / skyPanelCount;
        const panelWidth = Math.tan( angle/2 ) * radius * 2;
        for ( let i=0; i < skyPanelCount; i++ ) {
            const nextI = (i + 1) % skyPanelCount;
            const topYA = topYs[ i ];
            const topYB = topYs[ nextI ];
            const bottomYA = bottomYs[ i ];
            const bottomYB = bottomYs[ nextI ];
            const panelAnchor = new Zdog.Anchor({
                addTo: sky,
                rotate: { y: angle * i  - TAU/4 },
                translate: { y: 1 },
            });
            new Zdog.Shape({
                path: [
                    { x: -panelWidth/2, y: topYA },
                    { bezier: [
                        { x: 0, y: topYA },
                        { x: 0, y: topYB },
                        { x:  panelWidth/2, y: topYB },
                    ]},
                    { x:  panelWidth/2, y: bottomYB },
                    { bezier: [
                        { x: 0, y: bottomYB },
                        { x: 0, y: bottomYA },
                        { x: -panelWidth/2, y: bottomYA },
                    ]},
                ],
                addTo: panelAnchor,
                translate: { z: -radius },
                color: blue,
                stroke: 1,
                backface: false,
            });
        }
    })();

    // -- animate --- //
    let t = 0;
    const tSpeed = 1/120;
    let then = new Date() - 1/60;
    let animationFrameId;

    function animate() {
        update();
        render();
        animationFrameId = requestAnimationFrame( animate );
    }

    animate();

    // -- update -- //
    function update() {
        const now = new Date();
        const delta = now - then;

        if ( isSpinning ) {
            t += tSpeed * delta/60;
            const theta = Zdog.easeInOut( t % 1 ) * TAU;
            const rev = 1;
            const spin = -theta * rev + TAU/8;
            const extraRotation = TAU * rev * Math.floor( ( t % 4 ) );
            illo.rotate.y = spin - extraRotation;
            const everyOtherCycle = t % 2 < 1;
            illo.rotate.x = everyOtherCycle ? 0 : ( Math.cos( theta ) * -0.5 + 0.5 ) * TAU * -1/8;
        }
        illo.normalizeRotate();

        // rotate
        illo.updateGraph();

        then = now;
    }

    // -- render -- //
    function render() {
        const ctx = illo.ctx;
        illo.prerenderCanvas();

        // render shapes
        const isCameraXUp = illo.rotate.x < 0 || illo.rotate.x > TAU/2;

        sky.renderGraphCanvas( ctx );

        // HACK sort flat earth & town shapes manually
        if ( isCameraXUp ) {
            flatEarth.renderGraphCanvas( ctx );
        }
        town.renderGraphCanvas( ctx );
        if ( !isCameraXUp ) {
            flatEarth.renderGraphCanvas( ctx );
        }

        illo.postrenderCanvas();
        ctx.restore();
    }

    return () => {
        cancelAnimationFrame(animationFrameId);
    };
},
    coffee: (element) => { let coffeeCanvas = new Zdog.Illustration({
		  // set canvas with selector
		  element: '#coffee',
		  dragRotate: true,
		  rotate: { x: Zdog.TAU/5 }
		});

		let cupGroup = new Zdog.Group({
		  addTo: coffeeCanvas,
		});

		// add circle
		let cupPart = new Zdog.Ellipse({
		  addTo: cupGroup,
		  diameter: 70,
		  // quarters: 2,
		  stroke: 10,
		  color: '#FF1493',
		  // rotate: { x: Zdog.TAU/4 },
		  // translate: { x: 50, z: 20 },
		});
		cupPart.copy({ translate: { z: 5 } });
		cupPart.copy({ translate: { z: 10 } });
		cupPart.copy({ translate: { z: 15 } });
		cupPart.copy({ translate: { z: 20 } });
		cupPart.copy({ translate: { z: -5 }, scale: .95 });
		cupPart.copy({ translate: { z: -10 }, scale: .9 });
		cupPart.copy({ translate: { z: -15 }, scale: .8 });
		cupPart.copy({ translate: { z: -20 }, scale: .7 });
		cupPart.copy({ translate: { z: -22.5 }, scale: .6 });
		cupPart.copy({ translate: { z: -25 }, scale: .5 });
		cupPart.copy({ translate: { z: -27.5 }, scale: .4 });
		cupPart.copy({ translate: { z: -30 }, scale: .25, fill: true });
		new Zdog.Ellipse({
		  addTo: cupGroup,
		  diameter: 25,
		  quarters: 2,
		  stroke: 10,
		  color: '#FF1493',
		  rotate: { x: Zdog.TAU/4 },
		  translate: { x: 40, z: 5 },
		});

		new Zdog.Ellipse({
		  addTo: coffeeCanvas,
		  diameter: 120,
		  stroke: 10,
		  fill: true,
		  color: '#FF1493',
		  translate: { z: -40 },
		});
		new Zdog.Ellipse({
		  addTo: coffeeCanvas,
		  diameter: 90,
		  fill: true,
		  color: '#efefef',
		  translate: { z: -35 },
		});

		// add coffee
		let coffeeGroup = new Zdog.Group({
		  addTo: coffeeCanvas,
		});
		// new Zdog.Hemisphere({
		//   addTo: coffeeGroup,
		//   diameter: 60,
		//   stroke: false,
		//   color: '#201816',
		//   rotate: { x: Zdog.TAU/2 },
		// });
		// new Zdog.Cylinder({
		//   addTo: coffeeGroup,
		//   diameter: 60,
		//   length: 20,
		//   stroke: false,
		//   color: '#201816',
		//   rotate: { x: Zdog.TAU/2 },
		//   translate: { z: 10 },
		// });
		new Zdog.Cylinder({
		  addTo: coffeeGroup,
		  diameter: 60,
		  length: 0,
		  stroke: false,
		  color: '#201816',
		  rotate: { x: Zdog.TAU/2 },
		  translate: { z: 20 },
		});

		let smokeGroup = new Zdog.Group({
		  addTo: coffeeCanvas,
		  rotate: { x: Zdog.TAU/4 },
		  translate: { z: 40 },
		});
		let smokePart = new Zdog.Shape({
		  addTo: smokeGroup,
		  path: [
			{ x: 0, y: -15 }, // start
			{ bezier: [
			  { x: -10, y: 0 }, // start control point
			  { x: 10, y: 0 }, // end control point
			  { x: 0, y: 15 }, // end point
			]},
		  ],
		  closed: false,
		  stroke: 10,
		  color: 'rgba(255,255,255,.55)',
		  translate: { x: 15, z: -10 },
		});
		smokePart.copy({ translate: { x: -15, z: -10 } });
		smokePart.copy({ translate: { x: 0, z: 10, y: 5 } });

		// update & render
		let smokeDirection = 'up';
		function animate() {
		  // console.log(smokeGroup.translate.z);
		  if (smokeGroup.translate.z > 50) {
			smokeDirection = 'down';
		  } else if (smokeGroup.translate.z < 40){
			smokeDirection = 'up';
		  }
		  smokeGroup.translate.z += smokeDirection == 'up' ? 0.1 : -0.1;
		  coffeeCanvas.updateRenderGraph();
		  requestAnimationFrame(animate);
		}

		animate();
		return () => {
        cancelAnimationFrame(animationFrameId);
		};
	},
    time: (element) => {
  let animationFrameId;
  let timeInterval;

  const { Anchor, Illustration, TAU, Shape, Group } = Zdog; // Use direct Zdog import

  const Scene = new Illustration({
    element: element,
    dragRotate: true,
    rotate: {
      x: TAU * 0.05,
      y: TAU * 0.05,
    },
  });

  const Clock = new Anchor({
    addTo: Scene,
  });

  const Digit = new Group();

  // Digit line order
  // M, T, L1, L2, R1, R2, B
  const DIGIT_MAP = {
    '0': [false, true, true, true, true, true, true],
    '1': [false, false, false, false, true, true, false],
    '2': [true, true, false, true, true, false, true],
    '3': [true, true, false, false, true, true, true],
    '4': [true, false, true, false, true, true, false],
    '5': [true, true, true, false, false, true, true],
    '6': [true, true, true, true, false, true, true],
    '7': [false, true, false, false, true, true, false],
    '8': [true, true, true, true, true, true, true],
    '9': [true, true, true, false, true, true, false],
  };
  const STROKE = 8;
  const LENGTH = 15;
  const DIGIT_COLOR = 'rgba(255, 0, 0, 1)';
  const Line = new Shape({
    addTo: Digit,
    path: [
      {
        x: -(LENGTH / 2),
        y: 0,
      },
      {
        x: LENGTH / 2,
        y: 0,
      },
    ],
    color: DIGIT_COLOR,
    stroke: STROKE,
  });
  Line.copy({
    path: [
      {
        x: -(LENGTH / 2),
        y: -(STROKE + LENGTH),
      },
      {
        x: LENGTH / 2,
        y: -(STROKE + LENGTH),
      },
    ],
  });
  Line.copy({
    path: [
      {
        x: -LENGTH,
        y: -(STROKE / 2),
      },
      {
        x: -LENGTH,
        y: -(LENGTH + STROKE / 2),
      },
    ],
  });
  Line.copy({
    path: [
      {
        x: -LENGTH,
        y: STROKE / 2,
      },
      {
        x: -LENGTH,
        y: LENGTH + STROKE / 2,
      },
    ],
  });

  Line.copy({
    path: [
      {
        x: LENGTH,
        y: -(STROKE / 2),
      },
      {
        x: LENGTH,
        y: -(LENGTH + STROKE / 2),
      },
    ],
  });

  Line.copy({
    path: [
      {
        x: LENGTH,
        y: STROKE / 2,
      },
      {
        x: LENGTH,
        y: LENGTH + STROKE / 2,
      },
    ],
  });

  Line.copy({
    path: [
      {
        x: -(LENGTH / 2),
        y: LENGTH + STROKE,
      },
      {
        x: LENGTH / 2,
        y: LENGTH + STROKE,
      },
    ],
  });

  Digit.copyGraph({
    translate: {
      x: -76,
    },
  });

  Digit.copyGraph({
    translate: {
      x: -20,
    },
  });
  Digit.copyGraph({
    translate: {
      x: 20,
    },
  });
  Digit.copyGraph({
    translate: {
      x: 76,
    },
  });
  Digit.copyGraph({
    translate: {
      x: 116,
    },
  });

  const Dot = new Shape({
    addTo: Scene,
    color: DIGIT_COLOR,
    stroke: 10,
    translate: {
      x: 0,
      y: -10,
    },
  });

  Dot.copy({
    translate: {
      x: 0,
      y: 10,
    },
  });

  const DigitSet = new Anchor();
  Digit.copyGraph({
    addTo: DigitSet,
    translate: {
      x: -20,
    },
  });
  Digit.copyGraph({
    addTo: DigitSet,
    translate: {
      x: 20,
    },
  });

  // Hours
  DigitSet.copyGraph({
    addTo: Clock,
    translate: {
      x: -45,
    },
  });
  // Minutes
  DigitSet.copyGraph({
    addTo: Clock,
    translate: {
      x: 45,
    },
  });
  // Seconds
  DigitSet.copyGraph({
    addTo: Clock,
    scale: 0.5,
    translate: {
      x: 110,
      y: 10,
    },
  });

  const DigitSets = Scene.children[0].children;
  const Hours = DigitSets[0].children;
  const Minutes = DigitSets[1].children;
  const Seconds = DigitSets[2].children;

  // Update the seconds margin and stroke width
  for (const line of [...Seconds[0].children, ...Seconds[1].children]) {
    line.stroke = 4;
  }
  Seconds[1].translate.x = 22;

  const draw = () => {
    Scene.updateRenderGraph();
    animationFrameId = requestAnimationFrame(draw);
  };

  const setTime = () => {
    const d = new Date();
    const hours = d.getHours().toString().padStart(2, '0').split('');
    const minutes = d.getMinutes().toString().padStart(2, '0').split('');
    const seconds = d.getSeconds().toString().padStart(2, '0').split('');

    const secondOneMap = DIGIT_MAP[seconds[0]];
    const secondTwoMap = DIGIT_MAP[seconds[1]];
    const minuteOneMap = DIGIT_MAP[minutes[0]];
    const minuteTwoMap = DIGIT_MAP[minutes[1]];
    const hourOneMap = DIGIT_MAP[hours[0]];
    const hourTwoMap = DIGIT_MAP[hours[1]];

    for (let i = 0; i < secondOneMap.length; i++) {
      Seconds[0].children[i].color = `rgba(255, 0, 0, ${secondOneMap[i] ? 1 : 0})`;
      Seconds[1].children[i].color = `rgba(255, 0, 0, ${secondTwoMap[i] ? 1 : 0})`;
      Minutes[0].children[i].color = `rgba(255, 0, 0, ${minuteOneMap[i] ? 1 : 0})`;
      Minutes[1].children[i].color = `rgba(255, 0, 0, ${minuteTwoMap[i] ? 1 : 0})`;
      Hours[0].children[i].color = `rgba(255, 0, 0, ${hourOneMap[i] ? 1 : 0})`;
      Hours[1].children[i].color = `rgba(255, 0, 0, ${hourTwoMap[i] ? 1 : 0})`;
    }
  };

  // Initialize
  setTime();
  timeInterval = setInterval(setTime, 1000);
  draw();

  return () => {
    clearInterval(timeInterval);
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    // Clean up Zdog illustration
    if (Scene && Scene.ctx) {
      Scene.ctx.canvas.remove();
    }
  };
},
    fire: (element) => {
  const TAU = Zdog.TAU;
  let isSpinning = true;
  let animationFrameId;

  const illo = new Zdog.Illustration({
    element: element,
    dragRotate: true,
    rotate: {
      y: TAU / 16,
      x: -TAU / 16
    },
    width: 250,
    height: 250,
	resize: true,
    onDragStart: function() {
      isSpinning = false;
    },
    onResize: function() {
      this.zoom = 6;
    }
  });

  const campFire = new Zdog.Anchor({
    addTo: illo
  });

  // Create wood logs
  for (let i = 0; i < 0.95; i += Math.random() * 0.1 + 0.05) {
    const woodAnchor = new Zdog.Anchor({
      addTo: campFire,
      rotate: { y: TAU * i }
    });
    const woodAnchor2 = new Zdog.Anchor({
      addTo: woodAnchor,
      translate: { x: -6 },
      rotate: { y: TAU / 4 }
    });
    const woodAnchor3 = new Zdog.Anchor({
      addTo: woodAnchor2,
      rotate: { x: -Math.random() * TAU / 8 + TAU / 32 }
    });
    new Zdog.Cylinder({
      addTo: woodAnchor3,
      length: 6,
      translate: { y: 5 },
      color: "#" + Math.floor(Math.random() * 30 + 130).toString(16) + "5522",
      backface: "#741"
    });
  }

  // Create fire particles
  const fires = [];
  for (let i = 0; i < 32; i++) {
    const fireAnchor = new Zdog.Anchor({
      addTo: campFire,
      translate: { y: 5 },
      rotate: { y: Math.random() * TAU }
    });
    const dist = Math.random();
    const dist2 = 1 - dist;
    const fire = new Zdog.Shape({
      addTo: fireAnchor,
      path: [{ y: 0 }, { y: -2 }],
      translate: { x: dist * 2.5 },
      stroke: Math.random() * 2 + 2,
      color: `rgba(255,${100 + dist2 * 60},0,.5)`,
      visible: false
    });
    fires[i] = {
      fireAnchor: fireAnchor,
      fire: fire,
      delay: Math.floor(Math.random() * 48),
      height: -Math.random() * 10 - 8
    };
  }

  // Create smoke particles (placeholder)
  const smokes = [];
  for (let i = 0; i < 16; i++) {
    const smokeAnchor = new Zdog.Anchor({
      addTo: campFire,
      translate: { y: 10 }
    });
    const smoke = new Zdog.Shape({
      stroke: 4
    });
  }

  // Create fire light effects
  const light = new Zdog.Shape({
    addTo: campFire,
    translate: { y: 1 },
    stroke: 8,
    color: "#f902"
  });

  const light2 = new Zdog.Shape({
    addTo: light,
    stroke: 12,
    color: "#f901"
  });

  let n = 0;
  function animate() {
    // Animate fire particles
    fires.forEach(fire => {
      if (fire.delay < 0) {
        fire.fire.visible = true;
        fire.fire.translate.y -= 0.2;
        fire.fire.color = fire.fire.color.replace(/\.?\d+(?=\)$)/, (match) => {
          return (0.5 - fire.fire.translate.y / fire.height * 0.5).toFixed(2);
        });
        if (fire.fire.translate.y < fire.height) {
          fire.fireAnchor.rotate.y = Math.random() * TAU;
          const dist = Math.random();
          const dist2 = 1 - dist;
          fire.delay = Math.floor(Math.random() * 48);
          fire.fire.translate.x = dist * 2.5;
          fire.fire.translate.y = 0;
          fire.fire.color = `rgba(255,${100 + dist2 * 60},0,.5)`;
          fire.fire.visible = false;
        }
      } else {
        fire.delay--;
      }
    });

    // Animate light flickering
    light.stroke = 8 + 0.5 * Math.sin(n / 16);
    light2.stroke = 12 + 0.5 * Math.sin(n / 16);

    // Rotate if not dragging
    if (isSpinning) {
      illo.rotate.y += TAU / 512;
    }

    illo.updateRenderGraph();
    n++;
    animationFrameId = requestAnimationFrame(animate);
  }

  animate();

  return () => {
    //cancelAnimationFrame(animationFrameId);
  };
},
    burger: (element) => { var yellow = '#ED0';
		var gold = '#EA0';
		var orange = '#E62';
		var garnet = '#C25';
		const TAU = Zdog.TAU;

		var illo = new Zdog.Illustration({
		element: '.zdog-burger',
		dragRotate: true,
		rotate: { x: -TAU/8 },
		});

		var burger = new Zdog.Anchor({
		addTo: illo,
		translate: { y: 24 },
		rotate: { x: TAU/4 },
		});

		// top bun
		var topBun = new Zdog.Hemisphere({
		addTo: burger,
		diameter: 96,
		translate: { z: 44 },
		stroke: 24,
		color: orange,
		// backface: gold,
		});

		// cheese
		new Zdog.Rect({
		addTo: burger,
		width: 92,
		height: 92,
		translate: { z: 24 },
		stroke: 16,
		color: yellow,
		fill: true,
		});

		// patty
		new Zdog.Ellipse({
		addTo: burger,
		diameter: 96,
		stroke: 32,
		color: garnet,
		fill: true,
		});

		// bottom bun
		new Zdog.Cylinder({
		addTo: burger,
		diameter: topBun.diameter,
		length: 16,
		translate: { z: -36 },
		stroke: topBun.stroke,
		color: topBun.color,
		});

		var seedAnchor = new Zdog.Anchor({
		addTo: topBun,
		});

		var seedZ = ( topBun.diameter + topBun.stroke ) / 2 + 1;
		// seed
		new Zdog.Shape({
		addTo: seedAnchor,
		path: [ { y: -3 }, { y: 3 } ],
		translate: { z: seedZ },
		stroke: 8,
		color: gold,
		});

		seedAnchor.copyGraph({
		rotate: { x: 0.6 },
		});
		seedAnchor.copyGraph({
		rotate: { x: -0.6 },
		});
		seedAnchor.copyGraph({
		rotate: { y: -0.5 },
		});
		seedAnchor.copyGraph({
		rotate: { y: 0.5 },
		});

		function animate() {
		illo.updateRenderGraph();
		requestAnimationFrame( animate );
		}

		animate();
		return () => {
        cancelAnimationFrame(animationFrameId);
		};
		},
    ball: (element) => { // Made with Zdog
    // ----- setup ----- //
    var sceneSize = 250; // Changed to match desired size
    var isSpinning = true;
    var TAU = Zdog.TAU;

    var illo = new Zdog.Illustration({
        element: element,
        dragRotate: true,
        width: 250,
        height: 250,
        onDragStart: function() {
            isSpinning = false;
        },
        onResize: function(width, height) {
            this.zoom = Math.floor(Math.min(width, height) / sceneSize);
        },
    });

    // colors
    var yellow = '#000';
    var gold = '#fff';
    var orange = '#000';
    var garnet = '#fff';
    var eggplant = '#000';

    // ----- model ----- //

    // Scale up all dimensions by a factor of ~2.5 (since original was ~100px)
    var scaleFactor = 2.5;

    var hemi = new Zdog.Cone({
        addTo: illo,
        diameter: 13 * scaleFactor, // Scaled up
        translate: { y: -16 * scaleFactor }, // Scaled up
        rotate: { x: -TAU/4 },
        color: garnet,
        stroke: false,
    });
    var cone = new Zdog.Cone({
        addTo: illo,
        diameter: 13 * scaleFactor, // Scaled up
        translate: { y: 16 * scaleFactor }, // Scaled up
        rotate: { x: TAU/4 },
        color: garnet,
        stroke: false,
    });

    new Zdog.Shape({
        addTo: illo,
        stroke: 34.5 * scaleFactor, // Scaled up
        color: '#D8DADF',
    });

    var colorWheel = [ eggplant, garnet, orange, gold, yellow, ];

    [ true, false ].forEach( function( isHemi ) {
        var shape = isHemi ? hemi : cone;

        for ( var i=0; i < 5; i++ ) {
            var rotor1 = new Zdog.Anchor({
                addTo: illo,
                rotate: { y: TAU/5 * i },
            });
            var rotor2 = new Zdog.Anchor({
                addTo: rotor1,
                rotate: { x: TAU/6 },
            });

            shape.copy({
                addTo: rotor2,
                color: colorWheel[i],
            });
        }
    });

    // ----- animate ----- //

    var keyframes = [
        { x: TAU * 0,   y: TAU * 0 },
        { x: TAU * 1/2, y: TAU * 1/2 },
        { x: TAU * 1,   y: TAU * 1 },
    ];

    var ticker = 0;
    var cycleCount = 180;
    var turnLimit = keyframes.length - 1;

    var animationFrameId;

    function animate() {
        spin();
        illo.updateRenderGraph();
        animationFrameId = requestAnimationFrame( animate );
    }

    function spin() {
        if ( !isSpinning ) {
            return;
        }
        var progress = ticker / cycleCount;
        var tween = Zdog.easeInOut( progress % 1, 3 );
        var turn = Math.floor( progress % turnLimit );
        var keyA = keyframes[ turn ];
        var keyB = keyframes[ turn + 1 ];
        var thetaX = Zdog.lerp( keyA.x, keyB.x, tween );
        illo.rotate.x = Math.cos( thetaX ) * TAU/12;
        illo.rotate.y = Zdog.lerp( keyA.y, keyB.y, tween ) ;
        ticker++;
    }

    animate();
    return () => {
        cancelAnimationFrame(animationFrameId);
    };
}
};


// ====================================================================
// 4. THE INDIVIDUAL EFFECT COMPONENT
// This component handles rendering a single animated item.
// ====================================================================

const AnimatedEffect = ({ effect, index }) => {
  const animationRef = useRef(null);

  useEffect(() => {
    // Ensure the element is in the DOM
    if (!animationRef.current) return;
    
    // Check if an initializer function exists for this effect type
    const initializer = animationInitializers[effect.moving_effect];
    if (initializer) {
      // Run the animation script and get the cleanup function
      const cleanup = initializer(animationRef.current);
      
      // Return the cleanup function to be run when the component unmounts
      return cleanup;
    }
  }, [effect.moving_effect]); // Rerun effect if the type changes

  const renderVisual = () => {
    switch(effect.moving_effect) {
      case 'bee': return <svg ref={animationRef} className="zdog-svg" width="250" height="200"></svg>;
      case 'qr': return <div className="fairy rounded-lg"><img className="rounded-lg" loading="lazy" src="/qr/123.png" width="150px" alt="QR Code" /></div>;
      case 'saucer': return <svg ref={animationRef} id="challenge" width="250" height="250"></svg>;
      case 'bird': return <canvas ref={animationRef} id="canvas"></canvas>;
      case 'plane': return <canvas ref={animationRef} className="zdog-canvas"></canvas>;
      case 'real': return <canvas ref={animationRef} className="illo"></canvas>;
      case 'coffee': return <svg ref={animationRef} id="coffee" width="250" height="250"></svg>;
      case 'time': return <canvas ref={animationRef} className="time"></canvas>;
      case 'fire': return <canvas ref={animationRef} id="fire" style={{zIndex:999999}}></canvas>;
      case 'burger': return <canvas ref={animationRef} className="zdog-burger" width="250" height="250"></canvas>;
      case 'ball': return <canvas ref={animationRef} className="zdog-ball"></canvas>;
      case 'superhero': return <SuperheroSVG />;
      default: return <DynamicMedia avatarLink={effect.avatar_link} />;
    }
  };

  return (
    <div className={`saucer${index} `}>
      <a href={effect.landing_page} className="w-full text-center text-white-600" style={{ width: '100%' }} target="_blank" rel="noopener noreferrer">
	  {renderVisual()}
	  <h1 className="funky-text text-4xl text-lime-400 font-extrabold">
		  <div dangerouslySetInnerHTML={{ __html: (effect.brand_message || '').replace(/ /g, '<br />') }} />
		</h1>
	</a>
      <style jsx>{`
        .funky-text {
          font-family: 'Comic Sans MS', cursive, sans-serif;
          text-shadow: 2px 2px 0 #000;
        }
      `}</style>
    </div>
  );
};

// ====================================================================
// 5. THE MAIN PARENT COMPONENT
// This is the component you will import and use in your application.
// ====================================================================

const EffectsDisplay = ({ effects }) => {
  // Ensure 'effects' is an array to prevent errors
  if (!Array.isArray(effects) || effects.length === 0) {
    return null;
  }
  
  return (
    <>
      <GlobalEffectsStyle effects={effects} />
        {effects.map((effect, index) => (
          <AnimatedEffect key={index} effect={effect} index={index} />
        ))}
    </>
  );
};

export default EffectsDisplay;