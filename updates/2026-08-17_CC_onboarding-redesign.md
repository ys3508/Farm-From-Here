# 2026-08-17 — Claude Code — Onboarding redesign (splash → login → sign up)

Built from `revise/2026-08-17-onboarding-redesign.md`. Visual round only: **no backend, schema or
auth logic was rebuilt or re-wired.**

---

## 1. What was done

**BUILT and verified**

- **Brand design system** (`src/design/brand/`) — the owner-approved 9-colour palette, radius 14,
  Cormorant / Inter / Dancing Script, plus shared components: `BrandText`, `BrandButton`,
  `BrandField`, `ScrimCard`, `Collapsible`, `SceneBackground`.
- **Splash (new)** — `app/splash.tsx`. Layered fade-in over `splash.png`: wordmark → subtitle →
  handwritten line, ~3.5s, tap anywhere to skip, soft dissolve into Login.
- **Welcome Back (new)** — `app/welcome-back.tsx`. Same faces, same rhythm, ~2s, on `welcome.png`,
  auto-enters the app. Shares one component with the splash so the two can never drift.
- **Login (redesigned)** — `app/(auth)/sign-in.tsx`. Full-bleed `login-bg.png`; a translucent
  white card wraps only the input area. One identifier field, password, green pill button,
  collapsed "More options", guest link, footer to sign up.
- **Sign up (new screen)** — `app/(auth)/sign-up.tsx`. Same treatment on `signup-bg.png`, with the
  collapsed "Have a referral code?" row at the top of the card.
- **All four illustrations** copied into `assets/onboarding/` and live.

Verified: `tsc --noEmit` clean; iOS **and** Android bundles export; every screen inspected in the
browser renderer; the three text layers confirmed by computed style (Cormorant_300Light 30px /
Inter_500Medium 15px / DancingScript_500Medium 24px, all white).

**Deliberately NOT touched**

- My World, the map and the profile screen. They still read the old `src/design/tokens.ts` and are
  byte-identical. That was the owner's call on scope.
- All Step 1 auth, schema, ledgers and referral accounting.

---

## 2. Notes by audience

### For Sissi — decisions and things to know

**Your four answers, as implemented.** Scope limited to onboarding; Cormorant for the display
face; Welcome Back scene for returning users; `email.tsx` and `phone.tsx` deleted.

**Two palettes now coexist, on purpose.** `src/design/brand/tokens.ts` is the standard going
forward. `src/design/tokens.ts` is the old one, still used by the three un-reskinned screens. Both
files say so at the top. The old one dies when the last screen migrates — nothing new should be
added to it.

**The identifier field accepts three things; only one of them completes.**
- Email ✅ works end to end.
- Phone ⛔ still the Step 1 stub — SMS costs money and was never wired. Typing a phone number
  gives the honest "not connected yet" message.
- Username ⛔ stub. Supabase has no native username auth; it needs a username → email lookup
  table, which the spec put out of scope.

So the single field is, today, mostly an email field that explains itself. That is per spec, but
worth knowing before a demo: **demo with an email address.**

**"Guest = browse-only" is not enforced.** The spec describes guest as browse-only. Guest is
currently a full Supabase anonymous user who gets a profile and the opening grants, exactly as in
Step 1 — I did not change that, because changing it means changing working backend behaviour.
Nothing to restrict yet in practice (adopting is not built until Step 3), but if you want a real
browse-only restriction, say so and it becomes a Step 3 rule.

**The illustrations add ~13 MB to the app bundle** (four PNGs, 3.1–3.4 MB each, and both the
masters in `ui_design/` and the shipped copies in `assets/` are now in git). It works fine, but it
is heavy for a mobile download. I did not recompress your artwork without asking. If you want, I
can add downscaled @1x/@2x/@3x variants and cut it to roughly a third with no visible difference
on a phone — the masters stay untouched either way.

**The wordmark size is set to fit one line.** 30pt with 0.14em tracking fits "FARM FROM HERE" on a
375pt screen. If you ever want it bigger, it will wrap to FARM FROM / HERE on small phones — the
fallback is built and automatic, but the spec preferred one line, so 30 is the ceiling.

### For other agents — build notes

- **Import from `@/design/brand`** for anything new. `@/design` is the legacy set.
- `SceneBackground` pins the image with an explicit `width/height: '100%'` absolute box, not
  `StyleSheet.absoluteFill` — on react-native-web the Image otherwise lays out at the asset's
  intrinsic 1086×1448 and the art renders zoomed and off-centre. Do not "simplify" it back.
- `onboardingSequence` (`src/features/onboarding/sequence.ts`) is module state, so it resets each
  launch. That is the definition of "once per launch" here. Do not persist it, or returning users
  never see the welcome scene again.
- Screens that authenticate call `onboardingSequence.markWelcomePlayed()` before redirecting, so
  someone who just typed their password is not then "welcomed back". Keep that if you add another
  sign-in path.
- `classifyIdentifier` in `src/features/auth/identifier.ts` is the only place that decides
  email/phone/username. Wire username there when the lookup table exists.

---

## 3. To-do

**Owner**
1. Look at the three screens in Expo Go and say whether the type sizes and the card opacity
   (`scrim.cardBackground`, currently 0.93) feel right — both are one-line changes.
2. Decide on downscaled image variants (see the 13 MB note).
3. Still outstanding from Step 1: create the Supabase project and run the migrations. Until then
   login cannot actually complete — the screens render, but there is no backend to talk to.

**Next rounds**
4. Re-skin My World, the map and the profile screen onto the brand system, then delete
   `src/design/tokens.ts`.
5. Username login (needs the `profiles.username` column + lookup RPC).
6. Phone/SMS, if and when you want to pay for Twilio.
