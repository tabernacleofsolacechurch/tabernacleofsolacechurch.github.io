/* ==========================================================================
   STATIC CONTENT (used only while the Supabase backend is NOT connected).
   Once the backend is connected, content is managed in the admin dashboard
   (admin.html) and this file is ignored.
   Leave the lists empty until you have real, approved content.
   ========================================================================== */
window.TSC_CONTENT = {
  /* Example programme:
  { id:"example", title:"Prayer Night", description:"...", start_at:"2026-12-05T18:00:00+01:00", end_at:"2026-12-05T20:00:00+01:00",
    venue_name:"Venue", venue_address:"", map_url:"", registration_required:false, capacity:null, contact_info:"" } */
  programmes: [],

  /* Example devotional (publish_date must be unique):
  { publish_date:"2026-11-01", title:"...", scripture_ref:"Psalm 23:1", scripture_text:"", message:"...", application:"...", reflection:"...", prayer:"..." } */
  devotionals: [],

  /* Example sermon:
  { id:"s1", title:"...", speaker:"Apostle Oluwaseun Israel", preached_on:"2026-11-01", description:"", category:"Biblical Teaching", video_url:"https://www.youtube.com/watch?v=...", audio_url:"" } */
  sermons: [],

  /* Example gallery item:
  { id:"g1", image_url:"gallery-1.webp", caption:"...", alt_text:"...", category:"Prayer Programmes", event_name:"", event_date:"2026-11-01" } */
  gallery: [],

  testimonies: [],
  departments: []
};
