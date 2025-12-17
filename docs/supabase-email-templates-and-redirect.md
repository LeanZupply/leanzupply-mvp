# Supabase Email Templates and Redirect Configuration

This document contains the configuration steps needed in the Supabase Dashboard to complete the email signup flow improvements.

## Overview

Two changes are needed:
1. **URL Configuration**: Add the new redirect URL to allowed redirects
2. **Email Templates**: Update email templates with branded Spanish content

---

## Step 1: URL Configuration

### Navigate to:
Supabase Dashboard > Authentication > URL Configuration

**Project URL**: https://supabase.com/dashboard/project/rdvbrtcqplrvvprqmjom/auth/url-configuration

### Actions:

1. **Verify Site URL** matches your production domain

2. **Add to Redirect URLs**:
   - `https://YOUR_PRODUCTION_DOMAIN/auth/login`
   - `http://localhost:8080/auth/login` (for local development)

---

## Step 2: Email Templates

### Navigate to:
Supabase Dashboard > Authentication > Email Templates

**Project URL**: https://supabase.com/dashboard/project/rdvbrtcqplrvvprqmjom/auth/templates

---

### Template 1: Confirm Signup

**Subject Line:**
```
Confirma tu cuenta en LeanZupply
```

**HTML Body:**
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #1a2e1f;
      background-color: #f8fafb;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      padding: 40px;
    }
    .logo {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background-color: #3d6b4c;
      border-radius: 12px;
      margin-bottom: 8px;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: #1a2e1f;
    }
    h1 {
      font-size: 24px;
      font-weight: 600;
      color: #1a2e1f;
      margin: 0 0 16px 0;
      text-align: center;
    }
    p {
      color: #5a6b5e;
      margin: 0 0 16px 0;
    }
    .button {
      display: inline-block;
      background-color: #3d6b4c;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 16px;
      margin: 24px 0;
    }
    .button:hover {
      background-color: #478c52;
    }
    .button-container {
      text-align: center;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e9e6;
    }
    .footer p {
      font-size: 13px;
      color: #8a9a8e;
    }
    .link {
      color: #3d6b4c;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <div class="logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>
        <div class="logo-text">LeanZupply</div>
      </div>

      <h1>Bienvenido a LeanZupply</h1>

      <p>Hola,</p>

      <p>Gracias por registrarte en LeanZupply, la plataforma D2B que conecta fabricantes certificados con empresas de todo el mundo.</p>

      <p>Para completar tu registro y activar tu cuenta, haz clic en el siguiente boton:</p>

      <div class="button-container">
        <a href="{{ .ConfirmationURL }}" class="button">Confirmar mi cuenta</a>
      </div>

      <p>Si el boton no funciona, copia y pega el siguiente enlace en tu navegador:</p>
      <p class="link">{{ .ConfirmationURL }}</p>

      <p>Este enlace expira en 24 horas.</p>

      <div class="footer">
        <p>Si no creaste una cuenta en LeanZupply, puedes ignorar este correo.</p>
        <p>&copy; 2025 LeanZupply - Plataforma D2B</p>
      </div>
    </div>
  </div>
</body>
</html>
```

---

### Template 2: Reset Password

**Subject Line:**
```
Restablece tu contrasena - LeanZupply
```

**HTML Body:**
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #1a2e1f;
      background-color: #f8fafb;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      padding: 40px;
    }
    .logo {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background-color: #3d6b4c;
      border-radius: 12px;
      margin-bottom: 8px;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: #1a2e1f;
    }
    h1 {
      font-size: 24px;
      font-weight: 600;
      color: #1a2e1f;
      margin: 0 0 16px 0;
      text-align: center;
    }
    p {
      color: #5a6b5e;
      margin: 0 0 16px 0;
    }
    .button {
      display: inline-block;
      background-color: #3d6b4c;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 16px;
      margin: 24px 0;
    }
    .button:hover {
      background-color: #478c52;
    }
    .button-container {
      text-align: center;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e9e6;
    }
    .footer p {
      font-size: 13px;
      color: #8a9a8e;
    }
    .link {
      color: #3d6b4c;
      word-break: break-all;
    }
    .warning {
      background-color: #fef3cd;
      border: 1px solid #ffc107;
      border-radius: 8px;
      padding: 12px 16px;
      margin: 16px 0;
    }
    .warning p {
      color: #856404;
      margin: 0;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <div class="logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>
        <div class="logo-text">LeanZupply</div>
      </div>

      <h1>Restablecer contrasena</h1>

      <p>Hola,</p>

      <p>Recibimos una solicitud para restablecer la contrasena de tu cuenta en LeanZupply.</p>

      <p>Haz clic en el siguiente boton para crear una nueva contrasena:</p>

      <div class="button-container">
        <a href="{{ .ConfirmationURL }}" class="button">Restablecer contrasena</a>
      </div>

      <p>Si el boton no funciona, copia y pega el siguiente enlace en tu navegador:</p>
      <p class="link">{{ .ConfirmationURL }}</p>

      <div class="warning">
        <p>Este enlace expira en 1 hora por motivos de seguridad.</p>
      </div>

      <div class="footer">
        <p>Si no solicitaste restablecer tu contrasena, puedes ignorar este correo.</p>
        <p>&copy; 2025 LeanZupply - Plataforma D2B</p>
      </div>
    </div>
  </div>
</body>
</html>
```

---

### Template 3: Magic Link (Optional)

**Subject Line:**
```
Tu enlace de acceso a LeanZupply
```

**HTML Body:**
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #1a2e1f;
      background-color: #f8fafb;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      padding: 40px;
    }
    .logo {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background-color: #3d6b4c;
      border-radius: 12px;
      margin-bottom: 8px;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 700;
      color: #1a2e1f;
    }
    h1 {
      font-size: 24px;
      font-weight: 600;
      color: #1a2e1f;
      margin: 0 0 16px 0;
      text-align: center;
    }
    p {
      color: #5a6b5e;
      margin: 0 0 16px 0;
    }
    .button {
      display: inline-block;
      background-color: #3d6b4c;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 16px;
      margin: 24px 0;
    }
    .button-container {
      text-align: center;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e9e6;
    }
    .footer p {
      font-size: 13px;
      color: #8a9a8e;
    }
    .link {
      color: #3d6b4c;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <div class="logo-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>
        <div class="logo-text">LeanZupply</div>
      </div>

      <h1>Accede a tu cuenta</h1>

      <p>Hola,</p>

      <p>Haz clic en el siguiente boton para acceder a tu cuenta de LeanZupply:</p>

      <div class="button-container">
        <a href="{{ .ConfirmationURL }}" class="button">Acceder a mi cuenta</a>
      </div>

      <p>Si el boton no funciona, copia y pega el siguiente enlace en tu navegador:</p>
      <p class="link">{{ .ConfirmationURL }}</p>

      <p>Este enlace expira en 1 hora y solo puede usarse una vez.</p>

      <div class="footer">
        <p>Si no solicitaste este enlace, puedes ignorar este correo.</p>
        <p>&copy; 2025 LeanZupply - Plataforma D2B</p>
      </div>
    </div>
  </div>
</body>
</html>
```

---

## Brand Colors Reference

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Green | `#3d6b4c` | Buttons, links, logo background |
| Hover Green | `#478c52` | Button hover state |
| Text Dark | `#1a2e1f` | Headings, logo text |
| Text Muted | `#5a6b5e` | Body text |
| Text Light | `#8a9a8e` | Footer text |
| Background | `#f8fafb` | Email background |
| Card | `#ffffff` | Card background |
| Border | `#e5e9e6` | Footer border |
| Warning BG | `#fef3cd` | Warning box background |
| Warning Border | `#ffc107` | Warning box border |
| Warning Text | `#856404` | Warning box text |

---

## Testing Checklist

After configuring the templates:

- [ ] Create a test signup with a real email address
- [ ] Verify the confirmation email arrives with the new branded template
- [ ] Click the confirmation link
- [ ] Verify you are redirected to `/auth/login` (not home page)
- [ ] Test password reset flow (if implemented in the app)
- [ ] Test on mobile email clients to verify responsive design

---

## Notes

- The `{{ .ConfirmationURL }}` variable is Supabase's template syntax - do not modify it
- SVG icons are embedded directly in the templates for reliability
- Templates are responsive and work on mobile email clients
- The Inter font falls back to system fonts if not available
