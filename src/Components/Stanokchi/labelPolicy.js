import { productApi } from '../../store/services/product.api';

/*
 * Stanokchi «+1»: false — bosish = darhol 1 pachka + har pachkaga 2 yorliq (oyna yo‘q).
 * true — bosilganda oyna ochiladi (nechta pachka, nechta yorliq, qaysi printer).
 * Seriyali ishlab chiqarish (ko‘p pachka, mahsulot tanlab) admin panelda: Stanoklar → «Seriyali chiqarish».
 */
export const PRODUCE_WITH_DIALOG = false;

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
