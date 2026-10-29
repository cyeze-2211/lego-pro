import { productApi } from '../../store/services/product.api';

/*
 * Yorliq (shtrix-kod) faqat tayyor mahsulot (type = FINISHED) uchun chop etiladi.
 * Yarim tayyor (SEMI_FINISHED) — yorliqsiz. Ishlab chiqarish seansida mahsulot turi kelmaydi,
 * shuning uchun bosishda mahsulotni keshdan/serverdan o‘qiymiz (RTK Query keshi qayta ishlatiladi).
 */
export async function shouldPrintLabel(dispatch, productId) {
    if (!productId) return false;
    try {
        const product = await dispatch(productApi.endpoints.getProductById.initiate(productId, { subscribe: false })).unwrap();
        return (product?.type || 'FINISHED') === 'FINISHED';
    } catch {
        // Mahsulot o‘qilmasa — avvalgidek chop etamiz (tayyor mahsulot deb hisoblaymiz)
        return true;
    }
}
