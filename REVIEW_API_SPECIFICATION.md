# Booklify Review System API Specification

## Base URL
```
http://localhost:8081/api/reviews
```

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Create Review
**POST** `/create`

**Request Body:**
```json
{
  "bookId": "string",
  "userId": "string",
  "userType": "seller|buyer",
  "rating": 1-5,
  "comment": "string",
  "reviewType": "pre-listing|post-purchase",
  "createdAt": "ISO 8601 date string"
}
```

**Response:**
```json
{
  "id": "string",
  "bookId": "string",
  "userId": "string",
  "userName": "string",
  "userType": "seller|buyer",
  "rating": 1-5,
  "comment": "string",
  "reviewType": "pre-listing|post-purchase",
  "createdAt": "ISO 8601 date string",
  "updatedAt": "ISO 8601 date string"
}
```

### 2. Get Reviews by Book
**GET** `/book/{bookId}`

**Response:**
```json
[
  {
    "id": "string",
    "bookId": "string",
    "userId": "string",
    "userName": "string",
    "userType": "seller|buyer",
    "rating": 1-5,
    "comment": "string",
    "reviewType": "pre-listing|post-purchase",
    "createdAt": "ISO 8601 date string",
    "updatedAt": "ISO 8601 date string"
  }
]
```

### 3. Get Reviews by User
**GET** `/user/{userId}`

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:** Same as above

### 4. Get Review by ID
**GET** `/{reviewId}`

**Response:** Single review object

### 5. Update Review
**PUT** `/update/{reviewId}`

**Headers:** `Authorization: Bearer <jwt_token>`

**Request Body:**
```json
{
  "rating": 1-5,
  "comment": "string",
  "updatedAt": "ISO 8601 date string"
}
```

**Response:** Updated review object

### 6. Delete Review
**DELETE** `/delete/{reviewId}`

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:** `200 OK` or error message

### 7. Check User Review for Book
**GET** `/check/{bookId}/{userId}`

**Headers:** `Authorization: Bearer <jwt_token>`

**Response:** Review object if exists, `404 Not Found` if no review

## Database Schema

### Review Table
```sql
CREATE TABLE reviews (
    id VARCHAR(36) PRIMARY KEY,
    book_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_type ENUM('seller', 'buyer') NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    review_type ENUM('pre-listing', 'post-purchase') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (book_id) REFERENCES books(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_user_book_review (user_id, book_id)
);
```

## Business Logic

### User Type Determination
- **Seller**: Users with admin role or users who are selling the book
- **Buyer**: Regular users who purchase books

### Review Type Determination
- **Pre-listing**: Reviews written by sellers before listing a book
- **Post-purchase**: Reviews written by buyers after receiving a book

### Validation Rules
1. Users can only write one review per book
2. Rating must be between 1-5
3. Comment is required and must be non-empty
4. Users can only edit/delete their own reviews
5. Sellers can only write pre-listing reviews
6. Buyers can only write post-purchase reviews

## Error Responses

### Standard Error Format
```json
{
  "error": "string",
  "message": "string",
  "timestamp": "ISO 8601 date string"
}
```

### Common HTTP Status Codes
- `200 OK`: Success
- `201 Created`: Review created successfully
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: User not authorized to perform action
- `404 Not Found`: Resource not found
- `409 Conflict`: User already reviewed this book
- `500 Internal Server Error`: Server error

## Implementation Notes

1. **Security**: Ensure users can only access/modify their own reviews
2. **Performance**: Add indexes on `book_id`, `user_id`, and `user_id + book_id`
3. **Caching**: Consider caching book ratings and review counts
4. **Rate Limiting**: Implement rate limiting to prevent spam reviews
5. **Moderation**: Consider adding review moderation for inappropriate content
