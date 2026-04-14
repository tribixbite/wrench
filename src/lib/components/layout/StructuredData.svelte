<script lang="ts">
  /**
   * Injects JSON-LD LocalBusiness structured data for SEO.
   * Place once in the root layout.
   */
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    '@id': 'https://wrenchclub.com',
    name: 'Wrench Club',
    description:
      "West Michigan's premier membership-based DIY auto shop. Members rent hoist bays, flat bays, and a detail bay with access to a full tool library, professional lifts, and a gearhead community.",
    url: 'https://wrenchclub.com',
    telephone: '',
    email: 'info@wrenchclub.com',
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
    image: 'https://wrenchclub.com/assets/team-cars.jpg',
    founder: [
      { '@type': 'Person', name: 'Coleman Brook' },
      { '@type': 'Person', name: 'Derick Brower' },
      { '@type': 'Person', name: 'Mike Zandstra' }
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
