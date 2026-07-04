# ReelWrite — Intellectual Property Protection Guide

This guide explains what you (the owner) need to do **outside of the codebase**
to legally protect ReelWrite. The technical protections in the app (CSP, rate
limiting, source-map disabling, license headers) discourage casual copying, but
**real legal protection requires filing with government offices**.

> ⚠️ This guide is informational, not legal advice. For formal protection,
> consult an intellectual property attorney in your jurisdiction.

---

## Quick reference — what protects what

| Asset                          | Protection type   | Where to file                          | Cost (US)         |
| ----------------------------- | ----------------- | -------------------------------------- | ----------------- |
| Source code                   | Copyright         | Automatic (no filing needed)           | Free              |
| ReelWrite name                | Trademark         | USPTO (US) / WIPO (international)      | $350–$700+        |
| Pen-nib logo                  | Trademark         | USPTO (US) / WIPO (international)      | $350–$700+        |
| Product look-and-feel         | Trade dress       | USPTO (filed with trademark)           | $350–$700+        |
| Novel technical method        | Patent (utility)  | USPTO                                  | $5,000–$15,000+   |
| UI design (ornamental)        | Patent (design)   | USPTO                                  | $1,000–$3,000     |
| Confidential info / algorithms| Trade secret      | Nothing to file — internal controls    | Free              |
| Your business entity          | LLC / Corp        | Your state's secretary of state        | $50–$500          |

---

## 1. Copyright — automatic, but register it

**What it covers:** Your source code, design files, content, documentation.
Copyright protects the *expression* of an idea, not the idea itself.

**Good news:** Copyright exists the moment you create the work. The © notice
and LICENSE file in this repo already assert your claim.

**Why register anyway:** US copyright registration is required before you can
sue for infringement, and registering *before* infringement happens lets you
claim statutory damages ($750–$30,000 per work, up to $150,000 for willful)
plus attorney fees. Without registration, you can only claim actual damages
(which are hard to prove).

**How to register (US):**
1. Go to <https://www.copyright.gov/registration/>
2. Choose "Register a Work"
3. Pay the fee ($45–$65 per work)
4. Upload or describe your work (source code can be filed as a "computer program")
5. For source code, you can file the first 25 pages and last 25 pages of code
   (with confidential portions redacted) — this is standard practice

**Cost:** ~$45–$65 per work
**Timeline:** 3–8 months (effective date of registration is the day the
Copyright Office receives your application)

**For other countries:**
- UK: <https://www.gov.uk/copyright>
- EU: Copyright is automatic; no central registration
- Canada: <https://www.ic.gc.ca/eic/site/cipointernet-internetopic.nsf/eng/h_wr02281.html>
- China: <https://www.ccopyright.com.cn/>

---

## 2. Trademark — protect "ReelWrite" and the logo

**What it covers:** Your brand name, logo, slogans. Trademark stops others
from using confusingly similar marks for similar goods/services.

**Step 1 — Search first (free):**
- US: search TESS at <https://tmsearch.uspto.gov/>
- EU: search EUIPO at <https://www.tmdn.org/tmview/>
- WIPO Global Brand Database: <https://www3.wipo.int/branddb/en/>
- Search "ReelWrite", "Reel Write", and similar variants in classes:
  - Class 9 (software)
  - Class 41 (entertainment/education services)
  - Class 42 (SaaS)

**Step 2 — File the application (US):**
1. Go to <https://www.uspto.gov/trademarks/apply>
2. Use the Trademark Electronic Application System (TEAS)
3. File TEAS Plus ($250 per class) or TEAS Standard ($350 per class)
4. You'll need:
   - The mark (text "ReelWrite" and/or the pen-nib logo)
   - Specimen of use (screenshot of the app showing the mark in commerce)
   - Goods/services classes (9, 41, 42 listed above)
   - Date of first use in commerce

**Step 3 — International protection:**
- File a Madrid Protocol application through WIPO
- One application covers 130+ countries
- Base it on your US application
- File at <https://www.wipo.int/madrid/en/>

**Cost (US):** $250–$350 per class + attorney fees if you use one (~$500–$1,500)
**Timeline:** 12–18 months to registration in the US

---

## 3. Patents — only if your idea is genuinely novel

**What it covers:** A novel, non-obvious *method* or *invention*. Software
patents are controversial but still granted in the US for genuinely novel
technical methods.

**Important:** Ideas themselves are not patentable. Only specific
implementations of an idea can be patented. "A TikTok for writers" is an idea;
the specific way you implement 7-second kinetic typography reels with
mood-based gradients and a book-CTA attachment pattern *might* be patentable
if it's novel.

**Before filing:**
1. Search prior art:
   - Google Patents: <https://patents.google.com/>
   - USPTO: <https://patents.uspto.gov/>
   - Search for "short-form video", "kinetic typography", "book marketing",
     "vertical scroll feed", "automatic book cover generation"
2. Honestly assess: is what you're doing *technically* novel, or just a
   clever combination of existing techniques? Combinations can be patented
   but are harder to defend.
3. Talk to a patent attorney. Do **not** file a patent application yourself
   unless you have experience — they're easy to mess up.

