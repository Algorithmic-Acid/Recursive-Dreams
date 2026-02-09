# Email Configuration for Password Reset

The password reset feature requires SMTP email configuration. Add these environment variables to your backend `.env` file on the Pi.

## Required Environment Variables

```bash
# Email SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="Void Vendor <noreply@voidvendor.com>"

# Frontend URL (for reset links)
FRONTEND_URL=https://www.voidvendor.com
```

## Setup Instructions

### Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Void Vendor"
   - Copy the 16-character password
3. **Add to .env file** on the Pi:
   ```bash
   ssh void@void.local
   sudo nano /home/wes/voidvendor/backend/.env
   ```
4. **Add these lines**:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_gmail@gmail.com
   SMTP_PASS=your_16_char_app_password
   SMTP_FROM="Void Vendor <noreply@voidvendor.com>"
   FRONTEND_URL=https://www.voidvendor.com
   ```
5. **Restart backend**:
   ```bash
   sudo -u wes pm2 restart api
   ```

### Option 2: SendGrid (Recommended for Production)

1. **Sign up** at https://sendgrid.com (free tier: 100 emails/day)
2. **Create API Key** in Settings → API Keys
3. **Configure in .env**:
   ```bash
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your_sendgrid_api_key
   SMTP_FROM="Void Vendor <noreply@voidvendor.com>"
   ```

### Option 3: AWS SES (Best for Scale)

1. **Verify domain** in AWS SES console
2. **Create SMTP credentials**
3. **Configure in .env**:
   ```bash
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=your_aws_smtp_user
   SMTP_PASS=your_aws_smtp_pass
   SMTP_FROM="Void Vendor <noreply@voidvendor.com>"
   ```

## Testing

After configuration, test the password reset:

1. Go to https://www.voidvendor.com/forgot-password
2. Enter your email
3. Check inbox for reset email
4. Click the link to reset password

## Troubleshooting

- **No email received**: Check backend logs with `pm2 logs api`
- **Authentication failed**: Verify SMTP credentials
- **Port blocked**: Try port 465 (SSL) instead of 587 (TLS)
- **Gmail blocks**: Make sure 2FA is enabled and you're using an App Password

## Features Included

✅ Forgot password page (`/forgot-password`)
✅ Reset password page (`/reset-password`)
✅ "Forgot password?" link in login modal
✅ Secure token generation (1-hour expiration)
✅ Email templates with cyberpunk styling
✅ Database table for reset tokens
✅ Backend API routes: `/auth/forgot-password`, `/auth/reset-password`
