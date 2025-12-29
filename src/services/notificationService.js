/**
 * Service for handling web notifications for admin actions
 */

// Check if browser supports notifications
export const checkNotificationSupport = () => {
  return 'Notification' in window;
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!checkNotificationSupport()) {
    console.warn('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Send web notification
export const sendWebNotification = async (title, message, url) => {
  // Check if browser supports notifications
  if (!checkNotificationSupport()) {
    console.warn('Browser does not support notifications');
    return;
  }

  // Request permission if not granted
  const permissionGranted = await requestNotificationPermission();
  if (!permissionGranted) {
    console.warn('Notification permission not granted');
    return;
  }

  // Create notification options
  const options = {
    body: message,
    icon: '/logo.png', // Use the school logo as icon
    badge: '/logo.png', // Use the school logo as badge
    tag: 'school-notification', // Group notifications with same tag
    renotify: true,
    requireInteraction: true, // Keep notification visible until user interacts
  };

  // Create and show notification
  const notification = new Notification(title, options);

  // Add click handler to redirect to the specified URL
  if (url) {
    notification.onclick = () => {
      // Open the URL in a new tab
      window.open(url, '_blank');
      notification.close();
    };
  }

  // Close notification after 10 seconds if not clicked
  setTimeout(() => {
    notification.close();
  }, 10000);
};

// Send notification for notices
export const sendNoticeNotification = async (action, noticeTitle) => {
  let title, message, url;

    if (action === 'add') {
        title = '📢 New Notice';
        message = `${noticeTitle} has been added to the Notice Board. Check out now.`;
        url = '/';
    } else if (action === 'update') {
        title = '✏️ Notice Updated';
        message = `${noticeTitle} has been updated. Please review the latest information.`;
        url = '/';
    } else {
        return; // Invalid action
    }

  await sendWebNotification(title, message, url);
};

// Send notification for important dates
export const sendImportantDateNotification = async (action, eventName) => {
  let title, message, url;

  if (action === 'add') {
    title = '📅 New Important Date';
    message = `${eventName} has been added to the Important Dates. Don’t miss it!`;
    url = '/admission';
  } else if (action === 'update') {
    title = '📅 Important Date Updated';
    message = `${eventName} details have been updated. Check now.`;
    url = '/admission';
  } else {
    return; // Invalid action
  }

  await sendWebNotification(title, message, url);
};

// Send notification for fee structure
export const sendFeeStructureNotification = async (action) => {
  let title, message, url;

  if (action === 'add') {
    title = '💰 Fee Structure Updated';
    message = 'New fee structure has been published. Please check the details.';
    url = '/admission';
  } else if (action === 'update') {
    title = '💰 Fee Details Updated';
    message = 'Fee structure information has been revised. View the updated fees.';
    url = '/admission';
  } else {
    return; // Invalid action
  }

  await sendWebNotification(title, message, url);
};

// Send notification for staff
export const sendStaffNotification = async (action, staffName) => {
  let title, message, url;

  if (action === 'add') {
    title = '👩‍🏫 New Staff Member';
    message = `${staffName} has joined our school staff. Welcome aboard!`;
    url = '/staff';
  } else if (action === 'update') {
    title = '👩‍🏫 Staff Information Updated';
    message = `Staff profile for ${staffName} has been updated.`;
    url = '/staff';
  } else {
    return; // Invalid action
  }

  await sendWebNotification(title, message, url);
};

// Send notification for gallery
export const sendGalleryNotification = async (action) => {
  let title, message, url;

  if (action === 'add') {
    title = '🖼️ New Photos Added';
    message = 'New photos have been added to the school gallery. Take a look!';
    url = '/gallery';
  } else if (action === 'update') {
    title = '🖼️ Gallery Updated';
    message = 'Gallery content has been updated with new changes.';
    url = '/gallery';
  } else {
    return; // Invalid action
  }

  await sendWebNotification(title, message, url);
};