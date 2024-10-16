# Forum Categories Table

## Purpose
This table stores categories for organizing forum topics into different sections.

## Columns and Types

| Column Name | Type | Constraints | Description |
|-------------|------|-------------|-------------|
| id | integer | PRIMARY KEY, AUTO INCREMENT | Unique identifier for the category |
| name | string(255) | NOT NULL | Name of the category |
| description | text | | Description of the category |
| parent_category_id | integer | FOREIGN KEY | ID of the parent category (for subcategories) |

## Notes
- Use this table to organize topics into categories and subcategories.
