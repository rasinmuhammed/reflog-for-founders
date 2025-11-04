"""
Migration script to transform Reflog from Developer Tool to Founder Tool
Run this ONCE to migrate your database schema
"""

from database import engine, SessionLocal
from sqlalchemy import text
import sys

def migrate_developer_to_founder_schema():
    """
    Migrate from developer-focused schema to founder-focused schema
    """
    db = SessionLocal()
    
    try:
        print("🔄 Starting migration from Developer to Founder schema...")
        print()
        
        # Step 1: Create new founder-focused tables
        print("📊 Creating business metrics tables...")
        
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS business_metrics (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                metric_type VARCHAR(50),
                value FLOAT,
                target FLOAT,
                date TIMESTAMP DEFAULT NOW(),
                notes TEXT
            )
        """))
        
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS weekly_reviews (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                week_start TIMESTAMP,
                wins JSON,
                key_metrics JSON,
                biggest_blocker TEXT,
                what_avoiding TEXT,
                next_week_focus TEXT,
                ai_analysis TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """))
        
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS okrs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                quarter VARCHAR(10),
                objective TEXT,
                key_results JSON,
                progress_updates JSON,
                achieved BOOLEAN,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """))
        
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS time_allocation (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                date TIMESTAMP DEFAULT NOW(),
                category VARCHAR(50),
                hours FLOAT,
                notes TEXT
            )
        """))
        
        db.commit()
        print("✅ New tables created successfully")
        print()
        
        # Step 2: Adapt existing tables
        print("🔧 Adapting existing tables...")
        
        # Check if columns exist before adding them
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='business_stage'
        """))
        
        if not result.fetchone():
            db.execute(text("""
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS business_stage VARCHAR(50),
                ADD COLUMN IF NOT EXISTS business_name VARCHAR(255)
            """))
            print("✅ Added business fields to users table")
        else:
            print("ℹ️  Business fields already exist in users table")
        
        db.commit()
        print()
        
        # Step 3: Optional - Drop GitHub-specific tables (COMMENTED OUT FOR SAFETY)
        print("⚠️  GitHub integration tables preserved (optional: manually drop if not needed)")
        # Uncomment below if you want to completely remove GitHub features:
        # db.execute(text("DROP TABLE IF EXISTS github_analysis CASCADE"))
        # print("✅ Removed github_analysis table")
        
        db.commit()
        print()
        
        print("✅ Migration completed successfully!")
        print()
        print("📝 Next steps:")
        print("   1. Restart your backend: python main.py")
        print("   2. Existing users will continue to work")
        print("   3. New users will go through founder onboarding")
        print()
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("REFLOG MIGRATION: Developer Tool → Founder Tool")
    print("=" * 60)
    print()
    
    response = input("⚠️  This will modify your database. Continue? (yes/no): ")
    
    if response.lower() == 'yes':
        migrate_developer_to_founder_schema()
    else:
        print("Migration cancelled.")
        sys.exit(0)