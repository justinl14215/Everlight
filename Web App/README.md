# The Five Days of Everlight — Multiplayer Family Web App

A deployable Next.js application with a private Dungeon Master dashboard, four numbered QR-invited player portals, persistent character sheets, campaign chapters, hidden clues, shared dice events, quest rewards, and basic combat tracking.

## What works

- DM password login and separate player sessions by number, signed in HTTP-only cookies
- QR invitations for phone browsers (once deployed to a public HTTPS URL)
- Character creation (name, class, origin, trait), health, gold, inventory
- Five chapters (Nov 23–27, 2026), household missions and scripted mysteries
- DM-only mystery answer key, suspect dossiers and read-aloud scripts
- Private clues per player, group reveals, persistent event journal
- Server-generated dice rolls and basic DM-controlled combat
- Live-ish synchronization through 2.5-second polling, with server-side Supabase persistence

## Deployment (about 15–30 minutes if you have accounts)

1. Create a free Supabase project at https://supabase.com/dashboard . In **SQL Editor**, run `supabase/schema.sql`.
2. In Supabase project settings, copy **Project URL** and **service_role** secret key. **Never put the service_role key in a NEXT_PUBLIC variable or expose it to the browser.**
3. Create a new Git repository and push this folder. Import it into Vercel at https://vercel.com/new . Framework: Next.js.
4. Set environment variables in Vercel (see `.env.example`): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DM_PASSWORD`, `SESSION_SECRET` (32+ random characters), and `NEXT_PUBLIC_APP_URL` (your actual deployed HTTPS origin). Redeploy after saving.
5. Open your Vercel URL, select **Dungeon Master**, enter the DM password. Under **Invites**, scan each numbered player's QR codes using their phones. They select their player slot and create their characters.
6. On Nov 23, go to **Adventure** and select Day 1 to launch the opening narration. Use **Clues** to send evidence and **Players** to award items.

### Local testing

```bash
npm install
cp .env.example .env.local
# Fill in real Supabase credentials, a strong DM password, and a 32+ character SESSION_SECRET
npm run dev
```

Visit http://localhost:3000 . For QR access from phones, deploy to Vercel; `localhost` on a phone refers to the phone itself, not your laptop.

### Security and family notes

The DM password is checked on the server. The Supabase service-role key remains server-side; RLS is enabled and there are no public database access policies. The player code and slot are **convenience invitations, not strong authentication**: anyone with the code can join either player slot and see that slot's clues. Share invitations only with family, do not use sensitive real names or information, and do not expose the app publicly beyond your intended audience. For a longer-term deployment, add individual player PINs, rate limiting, and a password-change workflow. The app is not a public child social network; it has no public profiles or chat.

### Known scope limits

- Synchronization uses polling, not WebSocket push. Changes normally appear within ~2.5 seconds while the page is active.
- The campaign includes a complete five-day plot and a playable encounter framework, but this is a lightweight family RPG, not a full D&D 5e engine.
- DM can reveal chapter clues and custom clues, but clue dependency enforcement is manual.
- Existing physical table map and print PDFs are separate from the app.
- No automated character XP or spell-slot accounting; DM adjudicates special abilities.
- DM session and player session are tied to browser cookies; use separate devices or separate browser profiles for simultaneous roles.

### DM quick rules

For noncombat checks: roll d20 + 3. Target 10 (easy), 13 (medium), 16 (hard). Failure gives a complication or alternate clue, never a dead end. In combat: each hero rolls d20 + 3 to attack (10+ hits), damage d6 + 2. Enemy hits on 11+ for 2 damage. The DM may let clever roleplay replace combat. No child is required to fight, handle electrical wiring, climb ladders, or use hot/sharp cooking equipment.

### The central mystery (DM SPOILERS)

Aurel, the forgotten guardian, became the Hollow King when the festival erased his name. He took the flames to make the kingdom remember unity. Thursday's climax allows recognition and reconciliation or a battle followed by redemption. Friday's final flame is the family's shared promise.

### Local family preview without Supabase

Set EVERLIGHT_LOCAL_DB=1 in .env.local along with DM_PASSWORD, SESSION_SECRET, and an uppercase GAME_CODE. Set NEXT_PUBLIC_APP_URL to the full HTTP address of the PC on your home Wi-Fi, including the port, before building. Run npm run build and npm start -- --hostname 0.0.0.0 --port 3000. Open localhost:3000 on the PC and use Dungeon Master > Invites. Connect phones to the same Wi-Fi.

Local progress is saved in .everlight-local.json. Use a single server process for this database. The local mode permits HTTP cookies for the Wi-Fi preview. Leave EVERLIGHT_LOCAL_DB disabled for a hosted Supabase deployment.
