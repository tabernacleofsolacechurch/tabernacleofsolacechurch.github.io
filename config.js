/* ==========================================================================
   TSC SITE CONFIGURATION  (edit this file to change contact details everywhere)
   Leave a value empty ("") to hide it. Nothing here is a secret:
   the Supabase anon key is designed to be public and is protected by the
   database security rules in schema.sql.
   ========================================================================== */
window.TSC_CONFIG = {
  name: "Tabernacle of Solace Church",
  short: "TSC",
  tagline: "Where Brokenness Meets Divine Solace.",
  siteUrl: "https://tabernacleofsolacechurch.github.io",
  timezone: "Africa/Lagos",

  email: "tabernacleofsolacechurch@gmail.com",

  // Digits only, international format (Nigeria 234, drop the first 0).
  // This number receives the floating WhatsApp button, enquiries and giving receipts.
  // PLEASE VERIFY that this is the official TSC WhatsApp number.
  whatsapp: "2348147560000",
  whatsappDefault: "Hello TSC, I visited your website and would like to make an enquiry.",

  location: {
    city: "Ibadan",
    country: "Nigeria",
    address: "",     // Add the street address ONLY when the church has a confirmed permanent location.
    mapUrl: "",      // Optional Google Maps link for the confirmed location.
    note: "TSC is establishing its physical presence in Ibadan. The venue for each gathering is announced with the programme details."
  },

  // Regular service times. Add only confirmed times. Example:
  // { name: "Sunday Service", day: "Sundays", time: "9:00 AM", venue: "Venue to be confirmed" }
  serviceTimes: [],

  social: [
    { key: "telegram",  name: "Telegram",  url: "https://t.me/+bTs7PQX4AWxhZTE0",                     handle: "TSC Telegram community",    color: "#26A5E4" },
    { key: "youtube",   name: "YouTube",   url: "https://www.youtube.com/@TabernacleofsolaceChurch",  handle: "@TabernacleofsolaceChurch", color: "#FF0000" },
    { key: "facebook",  name: "Facebook",  url: "https://www.facebook.com/TSCIBADAN",                 handle: "TSCIBADAN",                 color: "#1877F2" },
    { key: "instagram", name: "Instagram", url: "https://www.instagram.com/tabernacleofsolacechurch", handle: "@tabernacleofsolacechurch", color: "#C13584" },
    { key: "tiktok",    name: "TikTok",    url: "https://www.tiktok.com/@tabernacle_solace_church",   handle: "@tabernacle_solace_church", color: "#000000" },
    { key: "x",         name: "X",         url: "https://x.com/Toschurch7",                           handle: "@Toschurch7",               color: "#000000" }
  ],

  giving: {
    bankName: "Guaranty Trust Bank (GTBank)",
    accountName: "Oluwaseun Samuel Israel",
    accountNumber: "0132038855",
    onlineLink: "",   // Add a Paystack / Flutterwave payment page link here when one exists.
    categories: [     // Suggested categories. Edit to match what the church approves.
      "General Ministry Support",
      "Monthly Programme Sponsorship",
      "Outreach and Community Care",
      "Church Development"
    ]
  },

  breakFreeTribe: {
    name: "Break Free Tribe",
    url: "https://oluwaseunisrael3-boop.github.io/Break-Free-App/"
  },

  // ---- Backend (Supabase). Leave empty until you have followed DEPLOY.md ----
  // While empty, forms open the visitor's email app instead of storing records,
  // and the site tells the visitor so. Nothing pretends to be saved.
  supabase: { url: "", anonKey: "" }
};
