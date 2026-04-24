<script lang="ts">
  /**
   * Injects JSON-LD LocalBusiness structured data for SEO.
   * Place once in the root layout.
   */
  import { env } from '$env/dynamic/public';

  const SITE_URL = env.PUBLIC_SITE_URL || 'https://thewrench.club';
  const SUPPORT_EMAIL = env.PUBLIC_SUPPORT_EMAIL || 'info@thewrench.club';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    '@id': SITE_URL,
    name: 'Wrench Club',
    description:
      "West Michigan's premier membership-based DIY auto shop. Members rent hoist bays, flat bays, and a detail bay with access to a full tool library, professional lifts, and a gearhead community.",
    url: SITE_URL,
    telephone: '',
    email: SUPPORT_EMAIL,
    address: {
      '@type': 'PostalAddress',
      streetAddress: '522 Stocking Ave NW',
      addressLocality: 'Grand Rapids',
      addressRegion: 'MI',
      postalCode: '49504',
      addressCountry: 'US'
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 42.9674,
      longitude: -85.6810
    },
    priceRange: '$$',
    currenciesAccepted: 'USD',
    paymentAccepted: 'Credit Card, Debit Card',
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      description: 'Opening 2026 — hours TBD'
    },
    sameAs: ['https://www.facebook.com/wrenchclubb'],
    image: `${SITE_URL}/assets/team-cars.jpg`,
    founder: [
      { '@type': 'Person', name: 'Coleman Brook' },
      { '@type': 'Person', name: 'Derick Brower' },
      { '@type': 'Person', name: 'Mike Zandstra' },
      { '@type': 'Person', name: 'Adrian Hoogerheide' }
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Bay Rentals & Membership',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'Flat Bay Rental' }
        },
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'Hoist Bay Rental' }
        },
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'Detail Bay Rental' }
        },
        {
          '@type': 'Offer',
          itemOffered: { '@type': 'Service', name: 'Monthly Membership' }
        }
      ]
    }
  };
</script>

<svelte:head>
  {@html `<script type="application/ld+json">${JSON.stringify(schema)}</script>`}
</svelte:head>
