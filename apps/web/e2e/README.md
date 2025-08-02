# End-to-End Test Documentation

This directory contains comprehensive end-to-end (E2E) tests for the Soccer Project Unify application. These tests use Playwright to simulate real user interactions and verify the complete functionality of the application.

## Test Structure

The E2E tests are organized into four main suites:

### 1. API Routes (`api.spec.ts`)
Tests the API endpoints and server functionality:
- **Health Check API**: Verifies the health endpoint returns correct status and content type
- **TRPC API**: Tests the tRPC procedures, authentication, and batch requests
- **Database API**: Validates database connectivity and operations
- **Error Handling**: Ensures proper error responses for invalid requests
- **Performance**: Checks response times and handles concurrent requests
- **Security**: Validates security headers and prevents information leakage

### 2. Authentication Flow (`auth.spec.ts`)
Comprehensive testing of user authentication:

#### User Registration
- ✅ Successful registration with valid data
- ✅ Error handling for duplicate email addresses
- ✅ Form validation for required fields
- ✅ Email format validation
- ✅ Terms and conditions requirement

#### User Login
- ✅ Successful login with valid credentials
- ✅ Error handling for invalid credentials
- ✅ Form validation for required fields
- ✅ Email format validation
- ✅ Remember me checkbox functionality

#### Invitation-based Registration
- ✅ Registration with valid invitation tokens
- ✅ Error handling for invalid invitation tokens
- ✅ Error handling for expired invitations

#### Sign Out
- ✅ Successful sign out functionality
- ✅ Session cleanup verification

#### Protected Routes
- ✅ Redirect unauthenticated users to login
- ✅ Allow authenticated users to access protected routes

#### Form Loading States
- ✅ Loading indicators during login process
- ✅ Loading indicators during signup process
- ✅ Proper button states and disabling

#### Accessibility
- ✅ Proper form labels and associations
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility

### 3. Dashboard (`dashboard.spec.ts`)
Tests the main dashboard functionality:
- ✅ Dashboard display after successful login
- ✅ User information display
- ✅ Navigation links functionality
- ✅ Sign out functionality from dashboard
- ✅ Club information display (if user has clubs)
- ✅ Responsive design validation

### 4. Complete User Workflows (`user-workflows.spec.ts`)
End-to-end user journey testing:

#### New User Onboarding
- **Complete Signup Flow**: Full registration → email verification → login → onboarding → dashboard
- **Invitation-based Signup**: Invitation link → signup → verification → club membership

#### Session Management
- **Session Persistence**: Maintains login state across browser refresh
- **Session Expiration**: Handles expired sessions gracefully
- **Clean Logout**: Proper session cleanup and redirection

#### Error Recovery
- **Network Errors**: Handles network failures during authentication
- **Browser Navigation**: Supports back/forward navigation during auth flow

#### Mobile User Experience
- **Mobile Compatibility**: Tests on mobile viewport sizes
- **Touch-friendly Elements**: Ensures proper touch target sizes (44px minimum)

#### Accessibility Workflows
- **Keyboard Navigation**: Full app navigation using only keyboard
- **Screen Reader Support**: ARIA labels and semantic markup
- **Focus Management**: Proper focus indicators and order

#### Performance Testing
- **Page Load Speed**: Auth pages load in under 3 seconds
- **Non-blocking UI**: Form submissions don't freeze the interface

## Running the Tests

### Prerequisites
- Node.js installed
- Application server running on the configured port
- Database seeded with test data (for login tests)

### Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode for debugging
npx playwright test --ui

# Run specific test suite
npx playwright test e2e/auth.spec.ts

# Run tests with specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Generate test report
npx playwright show-report
```

### Test Configuration

Tests are configured via `playwright.config.ts`:
- **Base URL**: Configured to match your development server
- **Browsers**: Tests run on Chromium, Firefox, and WebKit
- **Timeouts**: Configured for reasonable test execution
- **Screenshots**: Captured on failure for debugging
- **Videos**: Recorded for failed tests

## Test Data Requirements

### User Accounts
For complete testing, ensure these test accounts exist:

```typescript
// Working login credentials
{
  email: 'test@example.com',
  password: 'password123'
}

