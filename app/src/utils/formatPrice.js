import { CURRENCY, CURRENCY_LOCALE } from '../config/constants';

const formatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
  style: 'decimal',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format price as "UGX 450,000/mo"
 */
export function formatPrice(amount, period = 'monthly') {
  const periodLabels = { monthly: '/mo', weekly: '/wk', daily: '/day' };
  const suffix = periodLabels[period] || '';
  return `${CURRENCY} ${formatter.format(amount)}${suffix}`;
}

/**
 * Format price for map pin as "UGX 450K"
 */
export function formatPriceShort(amount) {
  if (amount >= 1000000) {
    const m = amount / 1000000;
    return `${CURRENCY} ${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (amount >= 1000) {
    const k = amount / 1000;
    return `${CURRENCY} ${k % 1 === 0 ? k.toFixed(0) : k.toFixed(0)}K`;
  }
  return `${CURRENCY} ${amount}`;
}
