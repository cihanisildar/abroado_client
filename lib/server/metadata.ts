/**
 * SEO metadata generation utilities for Server Components
 */

import type { Metadata } from 'next';
import type { Post, City, Room } from '@/lib/types';
import { PageMetadata } from '../types/ui.types';

const SITE_NAME = 'Abroado';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://abroado.com';
const DEFAULT_DESCRIPTION = 'Connect with people living abroad and share experiences';

export function generatePageMetadata(config: PageMetadata): Metadata {
  const {
    title,
    description,
    keywords = [],
    canonical,
    openGraph,
    twitter,
  } = config;

  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const url = canonical || SITE_URL;

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    
    openGraph: {
      title: openGraph?.title || fullTitle,
      description: openGraph?.description || description,
      url: openGraph?.url || url,
      siteName: SITE_NAME,
      type: (openGraph?.type as 'website' | 'article') || 'website',
      images: openGraph?.image ? [
        {
          url: openGraph.image,
          width: 1200,
          height: 630,
          alt: openGraph?.title || title,
        }
      ] : [
        {
          url: `${SITE_URL}/og-default.png`,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        }
      ],
    },

    twitter: {
      card: twitter?.card || 'summary_large_image',
      title: twitter?.title || fullTitle,
      description: twitter?.description || description,
      images: twitter?.image ? [twitter.image] : [`${SITE_URL}/og-default.png`],
    },

    alternates: {
      canonical: url,
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export function generateHomeMetadata(): Metadata {
  return generatePageMetadata({
    title: `${SITE_NAME} - Connect Abroad Workers & Students`,
    description: DEFAULT_DESCRIPTION,
    keywords: ['expat', 'abroad', 'international', 'community', 'networking', 'travel'],
  });
}

export function generatePostMetadata(post: Post): Metadata {
  const description = post.content.length > 160 
    ? `${post.content.substring(0, 157)}...`
    : post.content;

  return generatePageMetadata({
    title: post.title,
    description,
    keywords: [...post.tags, post.category, post.city?.country || ''].filter(Boolean),
    canonical: `${SITE_URL}/posts/${post.id}`,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      image: post.images?.[0] || undefined,
      url: `${SITE_URL}/posts/${post.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      image: post.images?.[0] || undefined,
    },
  });
}

export function generateCityMetadata(city: City): Metadata {
  const title = `${city.name}, ${city.country} - Reviews & Experiences`;
  const description = `Read reviews and experiences from people living in ${city.name}, ${city.country}. Connect with the expat community.`;

  return generatePageMetadata({
    title,
    description,
    keywords: [city.name, city.country, 'reviews', 'expat', 'living abroad'],
    canonical: `${SITE_URL}/cities/${city.id}`,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/cities/${city.id}`,
    },
  });
}

export function generateRoomMetadata(room: Room): Metadata {
  const title = `${room.name} - ${room.country} Community`;
  const description = room.description ?? `Join the ${room.name} community in ${room.country}. Connect with like-minded people.`;

  return generatePageMetadata({
    title,
    description,
    keywords: [room.country ?? '', 'community', 'chat', 'networking', 'expat'].filter(Boolean),
    canonical: `${SITE_URL}/rooms/${room.id}`,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/rooms/${room.id}`,
    },
  });
}

export function generateCitiesListMetadata(): Metadata {
  return generatePageMetadata({
    title: 'Cities & Reviews',
    description: 'Explore cities around the world through reviews and experiences from the expat community.',
    keywords: ['cities', 'reviews', 'expat', 'international', 'living abroad'],
    canonical: `${SITE_URL}/cities`,
  });
}

export function generateRoomsListMetadata(): Metadata {
  return generatePageMetadata({
    title: 'Community Rooms',
    description: 'Join community rooms and connect with people from around the world.',
    keywords: ['community', 'rooms', 'chat', 'networking', 'international'],
    canonical: `${SITE_URL}/rooms`,
  });
}

export function generatePostsListMetadata(): Metadata {
  return generatePageMetadata({
    title: 'Posts & Experiences',
    description: 'Read posts and experiences from people living abroad. Get tips, guides, and insights.',
    keywords: ['posts', 'experiences', 'tips', 'guides', 'expat', 'abroad'],
    canonical: `${SITE_URL}/posts`,
  });
}

// Structured data helpers
export function generatePostStructuredData(post: Post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.content.substring(0, 200),
    author: {
      '@type': 'Person',
      name: post.user.username,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    image: post.images?.[0] ? {
      '@type': 'ImageObject',
      url: post.images[0],
    } : undefined,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/posts/${post.id}`,
    },
    keywords: [...post.tags, post.category].join(', '),
    articleSection: post.category,
    locationCreated: post.city ? {
      '@type': 'Place',
      name: `${post.city.name}, ${post.city.country}`,
    } : undefined,
  };
}

export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: DEFAULT_DESCRIPTION,
    sameAs: [
      // Add social media links here when available
    ],
  };
}