// Existing user for duplicate email testing
{
  email: 'existing@example.com'
}
```

### Invitation Tokens
```typescript
// Valid invitation token
'valid-invite-token-123'

// Invalid invitation token (should not exist)
'invalid-token-123'

// Expired invitation token
'expired-token-123'
```

## Human-Readable Test Scenarios

### Scenario 1: New User Complete Journey
1. **Start**: User visits homepage
2. **Navigate**: Clicks "Sign up" to registration page
3. **Register**: Fills out complete registration form
4. **Verify**: Receives email verification (simulated in test)
5. **Login**: Uses credentials to log in
6. **Onboard**: Completes onboarding process if required
7. **Success**: Arrives at functional dashboard

### Scenario 2: Invitation-based Registration
1. **Invite**: User receives invitation link
2. **Access**: Clicks invitation link with token
3. **Context**: Sees invitation-specific messaging
4. **Register**: Completes registration with invitation context
5. **Verify**: Email verification process
6. **Login**: Authentication with new credentials
7. **Club Access**: Automatically joined to inviting club

### Scenario 3: Authentication Error Handling
1. **Invalid Credentials**: Shows clear error messages
2. **Network Issues**: Handles offline/online transitions
3. **Form Validation**: Prevents submission with invalid data
4. **Session Expiry**: Graceful handling of expired sessions

### Scenario 4: Accessibility Journey
1. **Keyboard Only**: Complete navigation using only Tab/Enter/Space
2. **Screen Reader**: All elements properly labeled and announced
3. **Visual Indicators**: Clear focus states and loading indicators
4. **Error Communication**: Errors announced to assistive technology

### Scenario 5: Mobile Experience
1. **Responsive Design**: Forms adapt to mobile screen sizes
2. **Touch Targets**: All clickable elements are touch-friendly
3. **Performance**: Fast loading on mobile connections
4. **Usability**: Easy form completion on mobile devices

## Coverage Information

**E2E tests are excluded from unit test coverage metrics** as they test integration rather than individual code units. Coverage requirements apply only to:
- Unit tests (individual functions/components)
- Integration tests (component interactions)

Current coverage thresholds:
- Functions: 80%
- Lines: 80%
- Branches: 80%
- Statements: 80%

## Debugging Failed Tests

### Screenshots and Videos
Failed tests automatically capture:
- Screenshots at the point of failure
- Video recordings of the test execution
- Browser console logs

### Test Artifacts Location
```
test-results/
├── screenshots/
├── videos/
└── traces/
```

### Common Issues and Solutions

1. **Test Timeout**: Increase timeout in `playwright.config.ts`
2. **Element Not Found**: Check selectors and wait conditions
3. **Authentication Issues**: Verify test user accounts exist
4. **Database State**: Ensure clean test database state
5. **Server Issues**: Confirm development server is running

### Debug Mode
```bash
# Run tests in debug mode with browser visible
npx playwright test --debug

# Run specific test in debug mode
npx playwright test auth.spec.ts:11 --debug
```

## Maintenance

### Regular Updates Needed
- **User Data**: Keep test user accounts active
- **Invitation Tokens**: Refresh expired invitation tokens
- **Selectors**: Update element selectors when UI changes
- **Test Scenarios**: Add tests for new features

### Performance Monitoring
- Monitor test execution times
- Update performance thresholds as needed
- Review flaky tests and improve stability

## Integration with CI/CD

These tests should be integrated into your CI/CD pipeline to:
1. Run automatically on pull requests
2. Block deployments if critical tests fail
3. Generate test reports for review
4. Alert team members of test failures

The comprehensive test suite ensures that all user-facing functionality works correctly across different browsers and devices, providing confidence in your application's reliability.