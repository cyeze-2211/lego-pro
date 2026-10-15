/*
 * PUT so‘rovlar uchun backend sxemalari (OpenAPI: /v3/api-docs → *UpdateRequest).
 *
 * Nega kerak: backend PUT da barcha majburiy maydonlarni talab qiladi, noma'lum maydonlarni esa
 * qabul qilmasligi mumkin. Formalar har xil joydan (ro‘yxat qatori, tafsilot) ochiladi va ba'zan
 * maydonni tushirib qoldiradi — natijada «null bo‘lishi mumkin emas» xatosi. Shu fayl bitta joyda:
 *   1) majburiy maydon yo‘q/bo‘sh bo‘lsa — so‘rov yuborilmay, foydalanuvchiga aniq xabar chiqadi;
 *   2) sxemada bo‘lmagan maydonlar olib tashlanadi;
 *   3) ixtiyoriy bo‘sh satr ('') → null (backend «tozalash» deb tushunadi).
 *
 * required: { maydon: 'Foydalanuvchiga ko‘rsatiladigan nom' }, optional: [maydonlar].
 */
export const UPDATE_SCHEMAS = {
    BrandUpdateRequest:           { required: { name: 'Brend nomi' }, optional: [] },
    CashboxUpdateRequest:         { required: { name: 'Kassa nomi' }, optional: ['summary'] },
    CustomerAgentUpdateRequest:   { required: { name: 'Agent ismi', phone: 'Telefon' }, optional: ['telegramId'] },
    CustomerUpdateRequest:        { required: { name: 'Mijoz nomi', phone: 'Telefon', regionId: 'Viloyat' }, optional: ['summary', 'address', 'inn', 'agentId', 'telegramChatId'] },
    DeviceUpdateRequest:          { required: { deviceName: 'Qurilma nomi' }, optional: ['deviceSummary'] },
    ExpenseCategoryUpdateRequest: { required: { name: 'Kategoriya nomi' }, optional: [] },
    ExpenseUpdateRequest:         { required: { name: 'Xarajat nomi', amount: 'Summa', currency: 'Valyuta', expenseDate: 'Sana', categoryId: 'Kategoriya' }, optional: ['summary', 'usdRate'] },
    MachineUpdateRequest:         { required: { name: 'Stanok nomi' }, optional: ['summary'] },
    PaymentReminderUpdateRequest: { required: { paymentDate: 'To‘lov sanasi' }, optional: ['note', 'price'] },
    ProductCategoryUpdateRequest: { required: { name: 'Kategoriya nomi' }, optional: ['bonusPrice'] },
    ProductColorUpdateRequest:    { required: { name: 'Rang nomi' }, optional: ['code'] },
    ProductUpdateRequest:         { required: { name: 'Mahsulot nomi', minimumLine: 'Minimal qoldiq', piecesPerPack: 'Qadoqdagi dona', colorId: 'Rang', categoryId: 'Kategoriya' }, optional: ['price', 'article', 'size', 'brandId'] },
    RawMaterialUpdateRequest:     { required: { name: 'Xom ashyo nomi', minimumLine: 'Minimal qoldiq' }, optional: ['summary'] },
    ProductRecipeRequest:         { required: { name: 'Retsept nomi', items: 'Tarkib' }, optional: [] },
    RoleUpdateRequest:            { required: {}, optional: ['roleName', 'description'] },
    SalesOrderUpdateRequest:      { required: { customerId: 'Mijoz', items: 'Mahsulotlar' }, optional: ['summary'] },
    SupplierUpdateRequest:        { required: { name: 'Yetkazib beruvchi nomi', phone: 'Telefon', regionId: 'Viloyat' }, optional: ['summary', 'address', 'inn'] },
    UserUpdateRequest:            { required: { username: 'Login', roleId: 'Rol', deviceId: 'Qurilma' }, optional: [] },
    WarehouseUpdateRequest:       { required: { name: 'Ombor nomi' }, optional: ['summary'] },
};

const isBlank = (value) =>
    value === undefined
    || value === null
    || (typeof value === 'string' && value.trim() === '')
    || (Array.isArray(value) && value.length === 0)
    || (typeof value === 'number' && Number.isNaN(value));

/**
 * So‘rov tanasini sxemaga moslaydi.
 * @returns {{ data: object } | { error: string }}
 */
export function shapeUpdatePayload(schemaName, data) {
    const schema = UPDATE_SCHEMAS[schemaName];
    if (!schema) return { data };
    const source = data && typeof data === 'object' ? data : {};

    const missing = Object.entries(schema.required)
        .filter(([key]) => isBlank(source[key]))
        .map(([, label]) => label);
    if (missing.length) {
        return {
            error: `${missing.join(', ')} — majburiy maydon${missing.length > 1 ? 'lar' : ''} to‘ldirilmagan. `
                + 'Oynani yopib qayta oching va qaytadan saqlang.',
        };
    }

    const shaped = {};
    for (const key of Object.keys(schema.required)) {
        const value = source[key];
        shaped[key] = typeof value === 'string' ? value.trim() : value;
    }
    for (const key of schema.optional) {
        if (!(key in source)) continue;
        const value = source[key];
        if (value === undefined) continue;
        shaped[key] = typeof value === 'string' && value.trim() === '' ? null : (typeof value === 'string' ? value.trim() : value);
    }

    if (import.meta.env?.DEV) {
        const unknown = Object.keys(source).filter((key) => !(key in schema.required) && !schema.optional.includes(key));
        if (unknown.length) console.warn(`[${schemaName}] sxemada yo‘q maydonlar olib tashlandi:`, unknown);
    }
    return { data: shaped };
}
