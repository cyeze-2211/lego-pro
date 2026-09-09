export const ROLES = {
    OWNER: 'owner',
    MANAGER: 'manager',
    USER: 'user',
    // Backend UPPERCASE qaytaradi, login da toLowerCase() qilinadi
    PRODUCT_STOREKEEPER: 'product_storekeeper',
    RAW_MATERIAL_STOREKEEPER: 'raw_material_storekeeper',
    STAFF: 'staff',
    ZAYAVKACHI: 'zayavkachi',
    BUXGALTER: 'buxgalter',
    STANOKCHI: 'stanokchi',
};

/** Mahsulot ombori rollari */
export const PRODUCT_WAREHOUSE_ROLES = [
    ROLES.PRODUCT_STOREKEEPER,
];

/** Xom ashyo ombori rollari */
export const RAW_WAREHOUSE_ROLES = [
    ROLES.RAW_MATERIAL_STOREKEEPER,
];

/** Barcha ombor rollari (ikkalasi) */
export const WAREHOUSE_ROLES = [
    ...PRODUCT_WAREHOUSE_ROLES,
    ...RAW_WAREHOUSE_ROLES,
];
