import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: string;
}

const defaultSEO = {
  title: 'Void Vendor | Free VST Plugins & Premium Audio Software for Windows',
  description: 'Download free VST3 plugins including Formant Filter, Tape Wobble, Lo-Fi Degrader & GrainStorm. Premium effects: Digital Rot ($25), VHS Tracker ($15). Professional tools for music producers.',
  keywords: 'free VST plugins 2026, free VST3 download, Windows VST plugins, formant filter VST, tape wobble effect, lo-fi degrader, granular synthesis VST, digital rot plugin, VHS tracker effect',
  image: 'https://www.voidvendor.com/og-image.png',
  type: 'website',
};

export const SEO = ({ title, description, keywords, image, type }: SEOProps) => {
  const location = useLocation();
  const currentUrl = `https://www.voidvendor.com${location.pathname}`;

  const seoTitle = title || defaultSEO.title;
  const seoDescription = description || defaultSEO.description;
  const seoKeywords = keywords || defaultSEO.keywords;
  const seoImage = image || defaultSEO.image;
  const seoType = type || defaultSEO.type;

  useEffect(() => {
    // Update document title
    document.title = seoTitle;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, useProperty = false) => {
      const attribute = useProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);

      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }

      element.setAttribute('content', content);
    };

    // Standard meta tags
    updateMetaTag('description', seoDescription);
    updateMetaTag('keywords', seoKeywords);

    // Open Graph tags
    updateMetaTag('og:title', seoTitle, true);
    updateMetaTag('og:description', seoDescription, true);
    updateMetaTag('og:image', seoImage, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:type', seoType, true);

    // Twitter tags
    updateMetaTag('twitter:title', seoTitle);
    updateMetaTag('twitter:description', seoDescription);
    updateMetaTag('twitter:image', seoImage);
    updateMetaTag('twitter:url', currentUrl);

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', currentUrl);
  }, [seoTitle, seoDescription, seoKeywords, seoImage, seoType, currentUrl]);

  return null;
};

// Predefined SEO configs for common pages
export const pageSEO = {
  home: {
    title: 'Void Vendor | Free VST Plugins & Premium Audio Software for Windows',
    description: 'Download free VST3 plugins including Formant Filter, Tape Wobble, Lo-Fi Degrader & GrainStorm. Premium effects: Digital Rot ($25), VHS Tracker ($15). Professional tools for music producers.',
    keywords: 'free VST plugins 2026, free VST3 download, Windows VST plugins, audio software, music production tools',
  },
  about: {
    title: 'About Void Vendor | Professional VST Plugin Developers',
    description: 'Learn about Void Vendor, creators of innovative VST3 plugins for music production and sound design. Our mission is to provide quality audio tools for producers worldwide.',
    keywords: 'Void Vendor, VST developers, audio software company, music production tools',
  },
  donate: {
    title: 'Support Void Vendor | Donate to Free VST Development',
    description: 'Support the development of free VST plugins. Your donations help us create more audio tools and keep existing plugins free. Accept Bitcoin, Monero, and card payments.',
    keywords: 'donate VST development, support audio software, cryptocurrency donations, free VST plugins',
  },
  contact: {
    title: 'Contact Void Vendor | VST Plugin Support & Inquiries',
    description: 'Get in touch with Void Vendor for plugin support, bug reports, feature requests, or general inquiries. We respond to all messages within 24-48 hours.',
    keywords: 'VST plugin support, audio software help, contact Void Vendor',
  },
  faq: {
    title: 'FAQ | Void Vendor VST Plugins - Common Questions & Answers',
    description: 'Frequently asked questions about Void Vendor VST plugins. Installation guides, compatibility info, licensing, and troubleshooting for Windows VST3 plugins.',
    keywords: 'VST FAQ, plugin installation, VST compatibility, audio software help',
  },
  forum: {
    title: 'Community Forum | Void Vendor VST Plugins Discussion',
    description: 'Join the Void Vendor community forum. Share presets, get production tips, report bugs, request features, and connect with other music producers and sound designers.',
    keywords: 'VST forum, music production community, sound design discussion, plugin presets',
  },
  downloads: {
    title: 'My Downloads | Void Vendor VST Plugins',
    description: 'Access your purchased VST plugins and download updates. View your order history and manage your Void Vendor plugin library.',
    keywords: 'VST downloads, plugin library, purchased plugins, audio software downloads',
  },
  privacy: {
    title: 'Privacy Policy | Void Vendor',
    description: 'Privacy policy for Void Vendor. Learn how we collect, use, and protect your personal information when you use our website and purchase plugins.',
    keywords: 'privacy policy, data protection, user privacy',
  },
  terms: {
    title: 'Terms of Service | Void Vendor',
    description: 'Terms of service for Void Vendor. Review our terms and conditions for using our website, purchasing plugins, and licensing agreements.',
    keywords: 'terms of service, plugin license, user agreement',
  },
};
