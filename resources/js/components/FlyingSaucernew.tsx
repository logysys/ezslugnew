import { useEffect, useRef } from 'react';
import Zdog from 'zdog';

const FlyingSaucer = () => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const TAU = Zdog.TAU;
    let isSpinning = true;
    
    const yellow = 'rgb(255, 200, 0, 1)';

    let illo = new Zdog.Illustration({
      element: svgRef.current,
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
    let animationFrameId;

    function animate() {
      t += tSpeed;
      let theta = t * TAU;
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
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div 
      className="absolute w-full z-50 flex flex-col items-center justify-center p-4 space-y-2 rounded-lg"
      style={{
        animation: 'fly 10s infinite ease-in-out',
        margin: '2em auto',
        zIndex: 999999,
        width: 'min(250px, 80vw)',
        height: 'min(250px, 80vw)',
        maxWidth: '250px',
        maxHeight: '250px'
      }}
    >
      <svg ref={svgRef} width="100%" height="100%" preserveAspectRatio="xMidYMid meet"></svg>
      <style>{`
        @keyframes fly {
          0% {
            top: 0%;
            left: 0%;
            transform: translate(0, 0);
          }
          25% {
            top: 20%;
            left: 20%;
            transform: translate(0, 0);
          }
          50% {
            top: 40%;
            left: 0%;
            transform: translate(0, 0);
          }
          75% {
            top: 20%;
            left: -20%;
            transform: translate(0, 0);
          }
          100% {
            top: 0%;
            left: 0%;
            transform: translate(0, 0);
          }
        }
        
        .funky-text {
          font-family: 'Comic Sans MS', cursive, sans-serif;
          text-shadow: 2px 2px 0 #000;
        }
        
        @media (max-width: 768px) {
          @keyframes fly {
            0% {
              top: 0%;
              left: 0%;
            }
            25% {
              top: 15%;
              left: 15%;
            }
            50% {
              top: 30%;
              left: 0%;
            }
            75% {
              top: 15%;
              left: -15%;
            }
            100% {
              top: 0%;
              left: 0%;
            }
          }
        }
        
        @media (max-width: 480px) {
          @keyframes fly {
            0% {
              top: 0%;
              left: 0%;
            }
            25% {
              top: 10%;
              left: 10%;
            }
            50% {
              top: 20%;
              left: 0%;
            }
            75% {
              top: 10%;
              left: -10%;
            }
            100% {
              top: 0%;
              left: 0%;
            }
          }
        }
      `}</style>
    </div>
  );
};

export default FlyingSaucer;