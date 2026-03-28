# Digital Home — Compliance & Data Security Notes

## Supabase Configuration (Developer Action Required)

### Backups
- Enable **Point-in-Time Recovery** in Supabase Dashboard → Settings → Addons
- Enable **daily backups**

### Encryption
- All financial data is encrypted at rest by Supabase (AES-256)
- All connections use TLS 1.3

### Row-Level Security
- RLS is enabled on ALL tables
- Every table uses `auth.uid() = user_id` policies
- No table allows cross-user data access

### Data Retention
- Account deletion cascades through all user data
- Stripe subscriptions are cancelled on account deletion
- Auth user is removed via Supabase admin API

### Third-Party Data Processors
- **Stripe** — Payment processing (PCI DSS compliant)
- **Plaid** — Bank data aggregation (SOC 2 Type II)
- **Google** — Gmail/Calendar OAuth (limited scopes)
- **LinkedIn** — Contact import (OAuth)

### GDPR / CCPA Compliance
- Users can export all data (Settings → Account → Export)
- Users can delete all data (Settings → Account → Delete)
- Privacy Policy accessible at /privacy
- Terms of Service accessible at /terms
