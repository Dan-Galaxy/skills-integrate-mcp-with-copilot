# Mergington High School Activities API

A FastAPI application that allows students to view and sign up for extracurricular activities with persistent data storage.

## Features

- View all available extracurricular activities
- Sign up for activities with capacity validation
- Persistent data storage using SQLite
- Automatic database initialization on startup

## Getting Started

1. Install the dependencies:

   ```bash
   pip install -r ../requirements.txt
   ```

2. Run the application:

   ```bash
   python app.py
   ```
   
   The application will automatically:
   - Create the SQLite database (`mergington_activities.db`)
   - Initialize the database schema
   - Seed sample activities and enrollments on first run

3. Open your browser and go to:
   - Web interface: http://localhost:8000/
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Sign up for an activity                                             |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Unregister from an activity                                     |

## Data Model

The application uses SQLite with two main tables:

1. **activities** - Stores activity information:
   - `id` - Unique activity identifier
   - `name` - Activity name (unique)
   - `description` - Activity description
   - `schedule` - When the activity meets
   - `max_participants` - Maximum enrollment capacity
   - `created_at` - Timestamp of creation

2. **enrollments** - Stores student signups:
   - `id` - Unique enrollment identifier
   - `activity_id` - Reference to activity
   - `student_email` - Student email address
   - `created_at` - Timestamp of signup

## Database

- **Type**: SQLite
- **Location**: `mergington_activities.db` (created in the `src/` directory)
- **Persistence**: All data persists across server restarts
- **Auto-initialization**: On first run, the database is created and seeded with sample activities and enrollments

## Validation & Constraints

- Students can only sign up once per activity
- Activities have a maximum capacity limit
- Attempting to sign up for a full activity returns an error
- Unregistering removes the enrollment permanently
