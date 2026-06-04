# Aurora App Design Brief (for AI Design Tools)

## 1) What Aurora Is

Aurora is an English-first mobile app focused on mental wellness.  
It combines:

- A supportive community feed (posts, comments, groups)
- 1:1 direct messages
- An AI companion (text chat)
- Personal reflection tools (journals, insights, health info, calendar context)

Tone of the product: warm, calm, hopeful, human, emotionally safe.

---

## 2) Core Product Pillars

1. Community support  
2. Personal emotional reflection  
3. AI-guided conversations  
4. Safety, trust, and privacy

---

## 3) Main Navigation (Bottom Tabs)

Aurora uses 5 primary tabs:

1. Feed (`(tabs)/index`)  
   - Home timeline with posts, reactions, comments
2. Connect (`(tabs)/groups`)  
   - Group discovery and joining topic-based communities
3. Aurora (`(tabs)/aurora`)  
   - AI hub and wellness shortcuts
4. Messages (`(tabs)/chat`)  
   - Conversation list and unread states
5. Profile (`(tabs)/profile`)  
   - User profile, settings, account actions

---

## 4) Key Screens to Design

### A) Onboarding + Auth

- Splash / app entry
- Onboarding flow
- Login
- Register
- Phone verification
- Forgot password
- Reset password
- Email verification success/fail

### B) Feed + Posts

- Feed list (mixed post cards)
- Create post
- Edit post
- Post detail + comments

### C) Groups (Connect)

- Groups discovery list
- Group detail
- Group members
- Group settings/admin
- Create group

### D) Messages

- Conversations list
- Search users (start new chat)
- Conversation thread

### E) Aurora AI

- AI provider select (`ai-select`)
- Text chat (`text-chat`)
- AI data info / consent explanation

### F) Journal + Insights

- Journal home
- Create journal
- Write entry
- Browse journals
- Entry detail
- Insights dashboard
- Entries insights
- Journal settings

### G) Profile + Settings

- Profile overview
- Edit profile
- Account settings
- Health info
- Notification center
- Sound settings
- Font settings
- Icon selector
- Subscription/paywall
- Ideas/feedback board
- Help & support
- Privacy policy
- Terms of service

---

## 5) Visual Direction

Style keywords:

- Soft
- Calm
- Ambient
- Friendly
- Trustworthy
- Minimal but expressive

Recommended visual system:

- Rounded cards and controls
- Subtle gradients and glow accents
- Spacious layouts with strong readability
- Emotional illustrations or abstract "aurora" light motifs
- High-contrast typography for accessibility

---

## 6) Design Tokens (Suggested)

### Color

- Primary: deep indigo / aurora violet
- Secondary: cyan or mint glow accent
- Success: soft green
- Warning: amber
- Error: warm red (not aggressive)
- Neutral surfaces for dark and light themes

### Typography

- Friendly sans-serif
- Clear heading scale (H1-H4)
- Body text optimized for long reading
- Support dynamic type/font scaling

### Spacing & Components

- 8pt spacing system
- Radius: medium to large
- Reusable components:
  - Post card
  - Group card
  - Chat bubble
  - Insight stat card
  - CTA button styles
  - Empty state blocks

---

## 7) UX Principles

1. Emotional clarity over visual complexity  
2. One primary action per screen  
3. Keep cognitive load low  
4. Supportive microcopy in plain English  
5. Safety and consent should always be obvious

---

## 8) Accessibility Requirements

- WCAG-friendly contrast in both light and dark themes
- Touch targets sized for mobile ergonomics
- Clear focus states
- Readable text at larger font sizes
- Avoid color-only status indicators

---

## 9) Suggested Deliverables for the Design AI

Ask the design AI to generate:

1. End-to-end app sitemap
2. High-fidelity mobile UI kit (light + dark)
3. Core flows:
   - Onboarding -> Auth -> Feed
   - Feed -> Post detail -> Comments
   - Aurora tab -> AI text chat
   - Journal create -> Insights
   - Profile -> Settings -> Subscription
4. Reusable component library
5. Interaction states:
   - Empty
   - Loading
   - Error
   - Success

---

## 10) Copy/Language Rule

All UI copy should be in **English**.

