'use client';

import React, { useEffect, useRef } from 'react';
import { WeatherTheme } from '@/types/weather';

interface WeatherCanvasProps {
  theme: WeatherTheme;
}

export const WeatherCanvas: React.FC<WeatherCanvasProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    type Particle = {
      x: number;
      y: number;
      length?: number;
      speed?: number;
      opacity?: number;
      radius?: number;
      swaySpeed?: number;
      alpha?: number;
      alphaSpeed?: number;
      speedX?: number;
      speedY?: number;
    };

    let particles: Particle[] = [];
    const count = width < 768 ? 40 : 85;

    if (theme === 'rain' || theme === 'thunderstorm') {
      const rainCount = theme === 'thunderstorm' ? 140 : 90;
      for (let i = 0; i < rainCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          length: 14 + Math.random() * 16,
          speed: 12 + Math.random() * 8,
          opacity: 0.2 + Math.random() * 0.4,
        });
      }
    } else if (theme === 'snow') {
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 1.5 + Math.random() * 2.5,
          speed: 1 + Math.random() * 1.5,
          swaySpeed: 0.02 + Math.random() * 0.02,
        });
      }
    } else if (theme === 'clear-night' || theme === 'clouds-night') {
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 0.8 + Math.random() * 1.8,
          alpha: Math.random(),
          alphaSpeed: 0.01 + Math.random() * 0.02,
        });
      }
    } else {
      // Clear Day / Clouds Day ambient motes
      for (let i = 0; i < 35; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 1 + Math.random() * 2,
          speedY: -0.2 - Math.random() * 0.4,
          speedX: (Math.random() - 0.5) * 0.3,
        });
      }
    }

    let animationId: number;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      if (theme === 'rain' || theme === 'thunderstorm') {
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (const p of particles) {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 3, p.y + (p.length || 15));
          p.y += p.speed || 14;
          p.x -= 1.5;
          if (p.y > height) {
            p.y = -20;
            p.x = Math.random() * width;
          }
        }
        ctx.stroke();

        if (theme === 'thunderstorm' && Math.random() < 0.007) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
          ctx.fillRect(0, 0, width, height);
        }
      } else if (theme === 'snow') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        for (const p of particles) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius || 2, 0, Math.PI * 2);
          ctx.fill();
          p.y += p.speed || 1;
          p.x += Math.sin(p.y * (p.swaySpeed || 0.02)) * 0.6;
          if (p.y > height) {
            p.y = -5;
            p.x = Math.random() * width;
          }
        }
      } else if (theme === 'clear-night' || theme === 'clouds-night') {
        for (const p of particles) {
          p.alpha = (p.alpha || 0.5) + (p.alphaSpeed || 0.01);
          if (p.alpha > 1 || p.alpha < 0.2) p.alphaSpeed = -(p.alphaSpeed || 0.01);
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, p.alpha)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius || 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
        for (const p of particles) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius || 1.5, 0, Math.PI * 2);
          ctx.fill();
          p.y += p.speedY || -0.3;
          p.x += p.speedX || 0;
          if (p.y < 0) {
            p.y = height + 5;
            p.x = Math.random() * width;
          }
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme]);

  return <canvas ref={canvasRef} className="weather-canvas" />;
};
