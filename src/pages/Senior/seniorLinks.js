import {
    Facebook,
    Github,
    Globe,
    Instagram,
    Linkedin,
    MessageCircle,
    Send,
    Twitter,
    Youtube,
} from 'lucide-react';

// Platforms the Senior model accepts for socialMediaLinks.
export const PLATFORMS = {
    linkedin: { label: 'LinkedIn', icon: Linkedin },
    github: { label: 'GitHub', icon: Github },
    instagram: { label: 'Instagram', icon: Instagram },
    twitter: { label: 'Twitter', icon: Twitter },
    facebook: { label: 'Facebook', icon: Facebook },
    youtube: { label: 'YouTube', icon: Youtube },
    telegram: { label: 'Telegram', icon: Send },
    whatsapp: { label: 'WhatsApp', icon: MessageCircle },
    other: { label: 'Other', icon: Globe },
};

export const platformOf = (platform) =>
    PLATFORMS[platform] || {
        label: platform
            ? platform.charAt(0).toUpperCase() + platform.slice(1)
            : 'Link',
        icon: Globe,
    };

export const seniorLinks = (senior) =>
    Array.isArray(senior?.socialMediaLinks)
        ? senior.socialMediaLinks.filter(
              (link) => link && typeof link.url === 'string' && link.url.trim(),
          )
        : [];

/** "LinkedIn · GitHub", or "None". */
export const linksLabel = (senior) => {
    const links = seniorLinks(senior);
    return links.length
        ? links.map((link) => platformOf(link.platform).label).join(' · ')
        : 'None';
};

/** A clickable address for a stored link (bare domains and phone numbers too). */
export const linkHref = (link) => {
    const url = link.url.trim();
    if (/^https?:\/\//i.test(url)) return url;
    if (/^\+?\d[\d\s-]{6,}$/.test(url)) {
        return `https://wa.me/${url.replace(/\D/g, '')}`;
    }
    return `https://${url}`;
};

// The API fills profilePicture with this placeholder when a senior adds none.
export const DEFAULT_PHOTO =
    'https://dixu7g0y1r80v.cloudfront.net/public/ss-seniors/image192.jpg';

export const hasOwnPhoto = (senior) =>
    Boolean(senior?.profilePicture) && senior.profilePicture !== DEFAULT_PHOTO;

// The model field is `clickCount`; older records may carry `clickCounts`.
export const viewsOf = (item) => item?.clickCount ?? item?.clickCounts ?? 0;

export const branchLabel = (senior) =>
    senior?.branch?.branchCode || senior?.branch?.branchName || '';
