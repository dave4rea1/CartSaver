import { useEffect, useState, useRef } from 'react';

const AnimatedCounter = ({ value, duration = 1000, className = '' }) => {
  const [count, setCount] = useState(0);
  const [previousValue, setPreviousValue] = useState(0);
  const countRef = useRef(null);

  useEffect(() => {
    // Skip animation if value hasn't changed
    if (value === previousValue) return;

    const startValue = previousValue;
    const endValue = value;
    const startTime = Date.now();
    const range = endValue - startValue;

    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.round(startValue + range * easeOutQuart);

      setCount(currentValue);

      if (progress === 1) {
        clearInterval(timer);
        setPreviousValue(endValue);
      }
    }, 16); // ~60fps

    return () => clearInterval(timer);
  }, [value, duration, previousValue]);

  return <span className={className} ref={countRef}>{count}</span>;
};

export default AnimatedCounter;
