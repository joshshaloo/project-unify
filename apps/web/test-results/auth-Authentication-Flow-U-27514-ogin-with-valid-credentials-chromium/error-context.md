# Page snapshot

```yaml
- heading "Sign in to your account" [level=2]
- paragraph:
  - text: Or
  - link "create a new account":
    - /url: /auth/signup
- paragraph: Invalid login credentials
- text: Email address
- textbox "Email address": test@example.com
- text: Password
- textbox "Password": password123
- checkbox "Remember me"
- text: Remember me
- link "Forgot your password?":
  - /url: "#"
- button "Sign in"
- button "Open Tanstack query devtools":
  - img
- alert
```