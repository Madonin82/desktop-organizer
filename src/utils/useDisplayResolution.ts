import { useState, useEffect, useCallback } from 'react';

export interface DisplayInfo {
  physicalWidth: number;
  physicalHeight: number;
  cssWidth: number;
  cssHeight: number;
  devicePixelRatio: number;
  resolutionName: string;
  is4K: boolean;
  is1440p: boolean;
  is1080p: boolean;
  isHighDPI: boolean;
  isFullscreen: boolean;
}

const STORAGE_KEY_SCALE = 'desktop_organizer_display_scale';
const STORAGE_KEY_AUTO = 'desktop_organizer_auto_scale';

export function useDisplayResolution() {
  const [displayInfo, setDisplayInfo] = useState<DisplayInfo>(() => {
    if (typeof window === 'undefined') {
      return {
        physicalWidth: 1920,
        physicalHeight: 1080,
        cssWidth: 1920,
        cssHeight: 1080,
        devicePixelRatio: 1,
        resolutionName: '1080p FHD',
        is4K: false,
        is1440p: false,
        is1080p: true,
        isHighDPI: false,
        isFullscreen: false,
      };
    }

    const dpr = window.devicePixelRatio || 1;
    const physW = Math.round(window.screen.width * dpr);
    const physH = Math.round(window.screen.height * dpr);
    const is4K = physW >= 3800 || physH >= 2100 || (window.innerWidth >= 3400);
    const is1440p = !is4K && (physW >= 2500 || physH >= 1400);
    const is1080p = !is4K && !is1440p && (physW >= 1900 || physH >= 1050);

    let resName = `${physW} × ${physH}`;
    if (is4K) resName = `4K UHD (${physW}×${physH})`;
    else if (is1440p) resName = `1440p QHD (${physW}×${physH})`;
    else if (is1080p) resName = `1080p FHD (${physW}×${physH})`;

    return {
      physicalWidth: physW,
      physicalHeight: physH,
      cssWidth: window.innerWidth,
      cssHeight: window.innerHeight,
      devicePixelRatio: dpr,
      resolutionName: resName,
      is4K,
      is1440p,
      is1080p,
      isHighDPI: dpr > 1.2 || is4K,
      isFullscreen: Boolean(document.fullscreenElement),
    };
  });

  const [isAuto, setIsAuto] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AUTO);
    return saved !== null ? saved === 'true' : true;
  });

  const getRecommendedScale = useCallback((info: DisplayInfo): number => {
    // If on a 4K display:
    if (info.is4K) {
      // If browser already has high DPR (e.g. Windows scaled at 150-200%),
      // 1.0 or 1.15 is optimal and razor sharp.
      // If DPR is ~1.0 (unscaled raw 4K monitor), UI needs 1.5x - 1.75x scaling.
      if (info.devicePixelRatio < 1.35) {
        return 1.5;
      }
      return 1.0;
    }
    // If on 1440p:
    if (info.is1440p) {
      if (info.devicePixelRatio < 1.25) {
        return 1.2;
      }
      return 1.0;
    }
    // Default 1080p:
    return 1.0;
  }, []);

  const [scale, setScaleState] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_SCALE);
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0.75 && parsed <= 2.5) {
        return parsed;
      }
    }
    // Default to auto scale based on initial detected info
    if (typeof window !== 'undefined') {
      const dpr = window.devicePixelRatio || 1;
      const physW = Math.round(window.screen.width * dpr);
      const is4K = physW >= 3800 || (window.innerWidth >= 3400);
      if (is4K && dpr < 1.35) return 1.5;
    }
    return 1.0;
  });

  // Update display info on window resize or resolution change
  useEffect(() => {
    const updateInfo = () => {
      const dpr = window.devicePixelRatio || 1;
      const physW = Math.round(window.screen.width * dpr);
      const physH = Math.round(window.screen.height * dpr);
      const is4K = physW >= 3800 || physH >= 2100 || (window.innerWidth >= 3400);
      const is1440p = !is4K && (physW >= 2500 || physH >= 1400);
      const is1080p = !is4K && !is1440p && (physW >= 1900 || physH >= 1050);

      let resName = `${physW} × ${physH}`;
      if (is4K) resName = `4K UHD (${physW}×${physH})`;
      else if (is1440p) resName = `1440p QHD (${physW}×${physH})`;
      else if (is1080p) resName = `1080p FHD (${physW}×${physH})`;

      const newInfo: DisplayInfo = {
        physicalWidth: physW,
        physicalHeight: physH,
        cssWidth: window.innerWidth,
        cssHeight: window.innerHeight,
        devicePixelRatio: dpr,
        resolutionName: resName,
        is4K,
        is1440p,
        is1080p,
        isHighDPI: dpr > 1.2 || is4K,
        isFullscreen: Boolean(document.fullscreenElement),
      };

      setDisplayInfo(newInfo);

      if (isAuto) {
        const recommended = getRecommendedScale(newInfo);
        setScaleState(recommended);
      }
    };

    window.addEventListener('resize', updateInfo);
    document.addEventListener('fullscreenchange', updateInfo);

    // Listen to media query resolution changes
    const mediaQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mediaQuery.addEventListener?.('change', updateInfo);

    return () => {
      window.removeEventListener('resize', updateInfo);
      document.removeEventListener('fullscreenchange', updateInfo);
      mediaQuery.removeEventListener?.('change', updateInfo);
    };
  }, [isAuto, getRecommendedScale]);

  const setScale = useCallback((newScale: number) => {
    const clamped = Math.min(2.5, Math.max(0.75, Math.round(newScale * 100) / 100));
    setScaleState(clamped);
    setIsAuto(false);
    localStorage.setItem(STORAGE_KEY_SCALE, clamped.toString());
    localStorage.setItem(STORAGE_KEY_AUTO, 'false');
  }, []);

  const setAuto = useCallback((auto: boolean) => {
    setIsAuto(auto);
    localStorage.setItem(STORAGE_KEY_AUTO, auto.toString());
    if (auto) {
      const rec = getRecommendedScale(displayInfo);
      setScaleState(rec);
      localStorage.setItem(STORAGE_KEY_SCALE, rec.toString());
    }
  }, [displayInfo, getRecommendedScale]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  }, []);

  const increaseScale = useCallback(() => {
    setScale(scale + 0.1);
  }, [scale, setScale]);

  const decreaseScale = useCallback(() => {
    setScale(scale - 0.1);
  }, [scale, setScale]);

  const resetScale = useCallback(() => {
    setAuto(true);
  }, [setAuto]);

  return {
    displayInfo,
    scale,
    isAuto,
    setScale,
    setAuto,
    toggleFullscreen,
    increaseScale,
    decreaseScale,
    resetScale,
  };
}
