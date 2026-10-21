import { useEffect, useState } from 'react';

/**
 * Виден ли элемент (IntersectionObserver). Возвращает callback-ref:
 * <div ref={ref} /> — наблюдение начинается, когда элемент появился в DOM.
 */
export function useInView<T extends Element>(rootMargin = '0px') {
  const [node, setNode] = useState<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin });
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, rootMargin]);

  return [setNode, inView] as const;
}
