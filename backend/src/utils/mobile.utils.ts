export const normalizeMobile = (mobile: string): string => {
  return mobile.replace(/\D/g, '').slice(-10);
};

export const isValidMobile = (mobile: string): boolean => {
  const normalized = normalizeMobile(mobile);
  return /^[6-9]\d{9}$/.test(normalized);
};
