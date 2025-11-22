from database import engine
from sqlalchemy import text

def add_columns():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0"))
            print("Added xp column")
        except Exception as e:
            print(f"xp column might already exist: {e}")

        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1"))
            print("Added level column")
        except Exception as e:
            print(f"level column might already exist: {e}")

        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN current_streak INTEGER DEFAULT 0"))
            print("Added current_streak column")
        except Exception as e:
            print(f"current_streak column might already exist: {e}")

        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN longest_streak INTEGER DEFAULT 0"))
            print("Added longest_streak column")
        except Exception as e:
            print(f"longest_streak column might already exist: {e}")

        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN last_checkin_date TIMESTAMP"))
            print("Added last_checkin_date column")
        except Exception as e:
            print(f"last_checkin_date column might already exist: {e}")
            
        conn.commit()

if __name__ == "__main__":
    add_columns()
