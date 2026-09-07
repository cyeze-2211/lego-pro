export function formatNumber(value) {
    if (value === null || value === undefined || value === '') return '';

    const [integerPart, decimalPart] = String(value).replace(/\s/g, '').split('.');
    const formattedInteger = Number(integerPart || 0).toLocaleString('ru-RU').replace(/\u00A0/g, ' ');

    return decimalPart === undefined ? formattedInteger : `${formattedInteger}.${decimalPart}`;
}

export function parseNumber(value) {
    return value.replace(/\s/g, '').replace(',', '.');
}
