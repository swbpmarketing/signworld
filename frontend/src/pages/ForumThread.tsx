import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  BookmarkIcon,
  FlagIcon,
  ShareIcon,
  BellIcon,
  EllipsisHorizontalIcon,
  ChatBubbleLeftIcon,
  HeartIcon,
  EyeIcon,
  CalendarIcon,
  TagIcon,
  LockClosedIcon,
  FireIcon,
  PaperClipIcon,
  PhotoIcon,
  FaceSmileIcon,
} from '@heroicons/react/24/outline';
import { 
  BookmarkIcon as BookmarkSolidIcon, 
  HeartIcon as HeartSolidIcon,
  ChevronUpIcon as ChevronUpSolidIcon,
  ChevronDownIcon as ChevronDownSolidIcon,
} from '@heroicons/react/24/solid';

interface Reply {
  id: number;
  author: string;
  authorAvatar: string;
  authorRole: string;
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  votes: number;
  userVote: 'up' | 'down' | null;
  replies?: Reply[];
  attachments?: {
    name: string;
    size: string;
    type: string;
  }[];
}

interface ThreadData {
  id: number;
  title: string;
  author: string;
  authorAvatar: string;
  authorRole: string;
  category: string;
  subcategory?: string;
  createdAt: string;
  lastActivity: string;
  content: string;
  views: number;
  replies: number;
  likes: number;
  isPinned: boolean;
  isLocked: boolean;
  isBookmarked: boolean;
  isSubscribed: boolean;
  tags: string[];
  attachments?: {
    name: string;
    size: string;
    type: string;
  }[];
}

const mockThread: ThreadData = {
  id: 1,
  title: "New vinyl cutting techniques that increased our efficiency by 40%",
  author: "David Martinez",
  authorAvatar: "DM",
  authorRole: "Owner - 5 years",
  category: "Technical Support",
  subcategory: "Equipment",
  createdAt: "January 15, 2024 at 2:30 PM",
  lastActivity: "5 minutes ago",
  content: `Hey everyone! I wanted to share some new techniques we've been using that have dramatically improved our vinyl cutting efficiency.

## The Problem
We were spending way too much time on weeding and application, especially for complex designs. Our team was getting frustrated, and jobs were backing up.

## What We Changed

### 1. **Blade Pressure Optimization**
We created a pressure chart for different vinyl types:
- **Oracal 651**: 120g pressure, 60° blade
- **3M IJ35C**: 100g pressure, 45° blade  
- **Avery Supreme**: 110g pressure, 60° blade

### 2. **Weeding Station Setup**
We built a dedicated weeding station with:
- LED light table (game changer!)
- Ergonomic seating at proper height
- All tools within arm's reach
- Magnifying lamp for detailed work

### 3. **Pre-Cut Preparation**
Before cutting, we now:
- Let vinyl acclimate to room temperature (minimum 2 hours)
- Clean the cutting mat religiously
- Run a test cut on scrap material
- Check blade sharpness every morning

## The Results
- **40% faster weeding time** on average
- **60% reduction in material waste**
- **Team morale improved significantly**
- **Customer complaints about bubbles/lifting down 80%**

## Pro Tips
1. 🎯 Always keep spare blades on hand - change them more often than you think
2. 🌡️ Temperature matters! Keep your workspace between 65-75°F
3. 📐 Use a weeding box technique for intricate designs
4. 💡 Good lighting is worth the investment

Happy to answer any questions about our setup or techniques. What efficiency improvements have you guys discovered?

**Edit**: Wow, thanks for all the responses! I'll try to answer everyone's questions below.`,
  views: 1234,
  replies: 45,
  likes: 89,
  isPinned: true,
  isLocked: false,
  isBookmarked: false,
  isSubscribed: true,
  tags: ["vinyl", "efficiency", "tips", "equipment"],
  attachments: [
    { name: "pressure-chart.pdf", size: "245 KB", type: "pdf" },
    { name: "weeding-station-setup.jpg", size: "1.2 MB", type: "image" }
  ]
};

