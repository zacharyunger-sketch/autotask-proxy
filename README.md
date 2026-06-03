# Autotask Dashboard - Vercel Deployment

## Environment Variables

Set these in Vercel → Project → Settings → Environment Variables:

### Autotask (required)
- `AT_USERNAME` — API user email (fbtcqqbyajw4q77@neurobuildingsystems.com)
- `AT_SECRET` — API user secret
- `AT_INTEGRATION_CODE` — API integration code
- `AT_INSTANCE` — Zone number (22)

### Email via Microsoft Graph (required for email features)
1. Go to portal.azure.com → Azure Active Directory → App registrations → New registration
2. Name it "Autotask Dashboard", click Register
3. Go to API permissions → Add permission → Microsoft Graph → Application → Mail.Send → Add
4. Click "Grant admin consent"
5. Go to Certificates & secrets → New client secret → copy the value

- `AZURE_TENANT_ID` — from App registration Overview page
- `AZURE_CLIENT_ID` — from App registration Overview page  
- `AZURE_CLIENT_SECRET` — secret value from step 5
- `EMAIL_FROM` — zunger@neurobuildingsystems.com

### AI features (required for AI assistant)
- `ANTHROPIC_API_KEY` — from console.anthropic.com → API Keys

## Deployment
1. Push this repo to GitHub
2. Connect repo to Vercel
3. Add all environment variables
4. Deploy — dashboard will be live at your Vercel URL
