"""
Migration script to add groq_api_key field to users table
Run this once: python migration_add_groq_key.py
"""
from sqlalchemy import text
from database import SessionLocal

def migrate_groq_api_key():
    """Add groq_api_key field to users table"""
    db = SessionLocal()
    
    try:
        print("🔧 Adding groq_api_key field to users table...")
        
        # Check if column exists
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'groq_api_key';
        """))
        
        if not result.fetchone():
            print("➕ Adding 'groq_api_key' column...")
            db.execute(text("""
                ALTER TABLE users 
                ADD COLUMN groq_api_key VARCHAR(500);
            """))
            db.commit()
            print("✅ Column 'groq_api_key' added")
        else:
            print("✓ Column 'groq_api_key' already exists")
        
        print("\n✅ Migration complete!")
        
        # Verify
        print("\n📋 Verifying column:")
        result = db.execute(text("""
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns 
            WHERE table_name = 'users'
            AND column_name = 'groq_api_key';
        """))
        
        for row in result:
            print(f"  - {row[0]}: {row[1]}({row[2]})")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("Groq API Key Migration for Reflog")
    print("=" * 60)
    
    migrate_groq_api_key()
    
    print("\n" + "=" * 60)
    print("✅ Migration complete! Restart your FastAPI server.")
    print("=" * 60)