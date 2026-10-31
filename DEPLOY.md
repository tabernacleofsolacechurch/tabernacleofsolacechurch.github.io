# TSC Website: Setup, Operation and Handover Guide

This is the upgraded Tabernacle of Solace Church website. It keeps the existing identity, vision, mission, beliefs, giving details and Bible plan, and adds spiritual growth resources, forms, a follow-up system and a secure administration dashboard.

## 1. What works today and what needs the backend

| Feature | Works with no setup | Needs the Supabase backend |
|---|---|---|
| All public pages, navigation, design, SEO files | Yes | |
| 365-day Bible plan (Africa/Lagos date), progress on the device | Yes | |
| 12 New Believers' lessons, quizzes, progress on the device | Yes | |
| WhatsApp buttons, social links, giving details, Break Free Tribe links | Yes | |
| Programmes, devotionals, sermons, gallery content | Edit `content.js` by hand | Managed in the admin dashboard |
| Membership, visitor, prayer, testimony, contact, partnership forms | Open the visitor's email app (the site says so honestly) | Saved securely in the database |
| Programme registration with capacity and deadlines | Email fallback | Enforced by the database |
| Follow-up system, role-based dashboard, audit log, CSV export | | Yes |
| Automatic emails or SMS | | Needs an email or SMS provider (section 8) |
| Online card payments | | Needs a payment provider (section 9) |

Nothing on the site pretends to be saved when it is not.

## 2. Publish the website (GitHub Pages)

1. Extract the zip on your phone (Files app).
2. In your repository `tabernacleofsolacechurch.github.io`, tap **Add file, Upload files**, select **all the extracted files**, and **Commit changes**. Replace the existing `index.html`.
3. Wait 1 to 2 minutes. Your site stays at https://tabernacleofsolacechurch.github.io.
4. Files must stay in the main folder (no sub-folders). Keep the file names exactly as they are.

## 3. Connect the backend (about 20 minutes)

1. Create a free project at https://supabase.com (choose a region close to Nigeria if offered). Save the database password safely.
2. Open **SQL Editor, New query**, paste the whole of `schema.sql`, and tap **Run**. It is safe to run again.
3. Open **Project Settings, API**. Copy the **Project URL** and the **anon public key** into `config.js` (`supabase: { url: "...", anonKey: "..." }`). Commit the change.
   * The anon key is designed to be public. The database rules (RLS) in `schema.sql` protect the data.
   * **Never** put the `service_role` key in any file in the repository.
4. **Authentication, Providers, Email:** turn **off** "Allow new users to sign up". Only people you create can sign in.
5. **Authentication, URL Configuration:** set Site URL to your website address (for password reset links).
6. **Create the first administrator:** Authentication, Users, Add user (email and password). Then run in the SQL Editor:
   ```sql
   insert into public.profiles(id, full_name, roles)
   select id, 'Apostle Oluwaseun Israel', array['super_admin'] from auth.users where email='YOUR_EMAIL_HERE'
   on conflict (id) do update set roles=excluded.roles, active=true;
   ```
7. Open `https://tabernacleofsolacechurch.github.io/admin.html` and sign in.
8. **Test on the live GitHub Pages address, not in a chat preview:** submit a test prayer request and a test membership form, then see them in the dashboard.

## 4. Staff roles

Create a login in Supabase for each person, then add their profile in **Users and roles** with the roles they need.

| Role | Access |
|---|---|
| super_admin | Everything, users and roles, audit log |
| pastoral_admin | Members, visitors, walk-with-me requests, all follow-ups, prayer requests, enquiries, departments |
| followup_worker | Only the follow-ups assigned to them |
| content_editor | Devotionals, Bible plan changes, sermons, gallery, testimonies, settings |
| events_admin | Programmes, registrations, attendance |
| finance_admin | Giving and finance records, partnerships |

A person can have more than one role. The rules are enforced by the database, so hiding a menu item is not the only protection. To change what a role can do, edit the policies in `schema.sql`.

## 5. Everyday tasks

