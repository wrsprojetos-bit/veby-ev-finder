import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface InfiniteScrollTriggerProps {
  onLoadMore: () => void;
  isLoading: boolean;
  hasMore: boolean;
}

export const InfiniteScrollTrigger = ({ onLoadMore, isLoading, hasMore }: InfiniteScrollTriggerProps) => {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger || isLoading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      {
        rootMargin: "200px",
        threshold: 0.1,
      }
    );

    observer.observe(trigger);

    return () => {
      observer.disconnect();
    };
  }, [onLoadMore, isLoading, hasMore]);

  if (!hasMore) {
    return (
      <div className="py-8 text-center">
        <p className="text-white/50 text-sm">
          Você já viu todos os anúncios disponíveis 🎉
        </p>
      </div>
    );
  }

  return (
    <div ref={triggerRef} className="py-8 flex justify-center">
      {isLoading && (
        <div className="flex items-center gap-2 text-white/70">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Carregando mais anúncios...</span>
        </div>
      )}
    </div>
  );
};
