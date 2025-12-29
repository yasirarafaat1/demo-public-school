import React, { useState } from 'react';
import { Button, Dropdown, Toast } from 'react-bootstrap';
import { 
  FaEllipsisV, 
  FaWhatsapp, 
  FaFacebook, 
  FaTwitter, 
  FaEnvelope, 
  FaLink, 
  FaCopy,
  FaShare
} from 'react-icons/fa';
import {
  shareOnWhatsApp,
  shareOnFacebook,
  shareOnTwitter,
  shareViaEmail,
  copyNoticeLink,
  copyNoticeText,
  shareUsingWebShareAPI,
  isWebShareAPISupported
} from '../../services/shareService';

const ShareButton = ({ notice, size = 'sm', variant = 'outline-primary', className = '' }) => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');

  const showToastMessage = (message, variant = 'success') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleShare = async (shareMethod) => {
    try {
      switch (shareMethod) {
        case 'webshare':
          const success = await shareUsingWebShareAPI(notice);
          if (!success) {
            showToastMessage('Sharing not supported on this device', 'warning');
          }
          break;
        
        case 'whatsapp':
          shareOnWhatsApp(notice);
          break;
        
        case 'facebook':
          shareOnFacebook(notice);
          break;
        
        case 'twitter':
          shareOnTwitter(notice);
          break;
        
        case 'email':
          shareViaEmail(notice);
          break;
        
        case 'copylink':
          const linkCopied = await copyNoticeLink(notice);
          if (linkCopied) {
            showToastMessage('Link copied to clipboard!', 'success');
          } else {
            showToastMessage('Failed to copy link', 'danger');
          }
          break;
        
        case 'copytext':
          const textCopied = await copyNoticeText(notice);
          if (textCopied) {
            showToastMessage('Notice text copied to clipboard!', 'success');
          } else {
            showToastMessage('Failed to copy text', 'danger');
          }
          break;
        
        default:
          break;
      }
    } catch (error) {
      console.error('Share error:', error);
      showToastMessage('Sharing failed', 'danger');
    }
  };

  const renderShareItems = () => {
    const items = [];

    // Web Share API (native share) - prioritized if available
    if (isWebShareAPISupported()) {
      items.push(
        <Dropdown.Item key="webshare" onClick={() => handleShare('webshare')}>
          <FaShare className="me-2" />
          Share
        </Dropdown.Item>
      );
    }

    // Social media platforms
    // items.push(
    //   <Dropdown.Item key="whatsapp" onClick={() => handleShare('whatsapp')}>
    //     <FaWhatsapp className="me-2 text-success" />
    //     WhatsApp
    //   </Dropdown.Item>,
    //   <Dropdown.Item key="facebook" onClick={() => handleShare('facebook')}>
    //     <FaFacebook className="me-2 text-primary" />
    //     Facebook
    //   </Dropdown.Item>,
    //   <Dropdown.Item key="twitter" onClick={() => handleShare('twitter')}>
    //     <FaTwitter className="me-2 text-info" />
    //     Twitter
    //   </Dropdown.Item>,
    //   <Dropdown.Item key="email" onClick={() => handleShare('email')}>
    //     <FaEnvelope className="me-2 text-secondary" />
    //     Email
    //   </Dropdown.Item>
    // );

    // Copy options
    // items.push(
    //   <Dropdown.Divider key="divider" />,
    //   <Dropdown.Item key="copylink" onClick={() => handleShare('copylink')}>
    //     <FaLink className="me-2" />
    //     Copy Link
    //   </Dropdown.Item>,
    //   <Dropdown.Item key="copytext" onClick={() => handleShare('copytext')}>
    //     <FaCopy className="me-2" />
    //     Copy Text
    //   </Dropdown.Item>
    // );

    return items;
  };

  return (
    <>
      <Dropdown drop="start">
        <Dropdown.Toggle
          variant={variant}
          size={size}
          className={`d-flex align-items-center ${className}`}
          id={`share-dropdown-${notice.id}`}
          style={{ 
            padding: '0.25rem 0.5rem',
            border: 'none',
            background: 'transparent',
            minWidth: 'auto'
          }}
        >
          <FaEllipsisV />
        </Dropdown.Toggle>
        
        <Dropdown.Menu>
          {/* <Dropdown.Header>
            <FaShare className="me-2" />
            Share Notice
          </Dropdown.Header> */}
          {renderShareItems()}
        </Dropdown.Menu>
      </Dropdown>

      {/* Toast for feedback */}
      <Toast
        show={showToast}
        onClose={() => setShowToast(false)}
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          minWidth: '250px'
        }}
        bg={toastVariant}
        text={toastVariant === 'light' ? 'dark' : 'white'}
      >
        <Toast.Header closeButton={false}>
          <strong className="me-auto">Share Status</strong>
        </Toast.Header>
        <Toast.Body>
          {toastMessage}
        </Toast.Body>
      </Toast>
    </>
  );
};

export default ShareButton;
