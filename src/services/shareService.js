/**
 * Share service for handling notice sharing functionality
 */

/**
 * Generates shareable content for a notice
 * @param {object} notice - Notice object
 * @returns {object} Shareable content
 */
export const generateShareContent = (notice) => {
  const baseUrl = window.location.origin;
  // Since there's no specific notice route, point to home page where notice board is visible
  const noticeUrl = `${baseUrl}${import.meta.env.BASE_URL || '/'}#notice-${notice.id}`;
  
  const title = notice.title || 'School Notice';
  const content = notice.content || '';
  const text = `📢 ${title}\n\n${content ? content.substring(0, 200) + (content.length > 200 ? '...' : '') : ''}\n\n🔗 View more notices: ${noticeUrl}`;
  
  return {
    title,
    text,
    url: noticeUrl,
    content: content || ''
  };
};

/**
 * Shares content on WhatsApp
 * @param {object} notice - Notice object
 */
export const shareOnWhatsApp = (notice) => {
  const shareContent = generateShareContent(notice);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareContent.text)}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Shares content on Facebook
 * @param {object} notice - Notice object
 */
export const shareOnFacebook = (notice) => {
  const shareContent = generateShareContent(notice);
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareContent.url)}&quote=${encodeURIComponent(shareContent.title)}`;
  window.open(facebookUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Shares content on Twitter
 * @param {object} notice - Notice object
 */
export const shareOnTwitter = (notice) => {
  const shareContent = generateShareContent(notice);
  const twitterText = `${shareContent.title} - ${shareContent.url}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`;
  window.open(twitterUrl, '_blank', 'noopener,noreferrer');
};

/**
 * Shares content via email
 * @param {object} notice - Notice object
 */
export const shareViaEmail = (notice) => {
  const shareContent = generateShareContent(notice);
  const subject = `School Notice: ${shareContent.title}`;
  const body = `Hello,\n\nI wanted to share this important notice from our school:\n\n${shareContent.title}\n\n${shareContent.content}\n\nYou can view the full notice here: ${shareContent.url}\n\nBest regards`;
  
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
};

/**
 * Copies notice link to clipboard
 * @param {object} notice - Notice object
 * @returns {Promise<boolean>} Success status
 */
export const copyNoticeLink = async (notice) => {
  try {
    const shareContent = generateShareContent(notice);
    await navigator.clipboard.writeText(shareContent.url);
    return true;
  } catch (error) {
    console.error('Failed to copy link:', error);
    return false;
  }
};

/**
 * Copies full notice text to clipboard
 * @param {object} notice - Notice object
 * @returns {Promise<boolean>} Success status
 */
export const copyNoticeText = async (notice) => {
  try {
    const shareContent = generateShareContent(notice);
    const fullText = `${shareContent.title}\n\n${shareContent.content}\n\n${shareContent.url}`;
    await navigator.clipboard.writeText(fullText);
    return true;
  } catch (error) {
    console.error('Failed to copy text:', error);
    return false;
  }
};

/**
 * Uses Web Share API if available
 * @param {object} notice - Notice object
 * @returns {Promise<boolean>} Success status
 */
export const shareUsingWebShareAPI = async (notice) => {
  if (!navigator.share) {
    return false;
  }

  try {
    const shareContent = generateShareContent(notice);
    await navigator.share({
      title: shareContent.title,
      text: shareContent.content,
      url: shareContent.url
    });
    return true;
  } catch (error) {
    console.error('Web Share API failed:', error);
    return false;
  }
};

/**
 * Checks if Web Share API is available
 * @returns {boolean} Availability status
 */
export const isWebShareAPISupported = () => {
  return typeof navigator !== 'undefined' && navigator.share;
};
