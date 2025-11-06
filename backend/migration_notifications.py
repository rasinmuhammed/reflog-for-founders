"""
Migration script to add notification fields to users table
Run this once: python migrate_notifications.py
"""
from sqlalchemy import text
from database import SessionLocal

def migrate_notification_fields():
    """Add notification preference fields to users table"""
    db = SessionLocal()
    
    try:
        print("🔧 Adding notification fields to users table...")
        
        # Add new columns
        new_columns = [
            ("email_notifications_enabled", "BOOLEAN DEFAULT TRUE"),
            ("morning_reminder_time", "VARCHAR(10) DEFAULT '09:00'"),
            ("evening_reminder_time", "VARCHAR(10) DEFAULT '18:00'"),
            ("timezone", "VARCHAR(50) DEFAULT 'UTC'")
        ]
        
        for col_name, col_def in new_columns:
            try:
                # Check if column exists
                result = db.execute(text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'users' 
                    AND column_name = '{col_name}';
                """))
                
                if not result.fetchone():
                    print(f"➕ Adding '{col_name}' column...")
                    db.execute(text(f"""
                        ALTER TABLE users 
                        ADD COLUMN {col_name} {col_def};
                    """))
                    db.commit()
                    print(f"✅ Column '{col_name}' added")
                else:
                    print(f"✓ Column '{col_name}' already exists")
            except Exception as e:
                print(f"⚠️  Column '{col_name}': {str(e)}")
                db.rollback()
        
        print("\n✅ Migration complete!")
        
        # Verify
        print("\n📋 Current notification-related columns:")
        result = db.execute(text("""
            SELECT column_name, data_type, column_default
            FROM information_schema.columns 
            WHERE table_name = 'users'
            AND column_name IN (
                'email_notifications_enabled',
                'morning_reminder_time',
                'evening_reminder_time',
                'timezone'
            )
            ORDER BY column_name;
        """))
        
        for row in result:
            print(f"  - {row[0]}: {row[1]} (default: {row[2]})")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Notification Fields Migration for Reflog")
    print("=" * 60)
    
    migrate_notification_fields()
    
    print("\n" + "=" * 60)
    print("✅ Migration complete! Restart your FastAPI server.")
    print("=" * 60)