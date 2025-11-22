from celery_app import celery_app
import time

@celery_app.task
def test_task(word: str):
    time.sleep(5) # Simulate work
    return f"Hello {word}"
