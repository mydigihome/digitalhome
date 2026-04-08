export const STRIPE_LINKS = {
  founding_monthly: 'https://buy.stripe.com/aFa3cvf0eagu0CM55Eak001',
  founding_annual: 'https://buy.stripe.com/fZueVd4lA60e1GQdCaak000',
  standard_monthly: 'https://buy.stripe.com/00w5kDdWa74i71a55Eak002',
  standard_annual: 'https://buy.stripe.com/9B6aEXdWa60ecludCaak003',
  studio_addon: 'https://buy.stripe.com/7sY7sL9FUagu4T2fKiak004',
  template_single: 'https://buy.stripe.com/6oUfZhdWa88m71a1Tsak005',
  template_bundle: 'https://buy.stripe.com/cNiaEXcS6dsG5X6bu2ak006',
};

export const openStripeLink = (url: string) => {
  window.location.href = url;
};
