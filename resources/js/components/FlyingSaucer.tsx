import { useEffect, useRef } from 'react';
import Zdog from 'zdog';

const FlyingSaucer = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const TAU = Zdog.TAU;
    let isSpinning = true;
    let delta = TAU * 2 / 32;
    
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
      element: svgRef.current,
      dragRotate: true,
    });

    let p0 = new Zdog.Vector({ x: 0, y: 0, z: 0 });
    let p1 = new Zdog.Vector({ x: 0, y: -36, z: 0 });
    let p2 = new Zdog.Vector({ x: 16, y: -48, z: 0 });
    let p3 = new Zdog.Vector({ x: 0, y: -64, z: 16 });

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
        { x: 12, y: -4 },          // start
        { x: 12, y: 4 },          // line to 
        { move: { x: -12, y: -4 } }, // move to left
        { x: -12, y: 4 },          // line to 
      ],
      closed: false,
      stroke: 12,
      color: '#000',
    });

    let sensor = new Zdog.Ellipse({
      addTo: head,
      translate: { x: 8, y: -32, z: -16 },
      rotate: { y: TAU / 4 },
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
      rotate: { x: TAU / 4 },
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
      rotate: { x: TAU / 4 },
      width: 64,
      height: 42,
      cornerRadius: 8,
      stroke: 12,
      fill: true,
      color: 'rgba(89, 171, 255, 0.6)',
    });

    let t = 1;
    let tSpeed = 1 / 2.89;

    function animate() {
      t += tSpeed;
      let theta = t * TAU;
      anchorWingL.rotate.z = 1.5 * (Math.sin(theta));
      anchorWingL.rotate.x = 0.5 * (Math.cos(theta));
      anchorWingR.rotate.z = -1.5 * (Math.sin(theta));
      anchorWingR.rotate.x = -0.5 * (Math.cos(theta));
      illo.rotate.y += isSpinning ? -0.02 : 0;
      illo.updateRenderGraph();
      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      // Cleanup if needed
    };
  }, []);

  return (
    <div 
      className="absolute w-[44%] sm:w-[33%] md:w-[25%] lg:w-[21%] z-50 flex flex-col items-center justify-center p-4 space-y-2 rounded-lg"
      style={{
        animation: 'fly 10s infinite ease-in-out',
        margin: '2em auto',
        zIndex: 999999
      }}
    >
      <svg ref={svgRef} className="zdog-svg" width="250" height="200"></svg>
      <style tsx>{`
	  .funky-text {
      font-family: 'Comic Sans MS', cursive, sans-serif;
      text-shadow: 2px 2px 0 #000;
    }
        @keyframes fly {
          0% {
            top: 0%;
          }
          10% {
            top: 10%;
          }
          40% {
            top: 40%;
          }
          50% {
            top: 50%;
          }
          60% {
            top: 40%;
          }
          90% {
            top: 10%;
          }
          100% {
            top: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export default FlyingSaucer;