# Users Table

## Purpose
This table stores user account information, including authentication details, profile data, and user preferences. It supports both local authentication and OAuth providers (like Google).

## Columns and Types

| Column Name | Type | Constraints | Default | Description |
|-------------|------|-------------|---------|-------------|
| id | integer | PRIMARY KEY, AUTO INCREMENT | | Unique identifier for the user |
| username | string(255) | NOT NULL, UNIQUE | | User's display name |
| email | string(255) | NOT NULL, UNIQUE | | User's email address |
| password_hash | string(255) | NULLABLE | null | Hashed password (null for OAuth users) |
| auth_type | string(50) | NOT NULL | 'local' | Authentication type ('local' or 'google') |
| profile_image_url | string(255) | NULLABLE | null | URL to user's profile image |
| is_admin | boolean | NOT NULL | false | Administrator status |
| is_moderator | boolean | NOT NULL | false | Moderator status |
| region | string(100) | NULLABLE | null | User's geographical region |
| gender | string(20) | NULLABLE | 'prefer_not_to_say' | User's gender |
| name | string(255) | NULLABLE | null | User's full name |
| email_verified | boolean | NOT NULL | false | Email verification status |
| last_login | timestamp with time zone | NULLABLE | null | Last login timestamp |
| created_at | timestamp with time zone | NOT NULL | CURRENT_TIMESTAMP | Account creation timestamp |
| bio | text | NULLABLE | null | User's biography |
| website | string(255) | NULLABLE | null | User's website URL |
| preferences | jsonb | NULLABLE | null | User preferences as JSON |

## Indexes

| Index Name | Columns | Type | Description |
|------------|---------|------|-------------|
| users_pkey | id | B-tree | Primary key |
| idx_users_email | email | B-tree | For email lookups |
| idx_users_username | username | B-tree | For username lookups |
| idx_users_auth_type | auth_type | B-tree | For filtering by auth type |
| idx_users_is_admin | is_admin | B-tree | For admin queries |
| idx_users_is_moderator | is_moderator | B-tree | For moderator queries |
| idx_users_email_verified | email_verified | B-tree | For verification queries |
| idx_users_last_login | last_login | B-tree | For login time queries |
| idx_users_created_at | created_at | B-tree | For creation time queries |

## Relationships

- Has many playlists (one-to-many with `playlists` table)
- Has many songs (one-to-many with `songs` table through `uploaded_by`)
- Has many liked playlists (many-to-many through `user_playlist_library`)
- Has many votes (one-to-many with `votes` table)
- Has many comments (one-to-many with `song_comments` and `video_comments` tables)

## Constraints

- Email must be unique
- Username must be unique
- Gender must be one of: ['male', 'female', 'non_binary', 'prefer_not_to_say']
- Auth type must be one of: ['local', 'google']

## Example Queries

1. Find user by email:
```sql
SELECT * FROM users WHERE email = ? LIMIT 1;
```

2. Get all admins:
```sql
SELECT * FROM users WHERE is_admin = true;
```

3. Get recent users:
```sql
SELECT * FROM users 
ORDER BY created_at DESC 
LIMIT 10;
```

4. Update user preferences:
```sql
UPDATE users 
SET preferences = preferences || '{"theme": "dark"}'::jsonb 
WHERE id = ?;
```

5. Get users with verified emails:
```sql
SELECT * FROM users 
WHERE email_verified = true 
ORDER BY last_login DESC;
```

## Notes

- Password hash is nullable to support OAuth users who don't have local passwords
- Profile images can come from OAuth providers or user uploads
- Preferences column can store various user settings as JSON
- Last login is updated on each successful authentication
- Email verification status is automatically set for OAuth users
- The auth_type field helps distinguish between different authentication methods
- Consider implementing soft deletes if needed
- Regular maintenance of the last_login field can help identify inactive accounts

## Security Considerations

1. Passwords are never stored in plain text
2. OAuth users have null password_hash
3. Email verification status tracked separately
4. Admin and moderator status clearly separated
5. Login timestamps tracked for security monitoring

## Maintenance Tasks

- Regular cleanup of unverified accounts
- Monitoring of admin/moderator assignments
- Periodic validation of profile image URLs
- Cleanup of inactive accounts
- Validation of preference JSON structure
- Regular backup of user data
- Monitoring of authentication patterns

## Recent Changes

- Added auth_type column for multiple authentication methods
- Made password_hash nullable for OAuth support
- Added preferences column for user settings
- Added indexes for common query patterns 