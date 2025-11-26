# Success Stories (Brags) API Documentation

## Base URL
```
http://localhost:5000/api/brags
```

## Endpoints Overview

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | Public | Get all published success stories |
| GET | `/:id` | Public | Get single success story |
| POST | `/` | Private | Create new success story |
| PUT | `/:id` | Private | Update success story |
| DELETE | `/:id` | Private | Delete success story |
| POST | `/:id/like` | Private | Like/Unlike story |
| POST | `/:id/comment` | Private | Add comment |
| DELETE | `/:id/comment/:commentId` | Private | Delete comment |
| PUT | `/:id/moderate` | Admin | Approve/Reject story |
| GET | `/admin/stats` | Admin | Get statistics |
| GET | `/user/my-stories` | Private | Get user's stories |

---

## Detailed Endpoints

### 1. Get All Success Stories
**GET** `/api/brags`

**Access:** Public (only shows published stories)

**Query Parameters:**
- `page` (number, default: 1) - Page number for pagination
- `limit` (number, default: 10) - Items per page
- `sort` (string) - Sort order: `popular`, `likes`, `views`, `oldest`, or default (newest)
- `search` (string) - Search in title and content
- `tag` (string) - Filter by tag
- `author` (string) - Filter by author ID
- `status` (string, admin only) - Filter by status: `all`, `pending`, `approved`, `rejected`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "story_id",
      "title": "Success Story Title",
      "content": "Story content...",
      "author": {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "location": "Phoenix, AZ",
        "company": "ABC Signs"
      },
      "tags": ["growth", "innovation"],
      "featuredImage": "https://s3.amazonaws.com/...",
      "images": [
        {
          "url": "https://s3.amazonaws.com/...",
          "caption": "Image caption"
        }
      ],
      "likes": ["user_id_1", "user_id_2"],
      "likesCount": 25,
      "comments": [...],
      "commentsCount": 10,
      "views": 150,
      "isPublished": true,
      "status": "approved",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-16T12:00:00.000Z",
      "publishedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 156,
    "pages": 16
  }
}
```

---

### 2. Get Single Success Story
**GET** `/api/brags/:id`

**Access:** Public (only published stories, unless you're the author or admin)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "story_id",
    "title": "Success Story Title",
    "content": "Full story content...",
    "author": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "likesCount": 25,
    "commentsCount": 10,
    "isLiked": false,
    "views": 151,
    ...
  }
}
```

**Note:** View count is automatically incremented when fetching a published story.

---

### 3. Create New Success Story
**POST** `/api/brags`

**Access:** Private (requires authentication)

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Body (multipart/form-data):**
- `title` (string, required) - Story title (max 100 characters)
- `content` (string, required) - Story content
- `tags` (array/string) - Tags: `sales`, `growth`, `marketing`, `customer-service`, `operations`, `community`, `other`
- `featuredImage` (file) - Featured image (max 10MB)
- `images` (files, max 5) - Additional images (max 10MB each)

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "new_story_id",
    "title": "My Success Story",
    "content": "Story content...",
    "author": {...},
    "status": "pending",
    "isPublished": false,
    ...
  },
  "message": "Success story submitted for review"
}
```

**Note:** New stories are automatically set to `pending` status and require admin approval.

---

### 4. Update Success Story
**PUT** `/api/brags/:id`

**Access:** Private (author or admin only)

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**Body:** Same as create endpoint (all fields optional)

**Response:**
```json
{
  "success": true,
  "data": {...},
  "message": "Success story updated successfully"
}
```

**Note:** If the author (non-admin) edits a published story, it will be reset to `pending` status for re-approval.

---

### 5. Delete Success Story
**DELETE** `/api/brags/:id`

**Access:** Private (author or admin only)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {},
  "message": "Success story deleted successfully"
}
```

---

### 6. Like/Unlike Success Story
**POST** `/api/brags/:id/like`

**Access:** Private (requires authentication)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "likes": 26,
    "isLiked": true
  },
  "message": "Story liked"
}
```

**Note:** Toggles like status. If already liked, it will unlike.

---

### 7. Add Comment
**POST** `/api/brags/:id/comment`

**Access:** Private (requires authentication)

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "text": "Great success story! Very inspiring."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "comment_id",
    "user": {
      "_id": "user_id",
      "name": "Jane Smith",
      "email": "jane@example.com"
    },
    "text": "Great success story! Very inspiring.",
    "createdAt": "2024-01-16T15:30:00.000Z"
  },
  "message": "Comment added successfully"
}
```

