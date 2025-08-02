# Page snapshot

```yaml
- heading "Create your account" [level=2]
- paragraph:
  - text: Or
  - link "sign in to existing account":
    - /url: /auth/login
- text: Full Name
- textbox "Full Name": Test User
- text: Email Address
- textbox "Email Address": existing@example.com
- text: Password
- textbox "Password": password123
- paragraph: Must be at least 8 characters
- checkbox "I agree to the Terms and Conditions"
- text: I agree to the
- link "Terms and Conditions":
  - /url: "#"
- button "Create Account"
- button "Open Tanstack query devtools":
  - img
- alert
```