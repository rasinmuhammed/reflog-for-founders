# backend/quick_fix.py
# Run this to fix the database schema issue

from sqlalchemy import text
from database import SessionLocal

def fix_business_metrics_table():
    """Fix the business_metrics table"""
    db = SessionLocal()
    
    try:
        print("🔧 Fixing business_metrics table...")
        
        # Check if table exists
        result = db.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'business_metrics'
            );
        """))
        
        table_exists = result.fetchone()[0]
        
        if not table_exists:
            print("📝 Creating business_metrics table...")
            db.execute(text("""
                CREATE TABLE business_metrics (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    metric_type VARCHAR(100) NOT NULL,
                    value FLOAT NOT NULL,
                    unit VARCHAR(50),
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    context JSON
                );
            """))
            db.commit()
            print("✅ Table created successfully")
        else:
            print("📊 Table exists, checking columns...")
            
            # Check if unit column exists
            result = db.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'business_metrics' 
                AND column_name = 'unit';
            """))
            
            if not result.fetchone():
                print("➕ Adding 'unit' column...")
                db.execute(text("""
                    ALTER TABLE business_metrics 
                    ADD COLUMN unit VARCHAR(50);
                """))
                db.commit()
                print("✅ Column added")
            else:
                print("✅ Column already exists")
        
        # Add indexes
        print("📇 Adding indexes...")
        try:
            db.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_business_metrics_user_id 
                ON business_metrics(user_id);
            """))
            db.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_business_metrics_type 
                ON business_metrics(metric_type);
            """))
            db.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_business_metrics_timestamp 
                ON business_metrics(timestamp);
            """))
            db.commit()
            print("✅ Indexes added")
        except Exception as e:
            print(f"⚠️  Index creation (might already exist): {str(e)}")
        
        print("\n✅ Database fix complete!")
        
        # Verify the fix
        result = db.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'business_metrics'
            ORDER BY ordinal_position;
        """))
        
        print("\n📋 Current business_metrics columns:")
        for row in result:
            print(f"  - {row[0]}: {row[1]}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        db.rollback()
    finally:
        db.close()

def fix_users_table():
    """Add missing columns to users table"""
    db = SessionLocal()
    
    try:
        print("\n🔧 Fixing users table...")
        
        # Add new columns if they don't exist
        new_columns = [
            ("full_name", "VARCHAR(255)"),
            ("business_stage", "VARCHAR(100)"),
            ("primary_goal", "TEXT"),
            ("check_in_frequency", "VARCHAR(50) DEFAULT 'daily'"),
            ("accountability_style", "VARCHAR(50) DEFAULT 'balanced'"),
            ("key_metrics", "JSON"),
            ("work_preferences", "JSON")
        ]
        
        for col_name, col_type in new_columns:
            try:
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
                        ADD COLUMN {col_name} {col_type};
                    """))
                    db.commit()
                    print(f"✅ Column '{col_name}' added")
                else:
                    print(f"✓ Column '{col_name}' already exists")
            except Exception as e:
                print(f"⚠️  Column '{col_name}': {str(e)}")
                db.rollback()
        
        # Make github_username nullable
        try:
            db.execute(text("""
                ALTER TABLE users 
                ALTER COLUMN github_username DROP NOT NULL;
            """))
            db.commit()
            print("✅ github_username is now nullable")
        except Exception as e:
            print(f"⚠️  github_username nullable: {str(e)}")
            db.rollback()
        
        print("✅ Users table fix complete!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        db.rollback()
    finally:
        db.close()

def fix_checkins_table():
    """Add founder-specific columns to checkins"""
    db = SessionLocal()
    
    try:
        print("\n🔧 Fixing checkins table...")
        
        new_columns = [
            ("revenue_update", "FLOAT"),
            ("customer_wins", "TEXT"),
            ("blockers", "TEXT")
        ]
        
        for col_name, col_type in new_columns:
            try:
                result = db.execute(text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'checkins' 
                    AND column_name = '{col_name}';
                """))
                
                if not result.fetchone():
                    print(f"➕ Adding '{col_name}' column...")
                    db.execute(text(f"""
                        ALTER TABLE checkins 
                        ADD COLUMN {col_name} {col_type};
                    """))
                    db.commit()
                    print(f"✅ Column '{col_name}' added")
                else:
                    print(f"✓ Column '{col_name}' already exists")
            except Exception as e:
                print(f"⚠️  Column '{col_name}': {str(e)}")
                db.rollback()
        
        print("✅ Checkins table fix complete!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Quick Database Fix for Reflog")
    print("=" * 60)
    
    fix_business_metrics_table()
    fix_users_table()
    fix_checkins_table()
    
    print("\n" + "=" * 60)
    print("✅ All fixes applied! Restart your FastAPI server.")
    print("=" * 60)