**If you decide to file:**
- Provisional patent application (PPA): $65–$300, gives you 12 months of
  "patent pending" status while you decide whether to file the full
  application. Cheapest way to lock in a filing date.
- Full utility patent application: $5,000–$15,000+ with attorney fees,
  2–4 year process.

**Design patents** (for the UI):
- Protect the ornamental appearance of your interface
- Much cheaper than utility patents (~$1,000–$3,000)
- Faster to grant (12–18 months)
- File if your UI design is distinctive enough to be worth protecting

---

## 4. Trade secrets — protect confidential algorithms

**What it covers:** Anything you keep confidential that gives you a business
advantage — recommendation algorithms, business logic, internal tools.

**Cost:** Free, but requires internal discipline:
- Mark sensitive documents "CONFIDENTIAL"
- Use NDAs with employees, contractors, and partners (template in section 6)
- Limit source code access on a need-to-know basis
- Don't publish your recommendation algorithm or moderation logic publicly
- Use access logs on your production database

The ReelWrite repo already has a `LICENSE` file asserting proprietary rights,
which is the foundation. For real trade secret protection, your production
infrastructure should be private (this sandbox is for development only).

---

## 5. Form a business entity

If you haven't already, form an LLC or corporation to own the IP. This:
- Separates your personal assets from business liability
- Makes IP ownership clear (the company owns ReelWrite, not you personally)
- Makes it easier to grant licenses, take investment, or sell the company

**Cost (US):** $50–$500 to file with your state's Secretary of State
**Recommended:** Delaware LLC (if you're in the US) — most flexible, well-
understood by investors

---

## 6. NDAs for collaborators

If anyone else touches the code (employees, contractors, freelancers), have
them sign an NDA before they get access. A basic NDA covers:

- What's confidential (source code, designs, business plans, user data)
- How long confidentiality lasts (typically 2–5 years post-termination)
- What they can't do (copy, share, use for themselves, use for competitors)
- What happens if they breach (injunction + damages)

**Free NDA templates:**
- <https://www.rocketlawyer.com/> (free NDA template)
- <https://www.termly.io/templates/nondisclosure-agreement-template/>

Have a lawyer review any NDA before signing.

---

## 7. DMCA agent — required if you host user content

ReelWrite lets users post reels and comments. Under US law (17 U.S.C. § 512),
to qualify for safe harbor protection against copyright claims for user-
generated content, you must:

1. Designate a DMCA agent with the US Copyright Office
2. Cost: $6 to register, $6 to renew every 3 years
3. File at: <https://dmca.copyright.gov/osp/
4. Display your DMCA contact info in your terms of service and in the app
   (ReelWrite already shows `legal@reelwrite.app` in the Ownership Notice)

Without a registered DMCA agent, you can be held liable for copyright
infringement committed by your users.

---

## 8. Terms of Service and Privacy Policy

You need both before launching publicly. They:
- Set the rules users agree to when using the app
- Limit your liability
- Grant you a license to display user-generated content
- Explain how you handle user data (required by GDPR, CCPA, etc.)

**Templates:**
- Terms of Service: <https://www.termly.io/templates/terms-of-service-template/>
- Privacy Policy: <https://www.termly.io/templates/privacy-policy-template/>

Have a lawyer review both before launch.

---

## 9. What's already done in this repo

The following technical protections are already implemented in ReelWrite:

- ✅ **LICENSE** file asserting proprietary copyright
- ✅ Copyright headers on every source file (`scripts/add-headers.js`)
- ✅ Public "Protected" badge in the UI that opens an ownership notice dialog
- ✅ Content Security Policy (CSP) — blocks injected scripts
- ✅ Rate limiting — 20 writes/min, 60 reads/min per IP
- ✅ Input validation + sanitization on all write endpoints
- ✅ Source maps disabled in production (`next.config.ts`)
- ✅ Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, etc.)
- ✅ Banned user enforcement (banned users can't post or like)
- ✅ DMCA contact email (`legal@reelwrite.app`) in UI

---

## 10. Action checklist

Print this and tick off each item:

- [ ] Register copyright for the source code at <https://www.copyright.gov/>
- [ ] Search TESS for "ReelWrite" conflicts at <https://tmsearch.uspto.gov/>
- [ ] File US trademark for "ReelWrite" (classes 9, 41, 42)
- [ ] File US trademark for the pen-nib logo
- [ ] File Madrid Protocol application via WIPO (if international)
- [ ] Search Google Patents for prior art
- [ ] Consider a provisional patent application if your method is novel
- [ ] Form an LLC or corporation to own the IP
- [ ] Designate a DMCA agent at <https://dmca.copyright.gov/osp/>
- [ ] Draft Terms of Service (lawyer-reviewed)
- [ ] Draft Privacy Policy (lawyer-reviewed)
- [ ] Create NDA template for collaborators
- [ ] Set up access controls on production infrastructure

---

## Contact

For questions about this guide or ReelWrite's IP:
- Email: legal@reelwrite.app

For legal advice, hire an IP attorney in your jurisdiction. The American Bar
Association can refer you: <https://www.americanbar.org/groups/flagship/ldaportal/>
