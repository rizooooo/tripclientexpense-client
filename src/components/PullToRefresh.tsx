import { ReactNode, useRef, useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  disabled?: boolean;
}

const PullToRefresh = ({ onRefresh, children, disabled = false }: PullToRefreshProps) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullStartY, setPullStartY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const threshold = 80; // Distance needed to trigger refresh
  const maxPullDistance = 120; // Maximum pull distance

  const handleTouchStart = (e: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
    // Only allow pull to refresh when at the top of the page
    if (scrollTop === 0) {
      setPullStartY(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (disabled || isRefreshing || pullStartY === 0) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - pullStartY;

    // Only allow pulling down
    if (distance > 0) {
      // Prevent default scrolling behavior
      e.preventDefault();
      
      // Apply resistance to make it feel natural
      const resistanceFactor = 0.5;
      const calculatedDistance = Math.min(distance * resistanceFactor, maxPullDistance);
      setPullDistance(calculatedDistance);
    }
  };

  const handleTouchEnd = async () => {
    if (disabled || isRefreshing) return;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh failed:", error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        setPullStartY(0);
      }
    } else {
      // Reset if didn't pull enough
      setPullDistance(0);
      setPullStartY(0);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pullStartY, pullDistance, isRefreshing, disabled]);

  const getRefreshOpacity = () => {
    return Math.min(pullDistance / threshold, 1);
  };

  const getRotation = () => {
    if (isRefreshing) return 360;
    return (pullDistance / threshold) * 180;
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Pull to Refresh Indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-50"
        style={{
          height: `${pullDistance}px`,
          opacity: getRefreshOpacity(),
          transition: isRefreshing || pullDistance === 0 ? "all 0.3s ease" : "none",
        }}
      >
        <div className="bg-white rounded-full p-2 shadow-lg">
          <RefreshCw
            size={24}
            className={`text-blue-600 ${isRefreshing ? "animate-spin" : ""}`}
            style={{
              transform: `rotate(${getRotation()}deg)`,
              transition: isRefreshing ? "none" : "transform 0.1s ease",
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isRefreshing || pullDistance === 0 ? "transform 0.3s ease" : "none",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;

