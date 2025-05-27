import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): [React.RefObject<HTMLElement>, boolean] {
  const { threshold = 0, root = null, rootMargin = '0%', freezeOnceVisible = false } = options;
  
  const elementRef = useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // If we should freeze once visible and it has already been visible, don't create observer
    if (freezeOnceVisible && hasBeenVisible) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);
        
        if (isVisible && !hasBeenVisible) {
          setHasBeenVisible(true);
        }
        
        // If freezeOnceVisible is true and element becomes visible, disconnect observer
        if (freezeOnceVisible && isVisible) {
          observer.disconnect();
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, freezeOnceVisible, hasBeenVisible]);

  return [elementRef, freezeOnceVisible ? hasBeenVisible : isIntersecting];
}

export default useIntersectionObserver; 