import React, { useEffect, useRef } from 'react';

const WavyLines = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePosition = useRef({ x: 0, y: 0 });
  const lines = useRef<Array<{
    startX: number;
    y: number;
    amplitude: number;
    frequency: number;
    speed: number;
    phase: number;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Initialize lines
    const initLines = () => {
      lines.current = Array.from({ length: 15 }, (_, i) => ({
        startX: 0,
        y: (window.innerHeight / 16) * (i + 1),
        amplitude: Math.random() * 30 + 20,
        frequency: Math.random() * 0.02 + 0.01,
        speed: Math.random() * 0.002 + 0.001,
        phase: Math.random() * Math.PI * 2
      }));
    };

    // Handle mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.current = {
        x: e.clientX,
        y: e.clientY
      };
    };

    // Animation function
    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      lines.current.forEach((line, index) => {
        ctx.beginPath();
        ctx.moveTo(line.startX, line.y);

        // Update phase
        line.phase += line.speed;

        // Draw wavy line
        for (let x = 0; x < canvas.width; x += 1) {
          const distanceFromMouse = Math.abs(x - mousePosition.current.x) + 
                                  Math.abs(line.y - mousePosition.current.y);
          const influence = Math.max(0, 1 - distanceFromMouse / 200);
          
          const amplitude = line.amplitude * (1 + influence);
          const y = line.y + 
                   Math.sin(x * line.frequency + line.phase) * amplitude;

          ctx.lineTo(x, y);
        }

        // Line style
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + index * 0.02})`;
        ctx.lineWidth = 1;
        ctx.filter = 'blur(1px)';
        
        // Add glow effect
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = 5;
        
        ctx.stroke();
        ctx.filter = 'none';
      });

      requestAnimationFrame(animate);
    };

    // Initialize
    resizeCanvas();
    initLines();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        opacity: 0.6,
      }}
    />
  );
};

export default WavyLines;