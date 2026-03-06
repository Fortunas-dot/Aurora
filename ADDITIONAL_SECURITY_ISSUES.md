# Additional Security Issues Found

## 🔴 CRITICAL ISSUES

### 1. Email Verification Tokens Hebben Geen Expiry
**Locatie:** `backend/src/models/User.ts` en `backend/src/controllers/authController.ts`

**Probleem:**
- Email verification tokens worden gegenereerd met `crypto.randomBytes(32)` (goed)
- MAAR: Er is geen `emailVerificationExpires` veld zoals bij password reset tokens
- Tokens kunnen voor altijd gebruikt worden, zelfs jaren later

**Impact:**
- Oude email verification links blijven geldig voor altijd
- Als een token gelekt wordt, kan het later nog steeds gebruikt worden
- Security best practice: tokens moeten een expiry hebben (bijv. 24-48 uur)

**Aanbeveling:**
- Voeg `emailVerificationExpires` veld toe aan User model
- Zet expiry bij token generatie (bijv. 48 uur)
- Check expiry bij verificatie

---

## 🟠 HIGH PRIORITY ISSUES

### 2. Pagination Limits Niet Gevalideerd
**Locatie:** Alle controllers met pagination (postController, journalController, etc.)

**Probleem:**
```typescript
const limit = parseInt(req.query.limit as string) || 20;
```

**Impact:**
- Users kunnen `limit=999999` opgeven
- Dit kan leiden tot:
  - DoS via database overload
  - Hoge memory usage
  - Langzame response times
  - Mogelijk database crashes

**Aanbeveling:**
- Valideer limit: `Math.min(Math.max(parseInt(...) || 20, 1), 100)`
- Of gebruik een constante max limit (bijv. 100)

### 3. parseInt Zonder NaN Checks
**Locatie:** Alle controllers met pagination

**Probleem:**
```typescript
const page = parseInt(req.query.page as string) || 1;
const limit = parseInt(req.query.limit as string) || 20;
```

**Impact:**
- Als `parseInt` faalt (bijv. `page=abc`), wordt NaN gebruikt
- `NaN || 1` geeft 1 (fallback werkt)
- Maar `skip = (NaN - 1) * limit` geeft NaN, wat database queries kan breken

**Aanbeveling:**
- Gebruik `Number.parseInt()` met expliciete NaN checks
- Of gebruik een helper functie die altijd een nummer retourneert

---

## 🟡 MEDIUM PRIORITY ISSUES

### 4. Password Reset Rate Limiting
**Locatie:** `backend/src/controllers/authController.ts` - `requestPasswordReset`

**Probleem:**
- Password reset endpoint heeft geen specifieke rate limiting
- Alleen algemene API rate limiting (200/15min)

**Impact:**
- Users kunnen spam password reset emails sturen
- Email flooding mogelijk
- Potentieel voor abuse

**Aanbeveling:**
- Voeg specifieke rate limiter toe voor password reset (bijv. 3 per uur per IP)

### 5. Email Verification Rate Limiting
**Locatie:** `backend/src/controllers/authController.ts` - `sendVerificationEmailEndpoint`

**Probleem:**
- Geen specifieke rate limiting voor verification email resend

**Impact:**
- Users kunnen spam verification emails sturen
- Email flooding mogelijk

**Aanbeveling:**
- Voeg rate limiter toe (bijv. 5 per uur per user)

---

## ✅ POSITIEF - Goede Security Practices Gevonden

1. **Password Reset Security:**
   - ✅ Tokens worden gegenereerd met `crypto.randomBytes(32)` (cryptographically secure)
   - ✅ Expiry van 30 minuten
   - ✅ Token wordt null gezet na gebruik
   - ✅ Geen email enumeration leak

2. **Authorization Checks:**
   - ✅ Alle endpoints checken ownership correct
   - ✅ Comments: check `comment.author.toString() !== req.userId`
   - ✅ Posts: check `post.author.toString() !== req.userId`
   - ✅ Messages: check `message.receiver.toString() !== req.userId`
   - ✅ Ideas: check author ownership

3. **Input Validation:**
   - ✅ `escapeRegex()` gebruikt voor regex injection prevention
   - ✅ Mongoose schema validation voorkomt NoSQL injection
   - ✅ ObjectId validation op sommige plaatsen

4. **Token Generation:**
   - ✅ Password reset tokens: `crypto.randomBytes(32)` + expiry
   - ✅ Email verification tokens: `crypto.randomBytes(32)` (maar geen expiry)

---

## 📋 PRIORITEITEN VOOR FIXES

### Direct (Critical):
1. ✅ Email verification token expiry toevoegen

### Binnen 1 week (High):
2. ✅ Pagination limit validatie toevoegen
3. ✅ parseInt NaN checks toevoegen

### Binnen 2 weken (Medium):
4. Password reset rate limiting
5. Email verification rate limiting
