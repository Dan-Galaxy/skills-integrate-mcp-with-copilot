"""
High School Management System API

A FastAPI application that allows students to view and sign up
for extracurricular activities at Mergington High School.
Uses persistent SQLite storage for activities and enrollments.
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
import os
from pathlib import Path

from database import init_db, seed_database, get_db, Activity, Enrollment

app = FastAPI(title="Mergington High School API",
              description="API for viewing and signing up for extracurricular activities")

# Mount the static files directory
current_dir = Path(__file__).parent
app.mount("/static", StaticFiles(directory=os.path.join(Path(__file__).parent,
          "static")), name="static")


@app.on_event("startup")
def startup_event():
    """Initialize database and seed with data on startup"""
    init_db()
    seed_database()


@app.get("/")
def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/activities")
def get_activities(db=Depends(get_db)):
    """Get all activities with their details and participant count"""
    activities = db.query(Activity).all()
    
    result = {}
    for activity in activities:
        participants = [enrollment.student_email for enrollment in activity.enrollments]
        result[activity.name] = {
            "description": activity.description,
            "schedule": activity.schedule,
            "max_participants": activity.max_participants,
            "participants": participants
        }
    
    return result


@app.post("/activities/{activity_name}/signup")
def signup_for_activity(activity_name: str, email: str, db=Depends(get_db)):
    """Sign up a student for an activity"""
    # Validate activity exists
    activity = db.query(Activity).filter(Activity.name == activity_name).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Validate student is not already signed up
    existing = db.query(Enrollment).filter(
        Enrollment.activity_id == activity.id,
        Enrollment.student_email == email
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Student is already signed up"
        )
    
    # Validate capacity
    current_count = db.query(Enrollment).filter(
        Enrollment.activity_id == activity.id
    ).count()
    if current_count >= activity.max_participants:
        raise HTTPException(
            status_code=400,
            detail="Activity is at maximum capacity"
        )
    
    # Add enrollment
    enrollment = Enrollment(
        activity_id=activity.id,
        student_email=email
    )
    db.add(enrollment)
    db.commit()
    
    return {"message": f"Signed up {email} for {activity_name}"}


@app.delete("/activities/{activity_name}/unregister")
def unregister_from_activity(activity_name: str, email: str, db=Depends(get_db)):
    """Unregister a student from an activity"""
    # Validate activity exists
    activity = db.query(Activity).filter(Activity.name == activity_name).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Find and delete enrollment
    enrollment = db.query(Enrollment).filter(
        Enrollment.activity_id == activity.id,
        Enrollment.student_email == email
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=400,
            detail="Student is not signed up for this activity"
        )
    
    # Remove enrollment
    db.delete(enrollment)
    db.commit()
    
    return {"message": f"Unregistered {email} from {activity_name}"}
