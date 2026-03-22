"""
Database module for Mergington High School Activities API
Provides SQLAlchemy models and database initialization
"""

import os
from sqlalchemy import create_engine, Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

# Database setup
DATABASE_URL = "sqlite:///./mergington_activities.db"

# Create engine
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}  # SQLite requirement
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


class Activity(Base):
    """Activity model for extracurricular activities"""
    __tablename__ = "activities"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String)
    schedule = Column(String)
    max_participants = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to enrollments
    enrollments = relationship("Enrollment", back_populates="activity", cascade="all, delete-orphan")


class Enrollment(Base):
    """Enrollment model for student signups"""
    __tablename__ = "enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"))
    student_email = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to activity
    activity = relationship("Activity", back_populates="enrollments")


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_database():
    """Seed database with initial activities if empty"""
    db = SessionLocal()
    try:
        # Check if activities already exist
        if db.query(Activity).count() == 0:
            activities_data = [
                Activity(
                    name="Chess Club",
                    description="Learn strategies and compete in chess tournaments",
                    schedule="Fridays, 3:30 PM - 5:00 PM",
                    max_participants=12
                ),
                Activity(
                    name="Programming Class",
                    description="Learn programming fundamentals and build software projects",
                    schedule="Tuesdays and Thursdays, 3:30 PM - 4:30 PM",
                    max_participants=20
                ),
                Activity(
                    name="Gym Class",
                    description="Physical education and sports activities",
                    schedule="Mondays, Wednesdays, Fridays, 2:00 PM - 3:00 PM",
                    max_participants=30
                ),
                Activity(
                    name="Soccer Team",
                    description="Join the school soccer team and compete in matches",
                    schedule="Tuesdays and Thursdays, 4:00 PM - 5:30 PM",
                    max_participants=22
                ),
                Activity(
                    name="Basketball Team",
                    description="Practice and play basketball with the school team",
                    schedule="Wednesdays and Fridays, 3:30 PM - 5:00 PM",
                    max_participants=15
                ),
                Activity(
                    name="Art Club",
                    description="Explore your creativity through painting and drawing",
                    schedule="Thursdays, 3:30 PM - 5:00 PM",
                    max_participants=15
                ),
                Activity(
                    name="Drama Club",
                    description="Act, direct, and produce plays and performances",
                    schedule="Mondays and Wednesdays, 4:00 PM - 5:30 PM",
                    max_participants=20
                ),
                Activity(
                    name="Math Club",
                    description="Solve challenging problems and participate in math competitions",
                    schedule="Tuesdays, 3:30 PM - 4:30 PM",
                    max_participants=10
                ),
                Activity(
                    name="Debate Team",
                    description="Develop public speaking and argumentation skills",
                    schedule="Fridays, 4:00 PM - 5:30 PM",
                    max_participants=12
                ),
            ]
            
            # Add seed enrollments for some activities
            seed_enrollments = [
                ("Chess Club", "michael@mergington.edu"),
                ("Chess Club", "daniel@mergington.edu"),
                ("Programming Class", "emma@mergington.edu"),
                ("Programming Class", "sophia@mergington.edu"),
                ("Gym Class", "john@mergington.edu"),
                ("Gym Class", "olivia@mergington.edu"),
                ("Soccer Team", "liam@mergington.edu"),
                ("Soccer Team", "noah@mergington.edu"),
                ("Basketball Team", "ava@mergington.edu"),
                ("Basketball Team", "mia@mergington.edu"),
                ("Art Club", "amelia@mergington.edu"),
                ("Art Club", "harper@mergington.edu"),
                ("Drama Club", "ella@mergington.edu"),
                ("Drama Club", "scarlett@mergington.edu"),
                ("Math Club", "james@mergington.edu"),
                ("Math Club", "benjamin@mergington.edu"),
                ("Debate Team", "charlotte@mergington.edu"),
                ("Debate Team", "henry@mergington.edu"),
            ]
            
            # Save activities
            db.add_all(activities_data)
            db.commit()
            
            # Create activity name to id mapping
            activity_map = {a.name: a.id for a in activities_data}
            
            # Add enrollments
            for activity_name, email in seed_enrollments:
                if activity_name in activity_map:
                    enrollment = Enrollment(
                        activity_id=activity_map[activity_name],
                        student_email=email
                    )
                    db.add(enrollment)
            
            db.commit()
    finally:
        db.close()