const mockReplies: Reply[] = [
  {
    id: 1,
    author: "Sarah Chen",
    authorAvatar: "SC",
    authorRole: "Owner - 8 years",
    content: `This is fantastic, David! We've been struggling with the same issues. The LED light table tip is gold - just ordered one.

Question about the blade pressure: do you adjust for different thicknesses of the same vinyl brand? We use a lot of Oracal 651 but in different mil thicknesses.`,
    createdAt: "3 hours ago",
    likes: 12,
    isLiked: false,
    votes: 8,
    userVote: null,
    replies: [
      {
        id: 2,
        author: "David Martinez",
        authorAvatar: "DM",
        authorRole: "Owner - 5 years",
        content: `Great question, Sarah! Yes, we definitely adjust:
- 2.5 mil: 120g
- 3.2 mil: 130g
- 4 mil: 140-150g

The key is doing test cuts. We keep a binder with samples and settings for quick reference.`,
        createdAt: "2 hours ago",
        likes: 8,
        isLiked: true,
        votes: 5,
        userVote: 'up'
      }
    ]
  },
  {
    id: 3,
    author: "Mike Johnson",
    authorAvatar: "MJ",
    authorRole: "Production Manager - 3 years",
    content: `The weeding box technique you mentioned - can you elaborate? We're always looking for ways to handle intricate designs better.

Also, what brand of LED light table did you go with? There are so many options out there.`,
    createdAt: "2 hours ago",
    likes: 6,
    isLiked: false,
    votes: 4,
    userVote: null
  },
  {
    id: 4,
    author: "Lisa Thompson",
    authorAvatar: "LT",
    authorRole: "Owner - 10 years",
    content: `This is why I love this community! 🙌

We implemented something similar last year and saw huge improvements. One thing to add: we also started using a vinyl storage system with humidity control. Made a big difference in consistency.

For anyone on the fence about investing in better equipment - DO IT. The ROI is real.`,
    createdAt: "1 hour ago",
    likes: 15,
    isLiked: true,
    votes: 12,
    userVote: 'up',
    attachments: [
      { name: "storage-system.jpg", size: "890 KB", type: "image" }
    ]
  }
];

