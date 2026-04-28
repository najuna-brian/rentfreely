/**
 * Build a WhatsApp deep link
 * @param {string} phone - Phone number in +256 format
 * @param {string} message - Pre-filled message
 * @returns {string} WhatsApp deep link URL
 */
export function buildWhatsAppLink(phone, message = '') {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
}

/**
 * Build inquiry message for a property
 */
export function buildInquiryMessage(propertyTitle, tenantName = '') {
  const name = tenantName ? ` My name is ${tenantName}.` : '';
  return `Hi! I'm interested in "${propertyTitle}" listed on RentFreely.${name} Is it still available? I'd like to schedule a viewing.`;
}
