import React, { useState, useEffect } from 'react';
import {
  ShareIcon,
  CalendarDaysIcon,
  LinkIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ArrowPathIcon,
  LockClosedIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import './CalendarShareSection.css';

/**
 * Calendar Share Section Component
 * Designed for prominent placement below the calendar with enhanced UX
 */
const CalendarShareSection = ({ 
  events = [], 
  calendarName = "Sign Company Calendar",
  onShareLinkGenerated = null 
}) => {
  const [shareLinks, setShareLinks] = useState({
    ical: '',
    google: '',
    outlook: '',
    apple: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Generate share links
  const generateShareLinks = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Generate iCal feed URL
      const baseUrl = import.meta.env.DEV
        ? 'http://localhost:5000'
        : window.location.origin;
      
      const icalUrl = `${baseUrl}/api/events/calendar.ics`;

      // Generate platform-specific URLs
      // Google Calendar: Use the webcal protocol for better compatibility
      const googleCalUrl = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(icalUrl)}`;
      const outlookUrl = `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(icalUrl)}&name=${encodeURIComponent(calendarName)}`;
      const appleUrl = `webcal://${icalUrl.replace('https://', '').replace('http://', '')}`;

      const links = {
        ical: icalUrl,
        google: googleCalUrl,
        outlook: outlookUrl,
        apple: appleUrl
      };

      setShareLinks(links);
      
      if (onShareLinkGenerated) {
        onShareLinkGenerated(links);
      }
    } catch (err) {
      setError('Failed to generate share links. Please try again.');
      console.error('Share link generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Copy link to clipboard and open calendar service
  const copyToClipboard = async (url, type) => {
    try {
      // Copy the iCal URL (not the service-specific URL)
      await navigator.clipboard.writeText(shareLinks.ical);
      setCopiedLink(type);
      setTimeout(() => setCopiedLink(''), 2000);

      // Show toast notification
      if (type === 'google') {
        // Open Google Calendar settings page where they can paste the URL
        window.open('https://calendar.google.com/calendar/u/0/r/settings/addbyurl', '_blank');
      } else if (type === 'outlook') {
        // Outlook should work with direct URL
        window.open(url, '_blank');
      } else if (type === 'apple') {
        // Apple Calendar will prompt when clicking webcal:// link
        window.location.href = url;
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareLinks.ical;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedLink(type);
      setTimeout(() => setCopiedLink(''), 2000);
    }
  };

  // Initialize share links on component mount
  useEffect(() => {
    generateShareLinks();
  }, [events, calendarName]);

  const shareOptions = [
    {
      name: 'Google Calendar',
      key: 'google',
      icon: CalendarDaysIcon,
      iconColor: 'text-blue-600 dark:text-blue-400',
      description: 'Subscribe in Google Calendar'
    },
    {
      name: 'Outlook',
      key: 'outlook',
      icon: EnvelopeIcon,
      iconColor: 'text-blue-700 dark:text-blue-500',
      description: 'Subscribe in Outlook'
    },
    {
      name: 'Apple Calendar',
      key: 'apple',
      icon: CalendarDaysIcon,
      iconColor: 'text-gray-700 dark:text-gray-300',
      description: 'Subscribe in Apple Calendar'
    },
    {
      name: 'iCal Feed',
      key: 'ical',
      icon: DocumentTextIcon,
      iconColor: 'text-green-600 dark:text-green-400',
      description: 'Direct iCal feed URL'
    }
  ];

  return (
    <div className="calendar-share-section">
      {/* Header with toggle */}
      <div
        className="share-section-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="share-section-title">
          <div className="share-section-icon">
            <ShareIcon className="h-5 w-5" />
          </div>
          <div className="share-section-text">
            <h3 className="share-section-heading">Subscribe to Calendar</h3>
            <p className="share-section-subtitle">
              Get automatic updates in your preferred calendar app
            </p>
          </div>
        </div>
        <button
          className="share-section-toggle"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Hide calendar sharing options' : 'Show calendar sharing options'}
        >
          {isExpanded ? (
            <ChevronUpIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Expandable content */}
      <div className={`share-section-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
        {error && (
          <div className="share-section-error">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span>{error}</span>
            <button onClick={generateShareLinks} className="error-retry-btn">
              Try Again
            </button>
          </div>
        )}

        {/* Quick action buttons */}
        <div className="share-quick-actions">
          {shareOptions.map((option) => (
            <div key={option.key} className="share-quick-card">
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  await copyToClipboard(shareLinks[option.key], option.key);
                }}
                disabled={loading || !shareLinks[option.key]}
                className="share-quick-btn"
                title={option.key === 'google' ? 'Copy URL and open Google Calendar settings' : `Subscribe to ${calendarName} in ${option.name}`}
              >
                <div className="share-btn-content">
                  <div className="share-quick-icon">
                    <option.icon className={`h-5 w-5 ${option.iconColor}`} />
                  </div>
                  <div className="share-btn-text">
                    <span className="share-quick-name">{option.name}</span>
                    <span className="share-quick-desc">
                      {option.key === 'google' ? 'Copy URL & open settings' : option.description}
                    </span>
                  </div>
                </div>
                {copiedLink === option.key ? (
                  <CheckIcon className="h-4 w-4 share-quick-link-icon text-green-500" />
                ) : (
                  <LinkIcon className="h-4 w-4 share-quick-link-icon" />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Direct iCal URL */}
        {shareLinks.ical && (
          <div className="share-ical-section">
            <label className="share-ical-label">
              <CalendarDaysIcon className="h-4 w-4" />
              Direct Calendar Feed URL
            </label>
            <div className="share-ical-container">
              <input
                type="text"
                value={shareLinks.ical}
                readOnly
                className="share-ical-input"
                placeholder="Loading calendar feed URL..."
              />
              <button
                onClick={() => copyToClipboard(shareLinks.ical, 'ical-direct')}
                className="share-ical-copy"
                title="Copy calendar feed URL"
              >
                {copiedLink === 'ical-direct' ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <DocumentDuplicateIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Information */}
        <div className="share-section-info">
          <div className="share-info-grid">
            <div className="share-info-item">
              <div className="share-info-icon-wrapper">
                <ArrowPathIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="share-info-content">
                <strong>Auto-sync</strong>
                <span>Events update automatically</span>
              </div>
            </div>
            <div className="share-info-item">
              <div className="share-info-icon-wrapper">
                <LockClosedIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="share-info-content">
                <strong>Privacy</strong>
                <span>Only public events included</span>
              </div>
            </div>
            <div className="share-info-item">
              <div className="share-info-icon-wrapper">
                <DevicePhoneMobileIcon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="share-info-content">
                <strong>Compatible</strong>
                <span>Works with all major calendar apps</span>
              </div>
            </div>
          </div>
        </div>

        {loading && (
          <div className="share-section-loading">
            <div className="loading-spinner-section"></div>
            <span>Generating share links...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarShareSection;