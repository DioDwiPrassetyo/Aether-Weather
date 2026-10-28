'use client';

import React, { useEffect, useRef } from 'react';
import { WeatherTheme } from '@/types/weather';

interface WeatherCanvasProps {
  theme: WeatherTheme;
  isNight?: boolean;
  weatherId?: number;
  windSpeed?: number;
}

export const WeatherCanvas: React.FC<WeatherCanvasProps> = ({
  theme,
  isNight = false,
  weatherId,
  windSpeed = 3.5,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check for reduced motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse & Parallax tracking
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      speed: 0,
      active: false,
    };

    let lastMouseX = width / 2;
    let lastMouseY = height / 2;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;

      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      mouse.speed = Math.min(Math.hypot(dx, dy), 35);
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
        mouse.active = true;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Gyroscope tilt tracking for mobile
    let gyroX = 0;
    let gyroY = 0;
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        gyroX = Math.max(-25, Math.min(25, e.gamma)) * 0.8;
        gyroY = (Math.max(10, Math.min(60, e.beta)) - 35) * 0.8;
      }
    };
    window.addEventListener('deviceorientation', handleOrientation, { passive: true });

    const isMobile = width < 768;
    const isLowPowerCpu =
      typeof navigator !== 'undefined' &&
      typeof navigator.hardwareConcurrency === 'number' &&
      navigator.hardwareConcurrency <= 4;
    const perfScale = isLowPowerCpu ? 0.78 : 1.0;

    // Pre-rendered offscreen sprites for zero-GC 60 FPS snow & crystal rendering
    const snowPuffSprite = document.createElement('canvas');
    snowPuffSprite.width = 32;
    snowPuffSprite.height = 32;
    const puffCtx = snowPuffSprite.getContext('2d');
    if (puffCtx) {
      const pGrad = puffCtx.createRadialGradient(16, 16, 0, 16, 16, 15);
      pGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      pGrad.addColorStop(0.55, 'rgba(224, 242, 254, 0.65)');
      pGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      puffCtx.fillStyle = pGrad;
      puffCtx.beginPath();
      puffCtx.arc(16, 16, 15, 0, Math.PI * 2);
      puffCtx.fill();
    }

    const dendriteSprite = document.createElement('canvas');
    dendriteSprite.width = 48;
    dendriteSprite.height = 48;
    const denCtx = dendriteSprite.getContext('2d');
    if (denCtx) {
      denCtx.translate(24, 24);
      denCtx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      denCtx.lineWidth = 2.2;
      denCtx.lineCap = 'round';
      const armLen = 19;
      for (let a = 0; a < 3; a++) {
        denCtx.save();
        denCtx.rotate((a * Math.PI) / 3);
        denCtx.beginPath();
        denCtx.moveTo(0, -armLen);
        denCtx.lineTo(0, armLen);
        const bPos = armLen * 0.55;
        const bSize = armLen * 0.34;
        denCtx.moveTo(-bSize, -bPos - bSize * 0.55);
        denCtx.lineTo(0, -bPos);
        denCtx.lineTo(bSize, -bPos - bSize * 0.55);
        denCtx.moveTo(-bSize, bPos + bSize * 0.55);
        denCtx.lineTo(0, bPos);
        denCtx.lineTo(bSize, bPos + bSize * 0.55);
        denCtx.stroke();
        denCtx.restore();
      }
      denCtx.fillStyle = 'rgba(186, 230, 253, 0.9)';
      denCtx.beginPath();
      denCtx.arc(0, 0, armLen * 0.24, 0, Math.PI * 2);
      denCtx.fill();
    }

    // ==========================================
    // 1. PHOTOREALISTIC MULTI-LAYER RAIN, DOWNPOUR CURTAINS & SPLASH ENGINE
    // ==========================================
    const isThunderstorm =
      theme === 'thunderstorm' || (weatherId !== undefined && weatherId >= 200 && weatherId < 300);
    const isHeavyStormRain =
      isThunderstorm ||
      (weatherId !== undefined &&
        ([502, 503, 504, 521, 522, 531].includes(weatherId) ||
          (weatherId >= 300 && weatherId < 600 && weatherId !== 511 && (windSpeed || 0) >= 7)));
    const isDrizzle = weatherId !== undefined && weatherId >= 300 && weatherId < 400;
    const isRainTheme =
      theme === 'rain' ||
      theme === 'thunderstorm' ||
      (weatherId !== undefined && weatherId >= 200 && weatherId < 600 && weatherId !== 511);

    const isSleet =
      weatherId !== undefined && [511, 611, 612, 613, 615, 616].includes(weatherId);
    const isBlizzard =
      weatherId === 602 ||
      weatherId === 622 ||
      (weatherId !== undefined &&
        weatherId >= 600 &&
        weatherId < 700 &&
        (windSpeed || 0) >= 9);
    const isSnowTheme =
      !isRainTheme &&
      (theme === 'snow' ||
        weatherId === 511 ||
        (weatherId !== undefined && weatherId >= 600 && weatherId < 700));
    const isMistTheme =
      !isRainTheme &&
      !isSnowTheme &&
      (theme === 'mist' || (weatherId !== undefined && weatherId >= 700 && weatherId < 800));

    // Calculate natural wind drift angle based on actual wind speed & storm intensity
    const stormWindBoost = isHeavyStormRain ? 1.6 : isDrizzle ? 0.75 : 1.05;
    const baseWindDrift = Math.max(
      -12,
      Math.min(12, -(windSpeed || (isHeavyStormRain ? 8.5 : 3.5)) * 0.42 * stormWindBoost)
    );

    type Raindrop = {
      x: number;
      y: number;
      z: number;
      layer: 0 | 1 | 2; // 0: background fine veil, 1: midground rain, 2: foreground crystal streaks
      speed: number;
      length: number;
      width: number;
      opacity: number;
      impactY: number; // Perspective ground impact line based on depth z
      forceX: number;
      forceY: number;
    };

    type Splash = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      decay: number;
      isStreak: boolean;
    };

    type Ripple = {
      x: number;
      y: number;
      r: number;
      maxR: number;
      alpha: number;
      decay: number;
      hasEcho: boolean;
    };

    type DownpourShaft = {
      x: number;
      width: number;
      speed: number;
      alpha: number;
      phase: number;
    };

    type GlassDroplet = {
      x: number;
      y: number;
      radius: number;
      alpha: number;
      isSliding: boolean;
      slideSpeed: number;
      wobble: number;
      trail: Array<{ x: number; y: number; alpha: number; r: number }>;
    };

    type WindSquallStreak = {
      x: number;
      y: number;
      length: number;
      speed: number;
      alpha: number;
      maxAlpha: number;
      life: number;
      maxLife: number;
      curve: number;
    };

    type StormCloudPuff = {
      x: number;
      y: number;
      rx: number;
      ry: number;
      speed: number;
      baseAlpha: number;
    };

    const raindrops: Raindrop[] = [];
    const splashes: Splash[] = [];
    const ripples: Ripple[] = [];
    const downpourShafts: DownpourShaft[] = [];
    const glassDroplets: GlassDroplet[] = [];
    const windStreaks: WindSquallStreak[] = [];
    const stormClouds: StormCloudPuff[] = [];

    if (isRainTheme) {
      const densityMult = (isHeavyStormRain ? 1.45 : isDrizzle ? 0.85 : 1.15) * perfScale;
      const speedMult = isHeavyStormRain ? 1.28 : isDrizzle ? 0.82 : 1.05;
      const lengthMult = isHeavyStormRain ? 1.35 : isDrizzle ? 0.85 : 1.15;

      // Distant atmospheric downpour shafts (Tirai Hujan)
      const shaftCount = isMobile ? 4 : 7;
      for (let i = 0; i < shaftCount; i++) {
        downpourShafts.push({
          x: (i / shaftCount) * (width + 300) - 150,
          width: 110 + Math.random() * 160,
          speed: (baseWindDrift >= 0 ? 1 : -1) * (0.25 + Math.random() * 0.45),
          alpha: isHeavyStormRain ? 0.055 + Math.random() * 0.04 : 0.032 + Math.random() * 0.028,
          phase: Math.random() * Math.PI * 2,
        });
      }

      // Layer 0: Background dense rain veil (fine, distant perspective)
      const countL0 = Math.round((isMobile ? 55 : 110) * densityMult);
      for (let i = 0; i < countL0; i++) {
        const z = 340 + Math.random() * 320;
        raindrops.push({
          x: Math.random() * (width + 450) - 225,
          y: Math.random() * height,
          z,
          layer: 0,
          speed: (14 + Math.random() * 7) * speedMult,
          length: (18 + Math.random() * 14) * lengthMult,
          width: isHeavyStormRain ? 1.0 : 0.85,
          opacity: (0.2 + Math.random() * 0.18) * (isHeavyStormRain ? 1.2 : 1),
          impactY: height * (0.78 + Math.random() * 0.09),
          forceX: 0,
          forceY: 0,
        });
      }

      // Layer 1: Midground crisp falling rain
      const countL1 = Math.round((isMobile ? 42 : 80) * densityMult);
      for (let i = 0; i < countL1; i++) {
        const z = 110 + Math.random() * 210;
        raindrops.push({
          x: Math.random() * (width + 450) - 225,
          y: Math.random() * height,
          z,
          layer: 1,
          speed: (22 + Math.random() * 9) * speedMult,
          length: (30 + Math.random() * 20) * lengthMult,
          width: isHeavyStormRain ? 1.65 : 1.4,
          opacity: (0.42 + Math.random() * 0.26) * (isHeavyStormRain ? 1.15 : 1),
          impactY: height * (0.86 + Math.random() * 0.08),
          forceX: 0,
          forceY: 0,
        });
      }

      // Layer 2: Foreground cinematic crystal streaks with leading water-bead tips
      const countL2 = Math.round((isMobile ? 18 : 34) * densityMult);
      for (let i = 0; i < countL2; i++) {
        const z = 10 + Math.random() * 85;
        raindrops.push({
          x: Math.random() * (width + 450) - 225,
          y: Math.random() * height,
          z,
          layer: 2,
          speed: (30 + Math.random() * 11) * speedMult,
          length: (48 + Math.random() * 28) * lengthMult,
          width: isHeavyStormRain ? 2.25 : 1.95,
          opacity: 0.62 + Math.random() * 0.3,
          impactY: height * (0.93 + Math.random() * 0.065),
          forceX: 0,
          forceY: 0,
        });
      }

      // Window Glass Teardrop Beads (subtle, natural stop-and-go rivulets)
      const glassDropCount = Math.round((isMobile ? 12 : 22) * (isHeavyStormRain ? 1.25 : 1));
      for (let i = 0; i < glassDropCount; i++) {
        glassDroplets.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: 1.6 + Math.random() * 2.6,
          alpha: 0.38 + Math.random() * 0.35,
          isSliding: Math.random() < (isHeavyStormRain ? 0.6 : 0.42),
          slideSpeed: (0.35 + Math.random() * 1.35) * (isHeavyStormRain ? 1.4 : 1),
          wobble: Math.random() * Math.PI * 2,
          trail: [],
        });
      }

      // Upper Canopy Rain Clouds (for all rain modes, deeper in storms)
      const cloudCount = isMobile ? 5 : 9;
      for (let i = 0; i < cloudCount; i++) {
        stormClouds.push({
          x: (i / cloudCount) * (width + 400) - 200,
          y: -30 + Math.random() * (height * 0.16),
          rx: 190 + Math.random() * 230,
          ry: 65 + Math.random() * 60,
          speed: -0.2 - Math.random() * 0.4,
          baseAlpha: isThunderstorm ? 0.44 : isHeavyStormRain ? 0.32 : 0.18,
        });
      }
    }

    // ==========================================
    // 2. WINTER SNOW, BLIZZARD, SLEET, FOG & CELESTIAL PARTICLES
    // ==========================================
    type SnowflakeParticle = {
      x: number;
      y: number;
      z: number;
      layer: 0 | 1 | 2; // 0: background powder, 1: midground soft flake, 2: foreground 6-arm dendrite crystal
      vx: number;
      vy: number;
      radius: number;
      swaySpeed: number;
      swayPhase: number;
      swayAmp: number;
      angle: number;
      spinSpeed: number;
      alpha: number;
      forceX: number;
      forceY: number;
    };

    type SleetPellet = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      length: number;
      size: number;
      alpha: number;
      impactY: number;
    };

    type IceBounceSpark = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
    };

    type FogBank = {
      x: number;
      y: number;
      rx: number;
      ry: number;
      speed: number;
      alpha: number;
      phase: number;
    };

    type OtherParticle = {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      radius?: number;
      swaySpeed?: number;
      swayPhase?: number;
      alpha?: number;
      alphaSpeed?: number;
      forceX: number;
      forceY: number;
    };

    const snowflakes: SnowflakeParticle[] = [];
    const sleetPellets: SleetPellet[] = [];
    const iceSparks: IceBounceSpark[] = [];
    const snowClouds: StormCloudPuff[] = [];
    const blizzardStreaks: WindSquallStreak[] = [];
    const fogBanks: FogBank[] = [];
    const otherParticles: OtherParticle[] = [];
    const focalLength = 360;

    if (isSnowTheme) {
      const snowDensity = (isBlizzard ? 1.75 : isSleet ? 0.9 : 1.2) * perfScale;
      const snowSpeedMult = isBlizzard ? 2.4 : isSleet ? 1.35 : 1.0;

      // Upper Arctic Overcast Clouds
      const cloudCount = isMobile ? 5 : 8;
      for (let i = 0; i < cloudCount; i++) {
        snowClouds.push({
          x: (i / cloudCount) * (width + 400) - 200,
          y: -25 + Math.random() * (height * 0.15),
          rx: 200 + Math.random() * 220,
          ry: 60 + Math.random() * 55,
          speed: isBlizzard ? -0.55 - Math.random() * 0.65 : -0.18 - Math.random() * 0.25,
          baseAlpha: isBlizzard ? 0.34 : 0.2,
        });
      }

      // Layer 0: Background fine snow powder
      const countS0 = Math.round((isMobile ? 45 : 90) * snowDensity);
      for (let i = 0; i < countS0; i++) {
        snowflakes.push({
          x: Math.random() * (width + 400) - 200,
          y: Math.random() * height,
          z: 300 + Math.random() * 320,
          layer: 0,
          vx: isBlizzard ? -(4.5 + Math.random() * 3.5) : (Math.random() - 0.5) * 0.5,
          vy: (0.9 + Math.random() * 0.9) * snowSpeedMult,
          radius: 1.4 + Math.random() * 1.4,
          swaySpeed: 0.015 + Math.random() * 0.02,
          swayPhase: Math.random() * Math.PI * 2,
          swayAmp: isBlizzard ? 0.4 : 0.75,
          angle: Math.random() * Math.PI * 2,
          spinSpeed: (Math.random() - 0.5) * 0.02,
          alpha: 0.32 + Math.random() * 0.28,
          forceX: 0,
          forceY: 0,
        });
      }

      // Layer 1: Midground fluffy snowflakes
      const countS1 = Math.round((isMobile ? 32 : 64) * snowDensity);
      for (let i = 0; i < countS1; i++) {
        snowflakes.push({
          x: Math.random() * (width + 400) - 200,
          y: Math.random() * height,
          z: 110 + Math.random() * 180,
          layer: 1,
          vx: isBlizzard ? -(7.2 + Math.random() * 4.5) : (Math.random() - 0.5) * 0.7,
          vy: (1.4 + Math.random() * 1.3) * snowSpeedMult,
          radius: 2.6 + Math.random() * 2.2,
          swaySpeed: 0.02 + Math.random() * 0.025,
          swayPhase: Math.random() * Math.PI * 2,
          swayAmp: isBlizzard ? 0.6 : 1.25,
          angle: Math.random() * Math.PI * 2,
          spinSpeed: (Math.random() - 0.5) * 0.03,
          alpha: 0.55 + Math.random() * 0.32,
          forceX: 0,
          forceY: 0,
        });
      }

      // Layer 2: Foreground 6-pointed dendrite ice crystals
      const countS2 = Math.round((isMobile ? 14 : 26) * (isBlizzard ? 1.4 : 1.0));
      for (let i = 0; i < countS2; i++) {
        snowflakes.push({
          x: Math.random() * (width + 400) - 200,
          y: Math.random() * height,
          z: 15 + Math.random() * 85,
          layer: 2,
          vx: isBlizzard ? -(10.5 + Math.random() * 5.5) : (Math.random() - 0.5) * 0.9,
          vy: (2.0 + Math.random() * 1.5) * snowSpeedMult,
          radius: 4.8 + Math.random() * 3.4,
          swaySpeed: 0.022 + Math.random() * 0.025,
          swayPhase: Math.random() * Math.PI * 2,
          swayAmp: isBlizzard ? 0.8 : 1.6,
          angle: Math.random() * Math.PI * 2,
          spinSpeed: (isBlizzard ? 0.045 : 0.018) * (Math.random() < 0.5 ? -1 : 1),
          alpha: 0.72 + Math.random() * 0.25,
          forceX: 0,
          forceY: 0,
        });
      }

      // Sleet / Freezing Rain Ice Pellets (active during sleet or heavy blizzard)
      if (isSleet || isBlizzard) {
        const pelletCount = isSleet ? (isMobile ? 38 : 72) : isMobile ? 20 : 38;
        for (let i = 0; i < pelletCount; i++) {
          sleetPellets.push({
            x: Math.random() * (width + 400) - 200,
            y: Math.random() * height,
            vx: isBlizzard ? -(9 + Math.random() * 5) : -(3.2 + Math.random() * 2.2),
            vy: isSleet ? 15 + Math.random() * 7 : 11 + Math.random() * 5,
            length: isSleet ? 18 + Math.random() * 12 : 12 + Math.random() * 10,
            size: 1.6 + Math.random() * 1.2,
            alpha: 0.55 + Math.random() * 0.35,
            impactY: height * (0.82 + Math.random() * 0.15),
          });
        }
      }
    } else if (!isRainTheme) {
      if (isMistTheme) {
        const bankCount = isMobile ? 6 : 10;
        for (let i = 0; i < bankCount; i++) {
          fogBanks.push({
            x: Math.random() * (width + 400) - 200,
            y: height * (0.12 + (i / bankCount) * 0.78),
            rx: 260 + Math.random() * 320,
            ry: 55 + Math.random() * 65,
            speed: (i % 2 === 0 ? 1 : -1) * (0.18 + Math.random() * 0.28),
            alpha: 0.08 + Math.random() * 0.08,
            phase: Math.random() * Math.PI * 2,
          });
        }
        const mistMotes = isMobile ? 28 : 52;
        for (let i = 0; i < mistMotes; i++) {
          otherParticles.push({
            x: (Math.random() - 0.5) * (width * 1.4),
            y: Math.random() * height,
            z: 20 + Math.random() * 480,
            vx: 0.25 + Math.random() * 0.35,
            vy: (Math.random() - 0.5) * 0.15,
            radius: 2.2 + Math.random() * 3.5,
            alpha: 0.18 + Math.random() * 0.28,
            forceX: 0,
            forceY: 0,
          });
        }
      } else if (theme === 'malam' || theme === 'clear-night' || theme === 'clouds-night') {
        const starCount = isMobile ? 35 : 65;
        for (let i = 0; i < starCount; i++) {
          otherParticles.push({
            x: (Math.random() - 0.5) * (width * 1.3),
            y: (Math.random() - 0.5) * (height * 1.3),
            z: 30 + Math.random() * 600,
            vx: (Math.random() - 0.5) * 0.08,
            vy: (Math.random() - 0.5) * 0.08,
            radius: 0.9 + Math.random() * 2.2,
            alpha: 0.2 + Math.random() * 0.8,
            alphaSpeed: 0.008 + Math.random() * 0.016,
            forceX: 0,
            forceY: 0,
          });
        }
      } else {
        const count = isMobile ? 24 : 45;
        for (let i = 0; i < count; i++) {
          otherParticles.push({
            x: (Math.random() - 0.5) * (width * 1.3),
            y: Math.random() * height,
            z: 20 + Math.random() * 500,
            vx: (Math.random() - 0.5) * 0.35,
            vy: -0.25 - Math.random() * 0.4,
            radius: 1.2 + Math.random() * 2.2,
            alpha: 0.25 + Math.random() * 0.45,
            forceX: 0,
            forceY: 0,
          });
        }
      }
    }

    // Lightning & Storm Squall state for Thunderstorm & Heavy Storm Rain
    type LightningBranch = {
      points: Array<{ x: number; y: number }>;
      width: number;
      alphaScale: number;
    };

    let lightningTimer = 110;
    let lightningFlash = 0;
    let sheetFlash = 0;
    let restrikeCountdown = 0;
    let lightningEpicenterX = width * 0.5;
    let lightningEpicenterY = height * 0.12;
    let lightningBranches: LightningBranch[] = [];
    let squallPhase = Math.random() * Math.PI * 2;

    const generateBranchedLightning = (
      startX: number,
      startY: number,
      endX: number,
      endY: number
    ): LightningBranch[] => {
      const branches: LightningBranch[] = [];
      const mainPoints = [{ x: startX, y: startY }];
      let currentX = startX;
      let currentY = startY;
      const steps = 22;
      const dy = (endY - startY) / steps;
      const dxStep = (endX - startX) / steps;

      for (let s = 1; s < steps; s++) {
        currentX += dxStep + (Math.random() - 0.5) * 42;
        currentY += dy + (Math.random() - 0.5) * 6;
        mainPoints.push({ x: currentX, y: currentY });

        if (s > 3 && s < steps - 3 && Math.random() < 0.34) {
          const forkPoints = [{ x: currentX, y: currentY }];
          let fx = currentX;
          let fy = currentY;
          const forkSteps = 6 + Math.floor(Math.random() * 6);
          const forkDir = Math.random() < 0.5 ? -1 : 1;
          for (let f = 1; f <= forkSteps; f++) {
            fx += forkDir * (8 + Math.random() * 18) + (Math.random() - 0.5) * 10;
            fy += dy * (0.75 + Math.random() * 0.4);
            forkPoints.push({ x: fx, y: fy });
          }
          branches.push({
            points: forkPoints,
            width: 1.1 + Math.random() * 0.6,
            alphaScale: 0.65,
          });
        }
      }
      mainPoints.push({ x: endX, y: endY });
      branches.unshift({
        points: mainPoints,
        width: 2.6,
        alphaScale: 1,
      });
      return branches;
    };

    let animationId: number;
    let isRunning = true;
    let mistPhase = 0;
    const cx = width / 2;
    const cy = height / 2;

    const render = () => {
      if (!isRunning) return;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;
      mouse.speed *= 0.92;

      // Parallax offsets (camera translation in 3D)
      const camParallaxX = (mouse.x - cx) * 0.06 + gyroX * 2;
      const camParallaxY = (mouse.y - cy) * 0.06 + gyroY * 2;

      // ==========================================
      // A. RENDER REALISTIC MULTI-LAYER RAIN, DOWNPOUR SHAFTS & SPLASHES
      // ==========================================
      if (isRainTheme) {
        ctx.lineCap = 'round';

        // Dynamic Wind Gust / Squall Oscillation
        squallPhase += isHeavyStormRain ? 0.018 : 0.009;
        const squallSurge = isHeavyStormRain
          ? Math.sin(squallPhase) * 2.2 + Math.sin(squallPhase * 2.7) * 1.1
          : Math.sin(squallPhase) * 0.55 + Math.cos(squallPhase * 1.9) * 0.25;
        const effectiveWindDrift = baseWindDrift + squallSurge;

        // 0. Draw Upper Rolling Rain/Storm Cloud Canopy
        if (stormClouds.length > 0) {
          const totalFlash = Math.max(lightningFlash, sheetFlash);
          for (const sc of stormClouds) {
            sc.x += sc.speed + effectiveWindDrift * 0.05;
            if (sc.x < -sc.rx - 150) sc.x = width + sc.rx + 100;
            else if (sc.x > width + sc.rx + 150) sc.x = -sc.rx - 100;

            const cloudGrad = ctx.createRadialGradient(
              sc.x,
              sc.y,
              sc.ry * 0.15,
              sc.x,
              sc.y,
              sc.rx
            );
            if (totalFlash > 0.04) {
              const distToBolt = Math.abs(sc.x - lightningEpicenterX) / width;
              const localGlow = Math.max(0.15, 1 - distToBolt * 1.3) * totalFlash;
              cloudGrad.addColorStop(
                0,
                `rgba(199, 210, 254, ${Math.min(0.55, sc.baseAlpha + localGlow * 0.45)})`
              );
              cloudGrad.addColorStop(
                0.45,
                `rgba(71, 85, 105, ${Math.min(0.45, sc.baseAlpha * 0.8 + localGlow * 0.25)})`
              );
              cloudGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
            } else {
              cloudGrad.addColorStop(0, `rgba(15, 23, 42, ${sc.baseAlpha})`);
              cloudGrad.addColorStop(0.55, `rgba(30, 41, 59, ${sc.baseAlpha * 0.6})`);
              cloudGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
            }

            ctx.fillStyle = cloudGrad;
            ctx.beginPath();
            ctx.ellipse(sc.x, sc.y, sc.rx, sc.ry, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 0b. Draw Distant Downpour Rain Curtain Shafts (Tirai Hujan)
        for (const shaft of downpourShafts) {
          shaft.phase += 0.012;
          shaft.x += shaft.speed + effectiveWindDrift * 0.12;
          if (shaft.x < -shaft.width - 200) shaft.x = width + shaft.width + 100;
          else if (shaft.x > width + shaft.width + 200) shaft.x = -shaft.width - 100;

          const curAlpha = shaft.alpha * (0.75 + 0.25 * Math.sin(shaft.phase));
          const skewX = effectiveWindDrift * 26;
          const shaftGrad = ctx.createLinearGradient(
            shaft.x,
            0,
            shaft.x + shaft.width,
            0
          );
          shaftGrad.addColorStop(0, 'rgba(186, 230, 253, 0)');
          shaftGrad.addColorStop(0.5, `rgba(186, 230, 253, ${curAlpha})`);
          shaftGrad.addColorStop(1, 'rgba(186, 230, 253, 0)');

          ctx.fillStyle = shaftGrad;
          ctx.beginPath();
          ctx.moveTo(shaft.x, 0);
          ctx.lineTo(shaft.x + shaft.width, 0);
          ctx.lineTo(shaft.x + shaft.width + skewX, height);
          ctx.lineTo(shaft.x + skewX, height);
          ctx.closePath();
          ctx.fill();
        }

        // 1. Draw Lower Volumetric Rain Mist & Wet Ground Reflection Zone
        mistPhase += isHeavyStormRain ? 0.015 : 0.008;
        const mistGrad = ctx.createLinearGradient(0, height * 0.68, 0, height);
        mistGrad.addColorStop(0, 'rgba(15, 23, 42, 0)');
        mistGrad.addColorStop(
          0.55,
          `rgba(30, 41, 59, ${isHeavyStormRain ? 0.2 : 0.12})`
        );
        mistGrad.addColorStop(
          1,
          `rgba(15, 23, 42, ${isHeavyStormRain ? 0.46 : 0.34})`
        );
        ctx.fillStyle = mistGrad;
        ctx.fillRect(0, height * 0.68, width, height * 0.32);

        // 1b. Spawn & Render Wind-Driven Squall Mist Streaks during Storm Rain
        if (isHeavyStormRain) {
          if (windStreaks.length < (isMobile ? 5 : 10) && Math.random() < 0.09) {
            const startLeft = effectiveWindDrift > 0;
            windStreaks.push({
              x: startLeft ? -220 : width + 220,
              y: height * (0.12 + Math.random() * 0.72),
              length: 140 + Math.random() * 200,
              speed: (effectiveWindDrift >= 0 ? 1 : -1) * (14 + Math.random() * 10),
              alpha: 0,
              maxAlpha: 0.09 + Math.random() * 0.09,
              life: 0,
              maxLife: 55 + Math.floor(Math.random() * 35),
              curve: (Math.random() - 0.5) * 18,
            });
          }

          for (let i = windStreaks.length - 1; i >= 0; i--) {
            const ws = windStreaks[i];
            ws.x += ws.speed;
            ws.y += Math.abs(ws.speed) * 0.18;
            ws.life++;

            const progress = ws.life / ws.maxLife;
            ws.alpha =
              progress < 0.25
                ? (progress / 0.25) * ws.maxAlpha
                : (1 - (progress - 0.25) / 0.75) * ws.maxAlpha;

            if (ws.life >= ws.maxLife) {
              windStreaks.splice(i, 1);
              continue;
            }

            const endX = ws.x + (ws.speed >= 0 ? ws.length : -ws.length);
            const endY = ws.y + ws.length * 0.16;
            const wsGrad = ctx.createLinearGradient(ws.x, ws.y, endX, endY);
            wsGrad.addColorStop(0, 'rgba(186, 230, 253, 0)');
            wsGrad.addColorStop(0.5, `rgba(224, 242, 254, ${ws.alpha})`);
            wsGrad.addColorStop(1, 'rgba(186, 230, 253, 0)');

            ctx.strokeStyle = wsGrad;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(ws.x, ws.y);
            ctx.quadraticCurveTo(
              (ws.x + endX) * 0.5,
              (ws.y + endY) * 0.5 + ws.curve,
              endX,
              endY
            );
            ctx.stroke();
          }
        }

        // 2. Render & Update Multi-Layer Optical Raindrops
        const flashBoost = Math.max(lightningFlash, sheetFlash) * 0.38;

        for (const drop of raindrops) {
          drop.x += effectiveWindDrift + drop.forceX;
          drop.y += drop.speed + drop.forceY;
          drop.forceX *= 0.92;
          drop.forceY *= 0.92;

          // Interactive cursor breeze deflection (fast bounding-box pre-check)
          if (mouse.active) {
            const dx = drop.x - mouse.x;
            const dy = drop.y - mouse.y;
            if (Math.abs(dx) < 110 && Math.abs(dy) < 110) {
              const dist = Math.hypot(dx, dy);
              if (dist < 110 && dist > 1) {
                const force = (1 - dist / 110) * 6;
                drop.forceX += (dx / dist) * force;
              }
            }
          }

          // Perspective scale
          const scale = focalLength / (focalLength + drop.z);
          const screenX = drop.x - camParallaxX * (drop.z / 320);
          const screenY = drop.y;
          const streakLen = drop.length * scale;
          const streakAngleX = effectiveWindDrift * 2.1 * scale;
          const endX = screenX + streakAngleX;
          const endY = screenY + streakLen;

          // Check for perspective ground impact splash
          if (endY >= drop.impactY) {
            if (
              drop.layer > 0 &&
              splashes.length < (isMobile ? 90 : 180) &&
              Math.random() < (isHeavyStormRain ? 0.78 : 0.62)
            ) {
              const splashCount = drop.layer === 2 ? (isHeavyStormRain ? 4 : 3) : 2;
              for (let s = 0; s < splashCount; s++) {
                const angleSpread = (s - (splashCount - 1) / 2) * 1.4 + (Math.random() - 0.5) * 1.2;
                splashes.push({
                  x: endX,
                  y: drop.impactY,
                  vx: angleSpread + effectiveWindDrift * 0.16,
                  vy: -(1.8 + Math.random() * (drop.layer === 2 ? 3.4 : 2.2)),
                  size: (drop.layer === 2 ? 1.15 : 0.85) + Math.random() * 0.9,
                  alpha: (drop.layer === 2 ? 0.78 : 0.55) + flashBoost * 0.3,
                  decay: 0.045 + Math.random() * 0.025,
                  isStreak: drop.layer === 2 || Math.random() < 0.5,
                });
              }

              // Perspective Ground Puddle Ripple
              if (
                ripples.length < (isMobile ? 32 : 65) &&
                Math.random() < (drop.layer === 2 ? 0.65 : 0.35)
              ) {
                ripples.push({
                  x: endX,
                  y: drop.impactY,
                  r: 1.5,
                  maxR: (drop.layer === 2 ? 14 : 9) + Math.random() * 12,
                  alpha: (drop.layer === 2 ? 0.55 : 0.38) + flashBoost * 0.25,
                  decay: 0.016 + Math.random() * 0.008,
                  hasEcho: drop.layer === 2,
                });
              }
            }

            // Reset drop to top
            drop.y = -drop.length - Math.random() * 60;
            drop.x = Math.random() * (width + 450) - 225;
            continue;
          }

          // Screen horizontal wrap
          if (drop.x < -250) drop.x = width + 160;
          else if (drop.x > width + 250) drop.x = -160;

          const baseAlpha = Math.min(1, drop.opacity + flashBoost);
          ctx.lineWidth = Math.max(0.65, drop.width * scale);

          if (drop.layer === 2) {
            // Foreground crystal drops: Full optical gradient + leading water-bead tip
            const dropGrad = ctx.createLinearGradient(screenX, screenY, endX, endY);
            dropGrad.addColorStop(0, 'rgba(186, 230, 253, 0)');
            dropGrad.addColorStop(0.55, `rgba(186, 230, 253, ${baseAlpha * 0.52})`);
            dropGrad.addColorStop(0.88, `rgba(224, 242, 254, ${baseAlpha * 0.88})`);
            dropGrad.addColorStop(1, `rgba(255, 255, 255, ${Math.min(1, baseAlpha * 1.1)})`);

            ctx.strokeStyle = dropGrad;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, baseAlpha * 0.92)})`;
            ctx.beginPath();
            ctx.arc(endX, endY, Math.max(0.9, drop.width * scale * 0.62), 0, Math.PI * 2);
            ctx.fill();
          } else if (drop.layer === 1) {
            // Zero-GC 2-segment optical streak for midground rain
            const midX = (screenX + endX) * 0.5;
            const midY = (screenY + endY) * 0.5;
            ctx.strokeStyle = `rgba(186, 230, 253, ${baseAlpha * 0.34})`;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(midX, midY);
            ctx.stroke();

            ctx.strokeStyle = `rgba(241, 245, 249, ${baseAlpha * 0.78})`;
            ctx.beginPath();
            ctx.moveTo(midX, midY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
          } else {
            // Zero-GC background rain veil
            ctx.strokeStyle = `rgba(203, 213, 225, ${baseAlpha * 0.42})`;
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
          }
        }

        // 3. Render Expanding Perspective Puddle Ripples (with concentric inner echo ring)
        for (let i = ripples.length - 1; i >= 0; i--) {
          const rp = ripples[i];
          rp.r += (rp.maxR - rp.r) * 0.11;
          rp.alpha -= rp.decay;

          if (rp.alpha <= 0 || rp.r >= rp.maxR - 0.4) {
            ripples.splice(i, 1);
            continue;
          }

          ctx.strokeStyle = `rgba(186, 230, 253, ${rp.alpha * 0.65})`;
          ctx.lineWidth = 1.05;
          ctx.beginPath();
          ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.28, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Secondary concentric inner ripple ring
          if (rp.hasEcho && rp.r > 4) {
            ctx.strokeStyle = `rgba(224, 242, 254, ${rp.alpha * 0.38})`;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.ellipse(rp.x, rp.y, rp.r * 0.55, rp.r * 0.55 * 0.28, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // 4. Render Crown V-Splashes & Micro Water Beads
        for (let i = splashes.length - 1; i >= 0; i--) {
          const sp = splashes[i];
          const prevX = sp.x;
          const prevY = sp.y;
          sp.x += sp.vx;
          sp.y += sp.vy;
          sp.vy += 0.28; // gravity
          sp.alpha -= sp.decay;

          if (sp.alpha <= 0) {
            splashes.splice(i, 1);
            continue;
          }

          if (sp.isStreak) {
            ctx.strokeStyle = `rgba(224, 242, 254, ${sp.alpha})`;
            ctx.lineWidth = sp.size * 0.85;
            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(sp.x, sp.y);
            ctx.stroke();
          } else {
            ctx.fillStyle = `rgba(224, 242, 254, ${sp.alpha})`;
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.size * 0.75, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 5. Render Optical Teardrop Beads on Window Glass (Stop-and-go surface tension physics)
        for (const gd of glassDroplets) {
          if (gd.isSliding) {
            gd.wobble += 0.045;
            // Surface tension stop-and-go surge
            const surfaceSurge = Math.max(0.15, Math.sin(gd.wobble * 0.7) + 0.45);
            gd.y += gd.slideSpeed * surfaceSurge;
            gd.x += Math.sin(gd.wobble * 1.3) * 0.22 + effectiveWindDrift * 0.025;

            if (Math.random() < 0.22) {
              gd.trail.push({
                x: gd.x,
                y: gd.y - gd.radius * 0.9,
                alpha: 0.26,
                r: gd.radius * (0.28 + Math.random() * 0.2),
              });
              if (gd.trail.length > 9) gd.trail.shift();
            }

            if (gd.y > height + 24) {
              gd.y = -12;
              gd.x = Math.random() * width;
              gd.trail = [];
            }
          }

          // Render moisture trail beads
          for (const tp of gd.trail) {
            tp.alpha *= 0.965;
            ctx.fillStyle = `rgba(186, 230, 253, ${tp.alpha})`;
            ctx.beginPath();
            ctx.arc(tp.x, tp.y, tp.r, 0, Math.PI * 2);
            ctx.fill();
          }

          // Soft refractive shadow under bottom belly of droplet
          ctx.fillStyle = `rgba(15, 23, 42, ${gd.alpha * 0.42})`;
          ctx.beginPath();
          ctx.ellipse(
            gd.x + 0.5,
            gd.y + gd.radius * 0.45,
            gd.radius * 0.95,
            gd.radius * 0.85,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();

          // Teardrop Glass Body (elongated vertically when sliding)
          const stretchY = gd.isSliding ? 1.25 : 1.05;
          const bodyGrad = ctx.createRadialGradient(
            gd.x - gd.radius * 0.25,
            gd.y - gd.radius * 0.25,
            gd.radius * 0.1,
            gd.x,
            gd.y,
            gd.radius * stretchY
          );
          bodyGrad.addColorStop(0, `rgba(255, 255, 255, ${gd.alpha * 0.55})`);
          bodyGrad.addColorStop(0.55, `rgba(186, 230, 253, ${gd.alpha * 0.28})`);
          bodyGrad.addColorStop(1, `rgba(125, 211, 252, ${gd.alpha * 0.08})`);

          ctx.fillStyle = bodyGrad;
          ctx.beginPath();
          ctx.ellipse(gd.x, gd.y, gd.radius * 0.9, gd.radius * stretchY, 0, 0, Math.PI * 2);
          ctx.fill();

          // Crisp Specular Highlight Glint (upper-left)
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.95, gd.alpha * 0.95)})`;
          ctx.beginPath();
          ctx.arc(
            gd.x - gd.radius * 0.3,
            gd.y - gd.radius * 0.32,
            gd.radius * 0.32,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        // 6. Thunderstorm & Storm Squall Lightning Engine (Branched Bolts + Sheet Lightning + Restrike)
        if (isThunderstorm || isHeavyStormRain) {
          lightningTimer++;

          if (restrikeCountdown > 0) {
            restrikeCountdown--;
            if (restrikeCountdown === 0) {
              lightningFlash = 0.85;
            }
          }

          const minCooldown = isThunderstorm ? 130 : 240;
          const strikeChance = isThunderstorm ? 0.028 : 0.012;

          if (lightningTimer > minCooldown && Math.random() < strikeChance) {
            lightningTimer = 0;
            lightningEpicenterX = width * (0.15 + Math.random() * 0.7);
            lightningEpicenterY = height * (0.04 + Math.random() * 0.14);

            const doGroundBolt = isThunderstorm ? Math.random() < 0.72 : Math.random() < 0.3;

            if (doGroundBolt) {
              lightningFlash = 0.92;
              sheetFlash = 0.65;
              restrikeCountdown = 5 + Math.floor(Math.random() * 5);
              const endX =
                lightningEpicenterX + (Math.random() - 0.5) * 240 + effectiveWindDrift * 12;
              const endY = height * (0.62 + Math.random() * 0.26);
              lightningBranches = generateBranchedLightning(
                lightningEpicenterX,
                0,
                endX,
                endY
              );
            } else {
              sheetFlash = isThunderstorm ? 0.72 : 0.5;
              lightningBranches = [];
            }
          }

          // Render Upper-Sky Sheet Lightning Radial Illumination
          if (sheetFlash > 0.015) {
            const sheetGrad = ctx.createRadialGradient(
              lightningEpicenterX,
              lightningEpicenterY,
              10,
              lightningEpicenterX,
              lightningEpicenterY,
              Math.max(width, height) * 0.75
            );
            sheetGrad.addColorStop(0, `rgba(224, 231, 255, ${sheetFlash * 0.42})`);
            sheetGrad.addColorStop(0.35, `rgba(147, 197, 253, ${sheetFlash * 0.22})`);
            sheetGrad.addColorStop(0.7, `rgba(99, 102, 241, ${sheetFlash * 0.08})`);
            sheetGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');

            ctx.fillStyle = sheetGrad;
            ctx.fillRect(0, 0, width, height);
            sheetFlash *= 0.89;
          }

          // Render Branched Lightning Bolts & Full-Screen Atmospheric Flash
          if (lightningFlash > 0.01) {
            ctx.fillStyle = `rgba(224, 242, 254, ${lightningFlash * 0.22})`;
            ctx.fillRect(0, 0, width, height);

            if (lightningBranches.length > 0) {
              ctx.save();
              ctx.lineJoin = 'round';
              ctx.lineCap = 'round';

              for (const branch of lightningBranches) {
                if (branch.points.length < 2) continue;

                ctx.strokeStyle = `rgba(147, 197, 253, ${lightningFlash * branch.alphaScale * 0.45})`;
                ctx.lineWidth = branch.width * 3.8;
                ctx.beginPath();
                ctx.moveTo(branch.points[0].x, branch.points[0].y);
                for (let idx = 1; idx < branch.points.length; idx++) {
                  ctx.lineTo(branch.points[idx].x, branch.points[idx].y);
                }
                ctx.stroke();

                ctx.strokeStyle = `rgba(254, 249, 195, ${Math.min(1, lightningFlash * branch.alphaScale * 1.15)})`;
                ctx.lineWidth = branch.width;
                ctx.shadowColor = 'rgba(56, 189, 248, 0.95)';
                ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.moveTo(branch.points[0].x, branch.points[0].y);
                for (let idx = 1; idx < branch.points.length; idx++) {
                  ctx.lineTo(branch.points[idx].x, branch.points[idx].y);
                }
                ctx.stroke();
              }
              ctx.restore();
            }

            lightningFlash *= 0.84;
          }
        }
      } else if (isSnowTheme) {
        // ==========================================
        // B. RENDER PHOTOREALISTIC SNOW, BLIZZARD SQUALLS, 6-ARM CRYSTALS & SLEET
        // ==========================================
        squallPhase += isBlizzard ? 0.022 : 0.008;
        const snowWindGust = isBlizzard
          ? -6.5 + Math.sin(squallPhase) * 2.8 + Math.cos(squallPhase * 2.3) * 1.4
          : Math.sin(squallPhase) * 0.45 - (windSpeed || 2.5) * 0.18;

        // 1. Upper Rolling Arctic Snow Clouds
        for (const sc of snowClouds) {
          sc.x += sc.speed + snowWindGust * 0.08;
          if (sc.x < -sc.rx - 150) sc.x = width + sc.rx + 100;
          else if (sc.x > width + sc.rx + 150) sc.x = -sc.rx - 100;

          const cloudGrad = ctx.createRadialGradient(
            sc.x,
            sc.y,
            sc.ry * 0.15,
            sc.x,
            sc.y,
            sc.rx
          );
          cloudGrad.addColorStop(0, `rgba(226, 232, 240, ${sc.baseAlpha})`);
          cloudGrad.addColorStop(0.55, `rgba(148, 163, 184, ${sc.baseAlpha * 0.65})`);
          cloudGrad.addColorStop(1, 'rgba(30, 41, 59, 0)');

          ctx.fillStyle = cloudGrad;
          ctx.beginPath();
          ctx.ellipse(sc.x, sc.y, sc.rx, sc.ry, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // 2. Lower Frost Mist & Blizzard Whiteout Vignette
        const frostGrad = ctx.createLinearGradient(0, height * 0.72, 0, height);
        frostGrad.addColorStop(0, 'rgba(224, 242, 254, 0)');
        frostGrad.addColorStop(
          0.6,
          `rgba(186, 230, 253, ${isBlizzard ? 0.14 : 0.06})`
        );
        frostGrad.addColorStop(
          1,
          `rgba(224, 242, 254, ${isBlizzard ? 0.28 : 0.14})`
        );
        ctx.fillStyle = frostGrad;
        ctx.fillRect(0, height * 0.72, width, height * 0.28);

        // 3. Blizzard Sweeping Whiteout Wind Squall Ribbons
        if (isBlizzard) {
          if (blizzardStreaks.length < (isMobile ? 6 : 12) && Math.random() < 0.14) {
            blizzardStreaks.push({
              x: width + 240,
              y: height * (0.08 + Math.random() * 0.84),
              length: 180 + Math.random() * 240,
              speed: -(16 + Math.random() * 12),
              alpha: 0,
              maxAlpha: 0.14 + Math.random() * 0.12,
              life: 0,
              maxLife: 50 + Math.floor(Math.random() * 35),
              curve: (Math.random() - 0.5) * 26,
            });
          }

          for (let i = blizzardStreaks.length - 1; i >= 0; i--) {
            const bs = blizzardStreaks[i];
            bs.x += bs.speed;
            bs.y += Math.abs(bs.speed) * 0.14;
            bs.life++;

            const progress = bs.life / bs.maxLife;
            bs.alpha =
              progress < 0.25
                ? (progress / 0.25) * bs.maxAlpha
                : (1 - (progress - 0.25) / 0.75) * bs.maxAlpha;

            if (bs.life >= bs.maxLife) {
              blizzardStreaks.splice(i, 1);
              continue;
            }

            const endX = bs.x - bs.length;
            const endY = bs.y + bs.length * 0.15;
            const bsGrad = ctx.createLinearGradient(bs.x, bs.y, endX, endY);
            bsGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            bsGrad.addColorStop(0.5, `rgba(240, 249, 255, ${bs.alpha})`);
            bsGrad.addColorStop(1, 'rgba(186, 230, 253, 0)');

            ctx.strokeStyle = bsGrad;
            ctx.lineWidth = 2.4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(bs.x, bs.y);
            ctx.quadraticCurveTo(
              (bs.x + endX) * 0.5,
              (bs.y + endY) * 0.5 + bs.curve,
              endX,
              endY
            );
            ctx.stroke();
          }
        }

        // 4. Sleet & Freezing Rain Ice Pellets + Ground Bounce Sparks
        if (sleetPellets.length > 0) {
          ctx.lineCap = 'round';
          for (const sp of sleetPellets) {
            sp.x += sp.vx + snowWindGust * 0.35;
            sp.y += sp.vy;

            const tailX = sp.x - (sp.vx + snowWindGust * 0.35) * 1.4;
            const tailY = sp.y - sp.length;

            const pGrad = ctx.createLinearGradient(tailX, tailY, sp.x, sp.y);
            pGrad.addColorStop(0, 'rgba(186, 230, 253, 0)');
            pGrad.addColorStop(0.65, `rgba(186, 230, 253, ${sp.alpha * 0.65})`);
            pGrad.addColorStop(1, `rgba(255, 255, 255, ${sp.alpha})`);

            ctx.strokeStyle = pGrad;
            ctx.lineWidth = sp.size;
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(sp.x, sp.y);
            ctx.stroke();

            // Leading icy diamond pellet tip
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, sp.alpha * 1.15)})`;
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.size * 0.85, 0, Math.PI * 2);
            ctx.fill();

            if (sp.y >= sp.impactY) {
              if (iceSparks.length < 45 && Math.random() < 0.55) {
                for (let b = 0; b < 2; b++) {
                  iceSparks.push({
                    x: sp.x,
                    y: sp.impactY,
                    vx: (Math.random() - 0.5) * 3.2,
                    vy: -1.6 - Math.random() * 2.4,
                    size: 1.1 + Math.random() * 0.9,
                    alpha: 0.75,
                  });
                }
              }
              sp.y = -20 - Math.random() * 60;
              sp.x = Math.random() * (width + 400) - 100;
            }
          }

          for (let i = iceSparks.length - 1; i >= 0; i--) {
            const isk = iceSparks[i];
            isk.x += isk.vx;
            isk.y += isk.vy;
            isk.vy += 0.22;
            isk.alpha -= 0.045;
            if (isk.alpha <= 0) {
              iceSparks.splice(i, 1);
              continue;
            }
            ctx.fillStyle = `rgba(224, 242, 254, ${isk.alpha})`;
            ctx.beginPath();
            ctx.arc(isk.x, isk.y, isk.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // 5. Render 3-Layer Snowflakes & 6-Pointed Dendrite Ice Crystals
        for (const sf of snowflakes) {
          sf.swayPhase += sf.swaySpeed;
          sf.angle += sf.spinSpeed;

          const depthFactor = sf.layer === 2 ? 1.15 : sf.layer === 1 ? 0.85 : 0.55;
          sf.x +=
            sf.vx +
            snowWindGust * depthFactor +
            Math.sin(sf.swayPhase) * sf.swayAmp +
            sf.forceX;
          sf.y += sf.vy + sf.forceY;

          sf.forceX *= 0.92;
          sf.forceY *= 0.92;

          const parallaxScale = sf.layer === 2 ? 0.25 : sf.layer === 1 ? 0.14 : 0.06;
          const screenX = sf.x - camParallaxX * parallaxScale;
          const screenY = sf.y - camParallaxY * parallaxScale * 0.4;

          if (mouse.active) {
            const dx = screenX - mouse.x;
            const dy = screenY - mouse.y;
            if (Math.abs(dx) < 125 && Math.abs(dy) < 125) {
              const dist = Math.hypot(dx, dy);
              if (dist < 125 && dist > 1) {
                const force = (1 - dist / 125) * 1.4;
                sf.forceX += (dx / dist) * force;
                sf.forceY += (dy / dist) * force;
              }
            }
          }

          // Wrap around screen boundaries
          if (sf.y > height + 30) {
            sf.y = -25;
            sf.x = Math.random() * (width + 400) - 100;
          }
          if (sf.x < -220) sf.x = width + 180;
          else if (sf.x > width + 220) sf.x = -180;

          ctx.save();
          ctx.globalAlpha = sf.alpha;
          if (sf.layer === 2) {
            // Hardware-accelerated pre-rendered 6-pointed dendrite crystal sprite
            ctx.translate(screenX, screenY);
            ctx.rotate(sf.angle);
            const size = sf.radius * 2.3;
            ctx.drawImage(dendriteSprite, -size * 0.5, -size * 0.5, size, size);
          } else {
            // Hardware-accelerated pre-rendered soft snow puff sprite
            const size = sf.radius * 3.4;
            ctx.drawImage(
              snowPuffSprite,
              screenX - size * 0.5,
              screenY - size * 0.5,
              size,
              size
            );
          }
          ctx.restore();
        }
      } else {
        // ==========================================
        // C. RENDER MIST / FOG BANKS, NIGHT STARS & DAYTIME LIGHT MOTES
        // ==========================================
        if (isMistTheme && fogBanks.length > 0) {
          for (const fb of fogBanks) {
            fb.phase += 0.008;
            fb.x += fb.speed;
            if (fb.x < -fb.rx - 150) fb.x = width + fb.rx + 100;
            else if (fb.x > width + fb.rx + 150) fb.x = -fb.rx - 100;

            const curAlpha = fb.alpha * (0.8 + 0.2 * Math.sin(fb.phase));
            const fogGrad = ctx.createRadialGradient(
              fb.x,
              fb.y,
              fb.ry * 0.1,
              fb.x,
              fb.y,
              fb.rx
            );
            fogGrad.addColorStop(0, `rgba(226, 232, 240, ${curAlpha})`);
            fogGrad.addColorStop(0.55, `rgba(148, 163, 184, ${curAlpha * 0.55})`);
            fogGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');

            ctx.fillStyle = fogGrad;
            ctx.beginPath();
            ctx.ellipse(fb.x, fb.y, fb.rx, fb.ry, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        for (const p of otherParticles) {
          p.x += p.vx + p.forceX;
          p.y += p.vy + p.forceY;
          if (p.alphaSpeed && p.alpha !== undefined) {
            p.alpha += p.alphaSpeed;
            if (p.alpha > 0.95 || p.alpha < 0.15) p.alphaSpeed *= -1;
          }

          p.forceX *= 0.92;
          p.forceY *= 0.92;

          const scale = focalLength / (focalLength + p.z);
          const screenX = cx + (p.x - camParallaxX) * scale;
          const screenY =
            theme === 'malam' || theme === 'clear-night' || theme === 'clouds-night'
              ? cy + (p.y - camParallaxY) * scale
              : p.y;

          if (mouse.active) {
            const dx = screenX - mouse.x;
            const dy = screenY - mouse.y;
            if (Math.abs(dx) < 130 && Math.abs(dy) < 130) {
              const dist = Math.hypot(dx, dy);
              if (dist < 130 && dist > 1) {
                const force = (1 - dist / 130) * 1.4;
                p.forceX += (dx / dist) * force;
                p.forceY += (dy / dist) * force;
              }
            }
          }

          const boundW = width * 0.9;
          if (p.x > boundW) p.x = -boundW;
          if (p.x < -boundW) p.x = boundW;
          if (p.y > height + 30) p.y = -20;
          if (p.y < -30) p.y = height + 20;

          const r = Math.max(0.5, (p.radius || 2) * scale);
          const alpha = (p.alpha || 0.5) * Math.min(1, scale * 1.3);

          if (isMistTheme) {
            ctx.save();
            ctx.globalAlpha = alpha * 0.65;
            const size = r * 7;
            ctx.drawImage(snowPuffSprite, screenX - size * 0.5, screenY - size * 0.5, size, size);
            ctx.restore();
          } else if (theme === 'malam' || theme === 'clear-night' || theme === 'clouds-night') {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(screenX, screenY, r, 0, Math.PI * 2);
            ctx.fill();
          } else {
            const grad = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, r * 3);
            const color =
              theme === 'sore'
                ? `rgba(253, 186, 116, ${alpha * 0.7})`
                : `rgba(254, 249, 195, ${alpha * 0.65})`;
            grad.addColorStop(0, color);
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(screenX, screenY, r * 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      if (!prefersReducedMotion && isRunning) {
        animationId = requestAnimationFrame(render);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(animationId);
      } else {
        if (!isRunning && !prefersReducedMotion) {
          isRunning = true;
          animationId = requestAnimationFrame(render);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    render();

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('deviceorientation', handleOrientation);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [theme, isNight, weatherId, windSpeed]);

  return <canvas ref={canvasRef} id="weather-canvas" className="weather-canvas" />;
};