* **Publish a devotional:** Devotionals, New, fill in, set the date, **Preview**, then **Publish**. A future date schedules it. Drafts are never public.
* **Add a programme:** Programmes, New. Set registration, capacity and extra questions. Publish. It appears on the home page and Programmes page.
* **Follow-ups:** each membership, visitor or walk-with-me submission creates a follow-up automatically. Assign it, contact the person (the WhatsApp button prepares a polite message for you to send yourself), record the outcome, set the next date.
* **Testimonies:** submissions wait for review. Approve, edit the published text, or reject.
* **Announcements and service times:** Settings, keys `announcement` and `service_times` (examples are shown on that page).
* **Departments:** add only those that exist. Active ones appear on the membership form.
* **Gallery:** upload authentic photographs only. They are resized automatically.

## 6. Security summary

* Public visitors can only read published content and insert form submissions. They cannot read private records.
* Prayer requests, member records, follow-up notes and finance records are restricted by role.
* Passwords are handled by Supabase Authentication. No secrets are in the public files.
* Important changes are recorded in the audit log (changed columns only, not private content).
* Spam control: hidden trap field, a short delay between submissions, database length limits and unique registrations. For stronger protection add Cloudflare Turnstile or Supabase rate limits later.
* Forms collect only what is needed. Consent is required before storage.

## 7. Backups, recovery and retention

* Supabase's free plan does not include automatic daily backups. **Export CSV from the dashboard at least monthly** (Membership, Registrations, Finance, Prayer) and store the files somewhere safe and private. Consider the paid plan with backups when the church has real member data.
* To recover: create a new Supabase project, run `schema.sql`, and import the CSV files through Table Editor, Import data.
* **Free projects pause after about a week without activity.** Sign in or visit the site weekly, or upgrade, to avoid downtime.
* **Retention** (proposed defaults, shown in the Privacy Policy; the church must confirm them): prayer requests 12 months, visitors 12 months, contact enquiries 12 months, event registrations 24 months, members while active plus 24 months. A super administrator can run `select public.purge_old_records();` in the SQL Editor to delete expired prayer, visitor, contact and registration records. It does not run automatically.
* Handle deletion or correction requests by emailing the church; delete or edit the record in the dashboard.

## 8. Notifications (email and SMS)

Not automatic yet. The site never claims a message was sent. To automate confirmations, connect an email provider (for example Resend) through a Supabase Edge Function triggered by new rows, and keep the templates in the dashboard. WhatsApp messages are always sent by a person, never in bulk.

## 9. Online giving

The site shows bank transfer details and never collects card numbers. To accept cards, create a Paystack or Flutterwave payment page and paste its link into `config.js` (`giving.onlineLink`). Verifying payments automatically needs a Supabase Edge Function that calls the provider's verification API. Until then, finance records are manual and have a **Verified** checkbox that should only be ticked after checking the bank statement.

## 10. Break Free Tribe

It stays a separate brand and a separate app. TSC has its own devotional and Bible plan. **Recommended shared-content design:** keep devotionals in the one `devotionals` table. The Break Free Tribe app can read published rows from the same Supabase project using the same public (read-only) rules, so both platforms show one source. This needs a small change in the Break Free Tribe app and was not changed here.

## 11. Configuration you control

`config.js` holds the church name, email, WhatsApp number, social links, giving details and backend keys. **Please verify the WhatsApp number (2348147560000) is the official TSC number.** Leave address and service times empty until confirmed. Once the backend is connected, the Settings module overrides these without editing code.

## 12. Honest status and limits

* Built and checked: every page's scripts run without errors in simulated tests, with and without the backend, including form submissions to the correct tables; every admin module renders and every record editor opens; the Bible plan covers all 1,189 chapters exactly once; all internal links resolve.
* **Not possible here:** I could not run a real browser, a real Supabase project, or a PostgreSQL server. `schema.sql` and the live data connection are therefore **untested against a live database**. Run the steps in section 3, test on the live site, and tell me about anything that fails.
* Not built: member login portal, progress sync across devices (progress is saved on each device), automatic email/SMS, online card payments, per-member attendance history, database-managed lessons (lessons are in `lessons.js`), advanced financial reports (date range, totals and CSV export only).
* Photographs: only the Lead Pastor's photograph and the logos are used. The gallery shows a placeholder until real photographs are uploaded.
* Scripture: Scripture quotations are KJV (public domain). Bible readings open in Bible Gateway, so no copyrighted translation is copied.
* The privacy policy, retention periods and beliefs are drafts for the church to review, ideally with a Nigerian legal adviser for data protection law.
