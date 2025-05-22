import { useEffect, useRef } from 'react';

const Fireflies: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Firefly properties
    const fireflies: {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
    }[] = [];
    const fireflyCount = 50;

    // Initialize fireflies
    for (let i = 0; i < fireflyCount; i++) {
      fireflies.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5, // Keep small size for faint effect
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        opacity: Math.random() * 0.3 + 0.1, // Initial faint opacity
      });
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      fireflies.forEach(firefly => {
        // Update position
        firefly.x += firefly.speedX;
        firefly.y += firefly.speedY;

        // Bounce off edges
        if (firefly.x < 0 || firefly.x > canvas.width) firefly.speedX *= -1;
        if (firefly.y < 0 || firefly.y > canvas.height) firefly.speedY *= -1;

        // Draw firefly with glow
        ctx.beginPath();
        ctx.arc(firefly.x, firefly.y, firefly.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${firefly.opacity})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Vary opacity for stronger pulsing effect
        firefly.opacity += (Math.random() - 0.5) * 0.08; // Increased for more noticeable pulsing
        if (firefly.opacity < 0.1) firefly.opacity = 0.1; // Lower bound for faintness
        if (firefly.opacity > 0.6) firefly.opacity = 0.6; // Upper bound for stronger pulse
      });

      requestAnimationFrame(animate);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
  );
};

export default Fireflies;
