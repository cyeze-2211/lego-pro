import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Sahifalangan so‘rovni «pastga aylantirganda avtomatik yuklash» rejimiga o‘tkazadi.
 *
 * Komponentda `page` holati va joriy sahifa natijasi (`items`, `pagination`) bo‘lishi kerak.
 * Hook sahifalarni to‘plab boradi; filtr o‘zgarganda `page` 0 ga tushadi va ro‘yxat yangidan boshlanadi.
 *
 * @returns { items, hasMore, sentinelRef, loadingMore }
 */
export function useInfiniteList({ items, pagination, page, setPage, isFetching, resetKey, getId = (x) => x?.id }) {
    const [accumulated, setAccumulated] = useState([]);
    const sentinelRef = useRef(null);
    const lastResetKey = useRef(resetKey);
    const lastPageRef = useRef(-1);
    const seenPagesRef = useRef(new WeakMap()); // massiv → qaysi sahifaniki

    // Filtr/saralash o‘zgardi — boshidan boshlaymiz
    useEffect(() => {
        if (lastResetKey.current !== resetKey) {
            lastResetKey.current = resetKey;
            lastPageRef.current = -1;
            setAccumulated([]);
            setPage(0);
        }
    }, [resetKey, setPage]);

    // Yangi sahifa keldi — qo‘shamiz (0-sahifa bo‘lsa almashtiramiz).
    // O‘sha sahifa qayta kelsa (yaratish/tahrirlash/o‘chirishdan keyin RTK Query keshni yangiladi) —
    // oldingi sahifalardagi yozuvlar eskirgan bo‘lishi mumkin, shuning uchun ro‘yxat boshidan yuklanadi.
    useEffect(() => {
        if (!items) return;
        // `data` sahifa almashganda bir lahza oldingi sahifa massivini qaytaradi — uni qayta ishlamaymiz
        const pageOfItems = seenPagesRef.current.get(items);
        if (pageOfItems !== undefined && pageOfItems !== page) return;
        seenPagesRef.current.set(items, page);
        if (page > 0 && lastPageRef.current === page && pageOfItems === undefined) {
            lastPageRef.current = -1;
            setAccumulated([]);
            setPage(0);
            return;
        }
        lastPageRef.current = page;
        setAccumulated((prev) => {
            if (page === 0) return items;
            const seen = new Set(prev.map(getId));
            const fresh = items.filter((item) => !seen.has(getId(item)));
            return fresh.length ? [...prev, ...fresh] : prev;
        });
    }, [items, page, getId, setPage]);

    const totalPages = pagination?.totalPages ?? 0;
    const hasMore = totalPages > 0 && page < totalPages - 1;

    const loadMore = useCallback(() => {
        if (!hasMore || isFetching) return;
        setPage((p) => p + 1);
    }, [hasMore, isFetching, setPage]);

    // Pastdagi belgi ko‘ringanda keyingi sahifa
    useEffect(() => {
        const node = sentinelRef.current;
        if (!node || !hasMore) return undefined;
        const observer = new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) loadMore();
        }, { rootMargin: '320px 0px' });
        observer.observe(node);
        return () => observer.disconnect();
    }, [hasMore, loadMore, accumulated.length]);

    return { items: accumulated, hasMore, sentinelRef, loadingMore: isFetching && page > 0, loadMore };
}
