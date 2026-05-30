/**
 * Analytics & Ad Integration Template
 *
 * INSTRUCTIONS:
 * 1. Replace 'G-XXXXXXXXXX' with your Google Analytics 4 measurement ID
 * 2. Replace 'ca-pub-XXXXXXXXXXXXXXXX' with your Google AdSense publisher ID
 * 3. Replace ad slot placeholders in HTML files with actual AdSense ad code
 *
 * To get these IDs:
 * - Google Analytics: https://analytics.google.com (create a property)
 * - Google AdSense: https://adsense.google.com (apply after getting traffic)
 */

// ===== Google Analytics 4 =====
// Uncomment and replace with your measurement ID when ready:
/*
(function() {
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX', { anonymize_ip: true });
})();
*/

// ===== Google AdSense =====
// Uncomment and replace with your publisher ID when approved:
/*
(function() {
  var script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX';
  document.head.appendChild(script);
})();
*/

// ===== AdSense Ad Units =====
// After AdSense approval, replace <div class="ad-slot"> elements with:
// <ins class="adsbygoogle"
//      style="display:block"
//      data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
//      data-ad-slot="XXXXXXXXXX"
//      data-ad-format="auto"
//      data-full-width-responsive="true"></ins>
// <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
