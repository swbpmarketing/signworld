import React, { useState, useRef, useEffect, useCallback } from 'react';
import api from '../../config/axios';

interface MentionUser {
  _id: string;
  name: string;
  profileImage?: string;
  role: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  autoFocus?: boolean;
  disabled?: boolean;
}

const MENTION_REGEX = /@\[([^\]]+)\]\(([a-f0-9]{24})\)/g;

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Convert storage format `@[Name](id)` → display format `@Name`, returning a name→id map */
function toDisplay(text: string): { display: string; map: Map<string, string> } {
  const map = new Map<string, string>();
  const display = text.replace(new RegExp(MENTION_REGEX.source, 'g'), (_, name, id) => {
    map.set(name, id);
    return `@${name}`;
  });
  return { display, map };
}

/** Convert display format `@Name` → storage format `@[Name](id)` using the name→id map */
function toStorage(display: string, map: Map<string, string>): string {
  let result = display;
  // Sort by name length descending so "John Smith" matches before "John"
  const entries = Array.from(map.entries()).sort((a, b) => b[0].length - a[0].length);
  for (const [name, id] of entries) {
    const pattern = new RegExp('@' + escapeRegex(name) + '(?=\\s|$|[.,!?;:)])', 'g');
    result = result.replace(pattern, `@[${name}](${id})`);
  }
  return result;
}

const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onKeyDown,
  placeholder,
  className,
  rows = 1,
  autoFocus = false,
  disabled = false,
}) => {
  const [displayText, setDisplayText] = useState('');
  const mentionMap = useRef(new Map<string, string>());
  const internalChange = useRef(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<MentionUser[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync from parent value prop (only when change is external)
  useEffect(() => {
    if (internalChange.current) {
      internalChange.current = false;
      return;
    }
    const { display, map } = toDisplay(value);
    setDisplayText(display);
    // Merge new map entries (preserve existing ones from this session)
    for (const [name, id] of map) {
      mentionMap.current.set(name, id);
    }
  }, [value]);

  const fetchUsers = useCallback(async (q: string) => {
    try {
      const { data } = await api.get('/users/search/mention', { params: { q, limit: 10 } });
      if (data.success) {
        setUsers(data.data);
        setSelectedIndex(0);
      }
    } catch {
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    if (!showDropdown) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(query), 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, showDropdown, fetchUsers]);

  const detectMention = (textarea: HTMLTextAreaElement) => {
    const cursorPos = textarea.selectionStart;
    const textBefore = displayText.slice(0, cursorPos);
    const atIndex = textBefore.lastIndexOf('@');
    if (atIndex === -1) {
      setShowDropdown(false);
      return;
    }
    // @ must be at start or preceded by whitespace
    if (atIndex > 0 && !/\s/.test(textBefore[atIndex - 1])) {
      setShowDropdown(false);
      return;
    }
    const queryText = textBefore.slice(atIndex + 1);
    if (queryText.includes('\n')) {
      setShowDropdown(false);
      return;
    }
    // Don't trigger dropdown if this @ is part of an already-completed mention
    const knownNames = Array.from(mentionMap.current.keys());
    const isExistingMention = knownNames.some(name => queryText === name || queryText.startsWith(name + ' '));
    if (isExistingMention) {
      setShowDropdown(false);
      return;
    }
    setMentionStart(atIndex);
    setQuery(queryText);
    setShowDropdown(true);
  };

  const insertMention = (user: MentionUser) => {
    if (mentionStart === null) return;
    const textarea = textareaRef.current;
    const cursorPos = textarea?.selectionStart ?? displayText.length;
    const before = displayText.slice(0, mentionStart);
    const after = displayText.slice(cursorPos);
    const displayMention = `@${user.name} `;
    const newDisplay = before + displayMention + after;

    // Add to mention map
    mentionMap.current.set(user.name, user._id);

    setDisplayText(newDisplay);
    internalChange.current = true;
    onChange(toStorage(newDisplay, mentionMap.current));
    setShowDropdown(false);
    setUsers([]);

    // Restore focus and cursor
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const newPos = before.length + displayMention.length;
        textarea.selectionStart = newPos;
        textarea.selectionEnd = newPos;
      }
    }, 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newDisplay = e.target.value;
    setDisplayText(newDisplay);
    internalChange.current = true;
    onChange(toStorage(newDisplay, mentionMap.current));
    setTimeout(() => {
      if (textareaRef.current) detectMention(textareaRef.current);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showDropdown && users.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % users.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        insertMention(users[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowDropdown(false);
        return;
      }
    }
    onKeyDown?.(e);
  };

  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 200);
  };

  const roleLabel = (role: string) => {
    const labels: Record<string, string> = { admin: 'Admin', owner: 'Owner', vendor: 'Vendor' };
    return labels[role] || role;
  };

  return (
    <div className="relative flex-1 min-w-0">
      <textarea
        ref={textareaRef}
        value={displayText}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full ${className || ''}`}
        rows={rows}
        autoFocus={autoFocus}
        disabled={disabled}
        style={rows === 1 ? { resize: 'none', overflow: 'hidden' } : { resize: 'none' }}
      />
      {showDropdown && users.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-0 mb-2 w-72 max-h-56 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl ring-1 ring-black/5 dark:ring-white/5 z-50 py-1"
        >
          <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Mention someone
          </div>
          {users.map((user, index) => (
            <button
              key={user._id}
              type="button"
              className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                index === selectedIndex
                  ? 'bg-primary-50 dark:bg-primary-600/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                insertMention(user);
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-2 ring-white dark:ring-gray-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0 ring-2 ring-white dark:ring-gray-700">
                  <span className="text-xs font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className={`font-medium truncate ${
                  index === selectedIndex
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-gray-800 dark:text-gray-200'
                }`}>{user.name}</div>
                <div className="text-xs text-gray-400 dark:text-gray-500">{roleLabel(user.role)}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput;