---

### 8. Delete Comment
**DELETE** `/api/brags/:id/comment/:commentId`

**Access:** Private (comment author or admin)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {},
  "message": "Comment deleted successfully"
}
```

---

### 9. Moderate Success Story (Admin Only)
**PUT** `/api/brags/:id/moderate`

**Access:** Admin only

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "status": "approved",
  "moderatorNotes": "Great story, approved for publication"
}
```

**Fields:**
- `status` (string, required) - Either `approved` or `rejected`
- `moderatorNotes` (string, optional) - Notes for the author

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "story_id",
    "status": "approved",
    "isPublished": true,
    "moderatorNotes": "Great story, approved for publication",
    "moderatedBy": {...},
    "moderatedAt": "2024-01-16T16:00:00.000Z",
    "publishedAt": "2024-01-16T16:00:00.000Z",
    ...
  },
  "message": "Success story approved"
}
```

---

### 10. Get Statistics (Admin Only)
**GET** `/api/brags/admin/stats`

**Access:** Admin only

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalStories": 156,
    "publishedStories": 142,
    "pendingStories": 12,
    "rejectedStories": 2,
    "totalViews": 45230,
    "totalLikes": 3421,
    "totalComments": 1256,
    "topContributors": [
      {
        "_id": "user_id",
        "name": "John Doe",
        "email": "john@example.com",
        "count": 15
      }
    ]
  }
}
```

---

### 11. Get My Stories
**GET** `/api/brags/user/my-stories`

**Access:** Private (requires authentication)

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "story_id",
      "title": "My Story",
      "status": "pending",
      "isPublished": false,
      "moderatorNotes": "",
      ...
    }
  ]
}
```

**Note:** Returns all stories by the authenticated user, regardless of status.

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Common Error Codes:
- `400` - Bad Request (missing or invalid parameters)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Image Upload Notes

- **Accepted formats:** JPG, PNG, GIF, WebP
- **Max file size:** 10MB per image
- **Featured image:** Single image
- **Gallery images:** Up to 5 images
- **Storage:** AWS S3
- **URLs:** Returned in response after upload

---

## Tags

Available tags for categorizing stories:
- `sales`
- `growth`
- `marketing`
- `customer-service`
- `operations`
- `community`
- `other`

---

## Moderation Workflow

1. User submits a success story → **Status: pending**
2. Admin reviews the story
3. Admin approves → **Status: approved**, **isPublished: true**
4. OR Admin rejects → **Status: rejected**, **isPublished: false**
5. If author edits approved story → Reset to **pending** for re-approval

---

## Best Practices

### For Frontend Integration:
1. Always check `success` field in response
2. Handle pagination for list endpoints
3. Implement optimistic UI updates for likes
4. Show loading states during image uploads
5. Cache story lists when appropriate
6. Implement infinite scroll or "Load More" button

### For Performance:
1. Use pagination to limit results
2. Implement lazy loading for images
3. Cache frequently accessed data
4. Use appropriate filters to reduce data transfer

### For Security:
1. Always include JWT token in Authorization header
2. Validate file types and sizes on frontend before upload
3. Sanitize user input for XSS prevention
4. Don't expose sensitive user information

---

## Testing Endpoints

### Using cURL:

**Get all stories:**
```bash
curl http://localhost:5000/api/brags
```

**Create story (with auth):**
```bash
curl -X POST http://localhost:5000/api/brags \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "title=My Success Story" \
  -F "content=This is my story..." \
  -F "tags=growth" \
  -F "featuredImage=@/path/to/image.jpg"
```

**Like story:**
```bash
curl -X POST http://localhost:5000/api/brags/STORY_ID/like \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Rate Limiting

Currently no rate limiting is implemented, but consider adding:
- **Guest users:** 100 requests per 15 minutes
- **Authenticated users:** 300 requests per 15 minutes
- **Image uploads:** 10 per hour per user

---

## Future Enhancements

Potential features to add:
- [ ] Story bookmarking/saving
- [ ] Email notifications for comments/likes
- [ ] Story sharing to social media
- [ ] Rich text editor support
- [ ] Story templates
- [ ] Analytics per story
- [ ] Featured stories carousel
- [ ] Story reactions (beyond just likes)
- [ ] Reply to comments (nested comments)
- [ ] Story exports (PDF)
