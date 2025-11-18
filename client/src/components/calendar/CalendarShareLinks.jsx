import React, { useState, useEffect } from 'react';
import { 
  ShareIcon, 
  CalendarDaysIcon, 
  LinkIcon, 
  DocumentDuplicateIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import './CalendarShareLinks.css';

const CalendarShareLinks = ({ 
  events = [], 
  calendarName = "Sign Company Calendar",
  onShareLinkGenerated = null,
  compact = false 
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
  const [showSharePanel, setShowSharePanel] = useState(false);

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
      description: 'Subscribe to calendar in Google Calendar'
    },
    {
      name: 'Outlook',
      key: 'outlook', 
      icon: '📧',
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'Subscribe to calendar in Outlook'
    },
    {
      name: 'Apple Calendar',
      key: 'apple',
      icon: '🍎',
      color: 'bg-gray-800 hover:bg-gray-900',
      description: 'Subscribe to calendar in Apple Calendar'
    },
    {
      name: 'iCal Feed',
      key: 'ical',
      icon: '📋',
      color: 'bg-green-600 hover:bg-green-700',
      description: 'Direct iCal feed URL for any calendar app'
    }
  ];

  if (compact) {
    return (
      <div className="calendar-share-compact">
        <button
          onClick={() => setShowSharePanel(!showSharePanel)}
          className="share-toggle-btn"
          disabled={loading}
        >
          <ShareIcon className="h-4 w-4" />
          Share Calendar
        </button>
        
        {showSharePanel && (
          <div className="share-panel-dropdown">
            {error && (
              <div className="error-message">
                <ExclamationTriangleIcon className="h-4 w-4" />
                {error}
              </div>
            )}
            
            <div className="share-options-compact">
              {shareOptions.map((option) => (
                <div key={option.key} className="share-option-compact">
                  <a
                    href={shareLinks[option.key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`share-link-compact ${option.color}`}
                    disabled={loading || !shareLinks[option.key]}
                  >
                    <span className="share-icon">{option.icon}</span>
                    {option.name}
                  </a>
                  <button
                    onClick={() => copyToClipboard(shareLinks[option.key], option.key)}
                    className="copy-btn-compact"
                    disabled={loading || !shareLinks[option.key]}
                  >
                    {copiedLink === option.key ? (
                      <CheckIcon className="h-3 w-3 text-green-600" />
                    ) : (
                      <DocumentDuplicateIcon className="h-3 w-3" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="calendar-share-links">
      <div className="share-header">
        <div className="share-title">
          <CalendarDaysIcon className="h-5 w-5 text-primary-600" />
          <h3>Share Calendar</h3>
        </div>
        <p className="share-description">
          Subscribe to the {calendarName} and get automatic updates in your preferred calendar app.
        </p>
      </div>

      {error && (
        <div className="error-banner">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <span>{error}</span>
          <button onClick={generateShareLinks} className="retry-btn">
            Try Again
          </button>
        </div>
      )}

      <div className="share-options">
        {shareOptions.map((option) => (
          <div key={option.key} className="share-option">
            <div className="share-option-header">
              <div className="share-option-info">
                <span className="share-option-icon">{option.icon}</span>
                <div>
                  <h4 className="share-option-name">{option.name}</h4>
                  <p className="share-option-description">{option.description}</p>
                </div>
              </div>
            </div>
            
            <div className="share-option-actions">
              <a
                href={shareLinks[option.key]}
                target="_blank"
                rel="noopener noreferrer"
                className={`share-btn ${option.color}`}
                disabled={loading || !shareLinks[option.key]}
              >
                <LinkIcon className="h-4 w-4" />
                Subscribe
              </a>
              
              <button
                onClick={() => copyToClipboard(shareLinks[option.key], option.key)}
                className="copy-btn"
                disabled={loading || !shareLinks[option.key]}
                title="Copy link to clipboard"
              >
                {copiedLink === option.key ? (
                  <>
                    <CheckIcon className="h-4 w-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <DocumentDuplicateIcon className="h-4 w-4" />
                    Copy
                  </>
                )}
              </button>
            </div>

            {option.key === 'ical' && shareLinks.ical && (
              <div className="ical-url-display">
                <label className="ical-label">Direct URL:</label>
                <div className="ical-url-container">
                  <input
                    type="text"
                    value={shareLinks.ical}
                    readOnly
                    className="ical-url-input"
                  />
                  <button
                    onClick={() => copyToClipboard(shareLinks.ical, 'ical-url')}
                    className="ical-copy-btn"
                  >
                    {copiedLink === 'ical-url' ? (
                      <CheckIcon className="h-4 w-4 text-green-600" />
                    ) : (
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="share-info">
        <div className="info-item">
          <strong>Automatic Updates:</strong> Your calendar will automatically sync with new events and changes.
        </div>
        <div className="info-item">
          <strong>Privacy:</strong> Only public events are included in the shared calendar feed.
        </div>
        <div className="info-item">
          <strong>Compatibility:</strong> Works with Google Calendar, Outlook, Apple Calendar, and any iCal-compatible app.
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <span>Generating share links...</span>
        </div>
      )}
    </div>
  );
};

export default CalendarShareLinks;