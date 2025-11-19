import React, { useState, useEffect } from 'react';
import { 
  ShareIcon, 
  CalendarDaysIcon, 
  LinkIcon, 
  DocumentDuplicateIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon
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
      const googleCalUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(icalUrl)}`;
      const outlookUrl = `https://outlook.live.com/owa/?path=/calendar/action/compose&rru=addsubscription&url=${encodeURIComponent(icalUrl)}&name=${encodeURIComponent(calendarName)}`;
      const appleUrl = `webcal://${icalUrl.replace('http://', '').replace('https://', '')}`;

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

  // Copy link to clipboard
  const copyToClipboard = async (url, type) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(type);
      setTimeout(() => setCopiedLink(''), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
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
      icon: '📅',
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Subscribe in Google Calendar'
    },
    {
      name: 'Outlook',
      key: 'outlook', 
      icon: '📧',
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'Subscribe in Outlook'
    },
    {
      name: 'Apple Calendar',
      key: 'apple',
      icon: '🍎',
      color: 'bg-gray-800 hover:bg-gray-900',
      description: 'Subscribe in Apple Calendar'
    },
    {
      name: 'iCal Feed',
      key: 'ical',
      icon: '📋',
      color: 'bg-green-600 hover:bg-green-700',
      description: 'Direct iCal feed URL'
    }
  ];

  return (
    <div className="calendar-share-section">
      {/* Header with toggle */}
      <div className="share-section-header">
        <div className="share-section-title">
          <div className="share-section-icon">
            <ShareIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div className="share-section-text">
            <h3 className="share-section-heading">Subscribe to Calendar</h3>
            <p className="share-section-subtitle">
              Get automatic updates in your preferred calendar app
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
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
            <div key={option.key} className="share-quick-option">
              <a
                href={shareLinks[option.key]}
                target="_blank"
                rel="noopener noreferrer"
                className={`share-quick-btn ${option.color}`}
                disabled={loading || !shareLinks[option.key]}
                title={`Subscribe to ${calendarName} in ${option.name}`}
              >
                <span className="share-quick-icon">{option.icon}</span>
                <span className="share-quick-name">{option.name}</span>
                <LinkIcon className="h-4 w-4 share-quick-link-icon" />
              </a>
              <button
                onClick={() => copyToClipboard(shareLinks[option.key], option.key)}
                className="share-quick-copy"
                disabled={loading || !shareLinks[option.key]}
                title={`Copy ${option.name} link`}
              >
                {copiedLink === option.key ? (
                  <CheckIcon className="h-4 w-4 text-green-600" />
                ) : (
                  <DocumentDuplicateIcon className="h-4 w-4" />
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
                  <CheckIcon className="h-4 w-4 text-green-600" />
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
              <span className="share-info-icon">🔄</span>
              <strong>Auto-sync:</strong> Events update automatically
            </div>
            <div className="share-info-item">
              <span className="share-info-icon">🔒</span>
              <strong>Privacy:</strong> Only public events included
            </div>
            <div className="share-info-item">
              <span className="share-info-icon">📱</span>
              <strong>Compatible:</strong> Works with all major calendar apps
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