# QRCode Canvas Pro V1 Testing Guide

## Overview

This guide covers comprehensive testing for QRCode Canvas Pro V1 MVP features to ensure beta-readiness.

## Pre-Testing Setup

1. Ensure Supabase is configured and running
2. Run database migrations: `supabase db reset`
3. Start the development server: `npm run dev`
4. Create a test user account

## Feature Testing Checklist

### 1. Authentication & User Management

- [ ] User registration works
- [ ] User login works
- [ ] User logout works
- [ ] Profile creation/update works
- [ ] Session persistence works

### 2. QR Code Generation (8 Types)

#### Static QR Codes

- [ ] Create static QR with valid URL
- [ ] Generate QR code image
- [ ] Download QR code as PNG
- [ ] Save QR code to dashboard
- [ ] Verify direct URL redirect works

#### Dynamic QR Codes

- [ ] Create dynamic QR with URL
- [ ] Generate redirect URL (/qr/{id})
- [ ] Verify redirect service works
- [ ] Update destination URL
- [ ] Verify updated redirect works

#### Multi-URL QR Codes

- [ ] Create multi-URL QR with 2+ URLs
- [ ] Set different weights for URLs
- [ ] Test weighted distribution (scan multiple times)
- [ ] Verify round-robin selection
- [ ] Analytics track each destination

#### Action QR Codes

**Email Actions:**

- [ ] Create email action QR
- [ ] Test email client opens with pre-filled data
- [ ] Verify subject and body are populated

**Phone Actions:**

- [ ] Create phone action QR
- [ ] Test phone dialer opens with number

**SMS Actions:**

- [ ] Create SMS action QR
- [ ] Test SMS app opens with pre-filled message

#### Geo-Tagged QR Codes

- [ ] Create geo QR with coordinates
- [ ] Test Google Maps opens with location
- [ ] Use "Current Location" button
- [ ] Create geo QR with address
- [ ] Verify address-based maps link

#### vCard Contact QR Codes

- [ ] Create vCard with full contact info
- [ ] Test contact file downloads on scan
- [ ] Verify contact imports to phone
- [ ] Test with minimal contact info

#### Plain Text QR Codes

- [ ] Create text QR with message
- [ ] Verify text displays on scan
- [ ] Test with long text content
- [ ] Test with special characters

#### Event Invite QR Codes

- [ ] Create event with all details
- [ ] Test calendar file downloads
- [ ] Verify event imports to calendar
- [ ] Test all-day events
- [ ] Test recurring events

### 3. QR Code Management

- [ ] View all QR codes in dashboard
- [ ] Filter by QR type
- [ ] Sort by creation date/scan count
- [ ] Edit QR code details
- [ ] Activate/deactivate QR codes
- [ ] Delete QR codes
- [ ] Bulk operations

### 4. Analytics & Reporting

#### Dashboard Analytics

- [ ] Total QR codes count
- [ ] Active QR codes count
- [ ] Total scans count
- [ ] Recent scans (7d/30d/90d)

#### Time-Based Reports

- [ ] Hourly reporting (last 24 hours)
- [ ] Daily reporting (last 30 days)
- [ ] Weekly reporting (last 12 weeks)
- [ ] Monthly reporting (last 12 months)

#### Device Analytics

- [ ] Mobile vs Desktop breakdown
- [ ] Device type pie chart
- [ ] Percentage calculations

#### Geographic Analytics

- [ ] Country-based scan distribution
- [ ] Top 10 countries list
- [ ] IP-based location detection

#### Performance Analytics

- [ ] Scan latency tracking (<500ms)
- [ ] Response time monitoring
- [ ] Error rate tracking

### 5. Sharing Features

- [ ] Copy QR URL to clipboard
- [ ] Share via email
- [ ] Share via SMS
- [ ] Native web share API (mobile)
- [ ] Social media sharing

### 6. Mobile Compatibility

- [ ] Responsive design on mobile
- [ ] Touch-friendly interface
- [ ] QR scanning works on mobile browsers
- [ ] File downloads work on mobile
- [ ] Native app integrations work

### 7. Performance Requirements

- [ ] QR generation <2 seconds
- [ ] Redirect latency <500ms
- [ ] Dashboard loads <3 seconds
- [ ] Analytics refresh <5 seconds
- [ ] File downloads start immediately

### 8. Error Handling

- [ ] Invalid QR ID shows error page
- [ ] Inactive QR codes show appropriate message
- [ ] Network errors are handled gracefully
- [ ] Form validation works correctly
- [ ] Database errors don't crash app

### 9. Security Testing

- [ ] RLS policies prevent unauthorized access
- [ ] User can only see their own QR codes
- [ ] Scan logs are properly isolated
- [ ] SQL injection protection
- [ ] XSS protection

### 10. Data Integrity

- [ ] Scan counts increment correctly
- [ ] Analytics data is accurate
- [ ] Timestamps are recorded properly
- [ ] Geographic data is captured
- [ ] Device detection works

## Test Scenarios

### Scenario 1: Business Card QR

1. Create vCard QR with full contact info
2. Generate and download QR code
3. Print QR code
4. Scan with mobile device
5. Verify contact downloads and imports

### Scenario 2: Event Promotion

1. Create event QR for conference
2. Share QR via social media
3. Track scan analytics
4. Monitor geographic distribution
5. Analyze device types

### Scenario 3: Marketing Campaign

1. Create multi-URL QR for A/B testing
2. Set different weights for landing pages
3. Deploy QR in marketing materials
4. Monitor performance analytics
5. Adjust weights based on results

### Scenario 4: Restaurant Menu

1. Create dynamic QR for menu
2. Update menu URL seasonally
3. Track customer engagement
4. Monitor peak usage times
5. Analyze customer locations

## Performance Benchmarks

- QR Generation: <2 seconds
- Redirect Response: <500ms
- Dashboard Load: <3 seconds
- Analytics Refresh: <5 seconds
- Mobile Responsiveness: 100%

## Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Known Limitations

1. IP-based geolocation may be inaccurate
2. File downloads require user interaction on some browsers
3. Native sharing API not available on all browsers
4. Some QR scanners may not support all formats

## Bug Reporting

When reporting bugs, include:

1. Browser and version
2. Device type (mobile/desktop)
3. Steps to reproduce
4. Expected vs actual behavior
5. Console errors (if any)

## Success Criteria

- [ ] All 8 QR types work correctly
- [ ] Analytics provide actionable insights
- [ ] Mobile experience is seamless
- [ ] Performance meets benchmarks
- [ ] No critical security issues
- [ ] Data integrity is maintained

## Post-Testing Actions

1. Document any issues found
2. Prioritize bug fixes
3. Update user documentation
4. Prepare for beta launch
5. Set up monitoring and alerts
