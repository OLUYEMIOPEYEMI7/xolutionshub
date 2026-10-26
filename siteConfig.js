// Public business details shared by views, routes and emails (single source of truth).
// Bank details come from environment variables so they can be changed without a code
// deploy. They are public payment instructions, not secrets.
module.exports = {
  whatsappIntl: '2348069126742',
  whatsappDisplay: '0806 912 6742',
  email: 'xolutionshub@gmail.com',
  bank: {
    name: process.env.BANK_NAME || '',
    accountName: process.env.BANK_ACCOUNT_NAME || '',
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || ''
  },
  get bankConfigured() {
    return !!(this.bank.name && this.bank.accountName && this.bank.accountNumber);
  }
};
