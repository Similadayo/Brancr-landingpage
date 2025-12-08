/**
 * Translation mapping for Instagram Insights API responses
 * The Instagram API returns localized text based on the account's language settings
 * This ensures we always display English labels regardless of the API response language
 */

const METRIC_TRANSLATIONS: Record<string, { title: string; description: string }> = {
  // English (default)
  impressions: {
    title: 'Impressions',
    description: 'Total number of times your content has been viewed',
  },
  reach: {
    title: 'Reach',
    description: 'Total number of unique accounts that have seen your content',
  },
  profile_views: {
    title: 'Profile Views',
    description: 'Number of times your profile has been viewed',
  },
  follower_count: {
    title: 'Followers',
    description: 'Total number of followers on your account',
  },
  engagement: {
    title: 'Engagement',
    description: 'Total number of likes, comments, and shares on your content',
  },
  likes: {
    title: 'Likes',
    description: 'Total number of likes on your content',
  },
  comments: {
    title: 'Comments',
    description: 'Total number of comments on your content',
  },
  saved: {
    title: 'Saved',
    description: 'Number of times your content has been saved',
  },
  shares: {
    title: 'Shares',
    description: 'Number of times your content has been shared',
  },
  views: {
    title: 'Views',
    description: 'Number of times your content has been viewed',
  },
  profile_links_taps: {
    title: 'Profile Link Taps',
    description: 'Number of times users tapped the profile link in your content',
  },
  threads_likes: {
    title: 'Threads Likes',
    description: 'Number of likes on your Threads posts',
  },
  threads_replies: {
    title: 'Threads Replies',
    description: 'Number of replies on your Threads posts',
  },
  // Dutch translations (common case)
  bereik: {
    title: 'Reach',
    description: 'Total number of unique accounts that have seen your content',
  },
  impressies: {
    title: 'Impressions',
    description: 'Total number of times your content has been viewed',
  },
  weergaven: {
    title: 'Profile Views',
    description: 'Number of times your profile has been viewed',
  },
  volgers: {
    title: 'Followers',
    description: 'Total number of followers on your account',
  },
  betrokkenheid: {
    title: 'Engagement',
    description: 'Total number of likes, comments, and shares on your content',
  },
  vind_ik_leuks: {
    title: 'Likes',
    description: 'Total number of likes on your content',
  },
  reacties: {
    title: 'Comments',
    description: 'Total number of comments on your content',
  },
  opgeslagen: {
    title: 'Saved',
    description: 'Number of times your content has been saved',
  },
};

/**
 * Translates Instagram Insights metric to English
 * Falls back to original if translation not found
 */
export function translateInstagramMetric(
  metricName: string,
  originalTitle: string,
  originalDescription: string
): { title: string; description: string } {
  // First try by metric name (standardized)
  const normalizedName = metricName.toLowerCase().trim();
  if (METRIC_TRANSLATIONS[normalizedName]) {
    return METRIC_TRANSLATIONS[normalizedName];
  }

  // Then try by original title (might be in different language)
  const normalizedTitle = originalTitle.toLowerCase().trim();
  if (METRIC_TRANSLATIONS[normalizedTitle]) {
    return METRIC_TRANSLATIONS[normalizedTitle];
  }

  // Fallback to original if no translation found
  return {
    title: originalTitle,
    description: originalDescription,
  };
}
