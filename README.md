# BE Sele Sele API

Backend API for managing pages and collaborations, built with **Hono**, **Drizzle ORM**, and **MySQL**.

## Setup

1.  **Install Dependencies**

    ```bash
    bun install
    ```

2.  **Environment Variables**
    Copy `.env.example` to `.env` and fill in the details:

    ```env
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=
    DB_NAME=be_sele_sele
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    GOOGLE_REDIRECT_URL=http://localhost:3000
    ```

3.  **Database Migration**

    ```bash
    bun drizzle-kit migrate
    ```

4.  **Run Server**
    ```bash
    bun dev
    ```

## Authentication

All endpoints (except `/login`) require a valid **Google ID Token** in the `Authorization` header.

**Header Format:**

```
Authorization: Bearer <YOUR_GOOGLE_ID_TOKEN>
```

---

## API Endpoints

### Auth

#### Login

Exchange Google ID Token for user session/verification (Upserts user).

- **URL**: `/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "idToken": "ey..."
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "tokens": { ... },
      "user": { ... }
    }
  }
  ```

---

### Pages

#### List Pages

Get a paginated list of pages the user has access to (owned or valid collaboration).

- **URL**: `/pages`
- **Method**: `GET`
- **Query Params**:
  - `page`: Page number (default: `1`)
  - `limit`: Items per page (default: `10`)
  - `owned`: Filter by ownership (optional)
    - `true`: Get only pages owned by user.
    - `false`: Get only shared pages (collaborating).
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Pages retrieved successfully",
    "data": {
      "data": [
        {
          "id": "uuid...",
          "title": "Page Title",
          "members": [
             { "email": "user@example.com", "isOwner": true, "isPending": false }
          ]
          ...
        }
      ],
      "total": 15
    }
  }
  ```

#### Get Page Details

Get a single page by ID.

- **URL**: `/pages/:id`
- **Method**: `GET`
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Page retrieved successfully",
    "data": {
      "id": "uuid...",
      "title": "Page Title",
      ...
    }
  }
  ```

#### Create Page

Create a new page. Automatically creates a markdown file storage `file/{id}.md`.

- **URL**: `/pages`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "title": "My New Page",
    "description": "Optional description",
    "icon": "📝"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "success": true,
    "message": "Page created successfully",
    "data": {
      "id": "uuid...",
      ...
    }
  }
  ```

#### Update Page Info

Update page metadata (Title, Description, Icon). **Owner Only**.

- **URL**: `/pages/:id`
- **Method**: `PUT`
- **Body**:
  ```json
  {
    "title": "Updated Title",
    "description": "Updated Description"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Page updated successfully",
    "data": { ... }
  }
  ```

#### Update Page Content (Markdown)

Update the markdown content associated with the page. Updates `file/{id}.md`. **Owner Only**.

- **URL**: `/pages/:id`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "content": "# Hello World\nThis is the markdown content."
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Content updated successfully",
    "data": null
  }
  ```

#### Delete Page

Soft delete a page. **Owner Only**.

- **URL**: `/pages/:id`
- **Method**: `DELETE`
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Page deleted successfully",
    "data": null
  }
  ```

---

### Members

#### Get Members

List all members (collaborators) of a page.

- **URL**: `/pages/:id/member`
- **Method**: `GET`
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Members retrieved successfully",
    "data": [
      {
        "email": "owner@example.com",
        "isOwner": true,
        "isPending": false
      },
      ...
    ]
  }
  ```

#### Add Member

Add a new collaborator to the page. **Owner Only**.

- **URL**: `/pages/:id/member`
- **Method**: `PUT`
- **Body**:
  ```json
  {
    "email": "friend@example.com"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Member added successfully",
    "data": null
  }
  ```

#### Remove Member

Remove a collaborator from the page. **Owner Only**.

- **URL**: `/pages/:id/member`
- **Method**: `DELETE`
- **Body**:
  ```json
  {
    "email": "friend@example.com"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Member removed successfully",
    "data": null
  }
  ```