const ForumThread = () => {
  const { id } = useParams<{ id: string }>();
  const [thread] = useState<ThreadData>(mockThread);
  const [replies] = useState<Reply[]>(mockReplies);
  const [replyContent, setReplyContent] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'popular'>('oldest');
  const [expandedReplies, setExpandedReplies] = useState<number[]>([]);

  const handleVote = (replyId: number, voteType: 'up' | 'down') => {
    console.log('Voting', voteType, 'on reply', replyId);
  };

  const toggleReplyExpansion = (replyId: number) => {
    setExpandedReplies(prev => 
      prev.includes(replyId) 
        ? prev.filter(id => id !== replyId)
        : [...prev, replyId]
    );
  };

  const renderReply = (reply: Reply, level: number = 0) => (
    <div key={reply.id} className={`${level > 0 ? 'ml-12 mt-4' : ''}`}>
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
            {reply.authorAvatar}
          </div>
        </div>
        <div className="flex-1">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">{reply.author}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{reply.authorRole}</span>
                <span className="text-sm text-gray-400 ml-2">• {reply.createdAt}</span>
              </div>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <EllipsisHorizontalIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="text-gray-700 dark:text-gray-300 prose prose-sm max-w-none">
              {reply.content.split('\n').map((paragraph, idx) => (
                <p key={idx} className="mb-2">{paragraph}</p>
              ))}
            </div>
            {reply.attachments && reply.attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {reply.attachments.map((attachment, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 text-sm">
                    {attachment.type === 'image' ? (
                      <PhotoIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <PaperClipIcon className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-gray-700 dark:text-gray-300">{attachment.name}</span>
                    <span className="text-gray-400 text-xs">({attachment.size})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleVote(reply.id, 'up')}
                className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${reply.userVote === 'up' ? 'text-primary-600' : 'text-gray-400'}`}
              >
                {reply.userVote === 'up' ? <ChevronUpSolidIcon className="h-5 w-5" /> : <ChevronUpIcon className="h-5 w-5" />}
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{reply.votes}</span>
              <button
                onClick={() => handleVote(reply.id, 'down')}
                className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${reply.userVote === 'down' ? 'text-primary-600' : 'text-gray-400'}`}
              >
                {reply.userVote === 'down' ? <ChevronDownSolidIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
              </button>
            </div>
            <button className={`flex items-center gap-1.5 text-sm ${reply.isLiked ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'} hover:text-red-500`}>
              {reply.isLiked ? <HeartSolidIcon className="h-4 w-4" /> : <HeartIcon className="h-4 w-4" />}
              <span>{reply.likes}</span>
            </button>
            <button className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
              <ChatBubbleLeftIcon className="h-4 w-4" />
              Reply
            </button>
            <button className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              <ShareIcon className="h-4 w-4" />
              Share
            </button>
          </div>
          {reply.replies && reply.replies.length > 0 && (
            <div className="mt-4">
              {reply.replies.map(childReply => renderReply(childReply, level + 1))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link to="/forum" className="hover:text-primary-600">Forum</Link>
        <ChevronLeftIcon className="h-4 w-4 rotate-180" />
        <Link to="/forum" className="hover:text-primary-600">{thread.category}</Link>
        {thread.subcategory && (
          <>
            <ChevronLeftIcon className="h-4 w-4 rotate-180" />
            <span>{thread.subcategory}</span>
          </>
        )}
      </div>

      {/* Thread Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {thread.isPinned && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium rounded-full">
                  <FireIcon className="h-3 w-3" />
                  Pinned
                </span>
              )}
              {thread.isLocked && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-full">
                  <LockClosedIcon className="h-3 w-3" />
                  Locked
                </span>
              )}
              <span className="inline-flex items-center px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-medium rounded-full">
                {thread.category}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{thread.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                  {thread.authorAvatar}
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-300">{thread.author}</span>
                <span>{thread.authorRole}</span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                <span>{thread.createdAt}</span>
              </div>
              <div className="flex items-center gap-1">
                <EyeIcon className="h-4 w-4" />
                <span>{thread.views.toLocaleString()} views</span>
              </div>
              <div className="flex items-center gap-1">
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                <span>{thread.replies} replies</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className={`p-2 rounded-lg border ${thread.isBookmarked ? 'border-primary-500 text-primary-600 bg-primary-50 dark:bg-primary-900/30' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              {thread.isBookmarked ? <BookmarkSolidIcon className="h-5 w-5" /> : <BookmarkIcon className="h-5 w-5" />}
            </button>
            <button className={`p-2 rounded-lg border ${thread.isSubscribed ? 'border-primary-500 text-primary-600 bg-primary-50 dark:bg-primary-900/30' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <BellIcon className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">
              <FlagIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Thread Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="prose prose-lg max-w-none">
          {thread.content.split('\n').map((paragraph, idx) => {
            if (paragraph.startsWith('##')) {
              return <h2 key={idx} className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-3">{paragraph.replace('## ', '')}</h2>;
            } else if (paragraph.startsWith('###')) {
              return <h3 key={idx} className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">{paragraph.replace('### ', '')}</h3>;
            } else if (paragraph.startsWith('-')) {
              return <li key={idx} className="ml-6 mb-1 text-gray-700 dark:text-gray-300">{paragraph.replace('- ', '')}</li>;
            } else if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
              return <p key={idx} className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{paragraph.replace(/\*\*/g, '')}</p>;
            } else if (paragraph.match(/^\d+\./)) {
              return <li key={idx} className="ml-6 mb-1 list-decimal text-gray-700 dark:text-gray-300">{paragraph.replace(/^\d+\.\s*/, '')}</li>;
            }
            return <p key={idx} className="mb-4 text-gray-700 dark:text-gray-300">{paragraph}</p>;
          })}
        </div>

        {thread.attachments && thread.attachments.length > 0 && (
          <div className="mt-6 pt-6 border-t dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Attachments</h4>
            <div className="flex flex-wrap gap-3">
              {thread.attachments.map((attachment, idx) => (
                <button key={idx} className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  {attachment.type === 'image' ? (
                    <PhotoIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <PaperClipIcon className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{attachment.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">({attachment.size})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {thread.tags && thread.tags.length > 0 && (
          <div className="mt-6 pt-6 border-t dark:border-gray-700">
            <div className="flex items-center gap-2 flex-wrap">
              <TagIcon className="h-4 w-4 text-gray-400" />
              {thread.tags.map(tag => (
                <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Replies Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{thread.replies} Replies</h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="oldest">Oldest First</option>
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {replies.map(reply => renderReply(reply))}
        </div>
      </div>

      {/* Reply Box */}
      {!thread.isLocked && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          {!showReplyBox ? (
            <button
              onClick={() => setShowReplyBox(true)}
              className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              Write a reply...
            </button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                  YO
                </div>
                <div className="flex-1">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="w-full min-h-[120px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none dark:bg-gray-700 dark:text-gray-100"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <PaperClipIcon className="h-5 w-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <PhotoIcon className="h-5 w-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <FaceSmileIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setShowReplyBox(false);
                          setReplyContent('');
                        }}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={!replyContent.trim()}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Post Reply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ForumThread;