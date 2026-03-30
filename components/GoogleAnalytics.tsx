import Script from 'next/script'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const GA_ADS_ID = process.env.NEXT_PUBLIC_GA_ADS_ID

export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null

  return (
    <>
      <Script id="gtag-consent-default" strategy="beforeInteractive">
        {`
          try {
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            
            // Set default consent to denied (GDPR compliant)
            gtag('consent', 'default', {
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'analytics_storage': 'denied',
              'functionality_storage': 'granted',
              'personalization_storage': 'denied',
              'security_storage': 'granted',
            });
          } catch (e) {
            console.warn('[GA] Consent init failed:', e);
          }
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          try {
            if (typeof gtag === 'function') {
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
              ${GA_ADS_ID ? `gtag('config', '${GA_ADS_ID}');` : ''}
            }
          } catch (e) {
            console.warn('[GA] Config failed:', e);
          }
        `}
      </Script>
    </>
  )
}
