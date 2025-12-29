#!/usr/bin/env python3
"""
Reflog Local Truth Agent
========================

Run this locally to analyze your REAL work patterns.
Only metadata is sent to Reflog - NEVER your actual code.

Usage:
    python reflog-truth.py --path /path/to/your/repos --email your@email.com
    
    # Or scan current directory
    python reflog-truth.py --email your@email.com

Requirements:
    - Python 3.7+
    - Git installed
    - requests library (pip install requests)

What gets sent (ONLY metadata):
    - Commit counts by directory
    - File extension distribution
    - Commit hour distribution
    - Total commit count
    
What NEVER gets sent:
    - Actual code content
    - Commit messages
    - File contents
    - Repository names (only directory structure)
"""

import os
import subprocess
import argparse
import json
from datetime import datetime, timedelta
from collections import defaultdict
from pathlib import Path

try:
    import requests
except ImportError:
    print("Installing required package: requests")
    subprocess.run(["pip", "install", "requests"], check=True)
    import requests


# Configuration
DEFAULT_API_URL = "http://localhost:8000"
DEFAULT_DAYS = 30


def find_git_repos(base_path: str, max_depth: int = 3) -> list:
    """Find all git repositories under base_path"""
    repos = []
    base = Path(base_path).resolve()
    
    for root, dirs, files in os.walk(base):
        # Check depth
        depth = len(Path(root).relative_to(base).parts)
        if depth > max_depth:
            dirs.clear()
            continue
            
        if '.git' in dirs:
            repos.append(root)
            dirs.remove('.git')  # Don't recurse into .git
            
    return repos


def get_git_log(repo_path: str, days: int = 30) -> list:
    """Get git log for a repository"""
    since_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    
    try:
        result = subprocess.run(
            [
                "git", "log",
                f"--since={since_date}",
                "--format=%H|%ad|%an",
                "--date=format:%Y-%m-%d %H:%M",
                "--name-only"
            ],
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode != 0:
            return []
            
        return result.stdout.strip().split('\n')
        
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return []


def parse_git_data(log_lines: list) -> dict:
    """Parse git log output and extract metadata"""
    data = {
        "commits": [],
        "by_directory": defaultdict(int),
        "by_file_type": defaultdict(int),
        "commit_hours": defaultdict(int),
        "commit_days": defaultdict(int)
    }
    
    current_commit = None
    
    for line in log_lines:
        if not line:
            continue
            
        if '|' in line:
            # This is a commit header: hash|date|author
            parts = line.split('|')
            if len(parts) >= 2:
                try:
                    date_str = parts[1]
                    dt = datetime.strptime(date_str, "%Y-%m-%d %H:%M")
                    data["commit_hours"][dt.hour] += 1
                    data["commit_days"][dt.strftime("%a").lower()] += 1
                    data["commits"].append(dt)
                except ValueError:
                    pass
        else:
            # This is a file path
            if line.strip():
                # Get directory (first component of path)
                parts = line.split('/')
                if len(parts) > 1:
                    directory = parts[0]
                else:
                    directory = "root"
                    
                data["by_directory"][directory] += 1
                
                # Get file extension
                ext = Path(line).suffix.lower()
                if ext:
                    data["by_file_type"][ext] += 1
                    
    return data


def merge_repo_data(all_data: list) -> dict:
    """Merge data from multiple repositories"""
    merged = {
        "total_commits": 0,
        "by_directory": defaultdict(int),
        "by_file_type": defaultdict(int),
        "commit_hours": defaultdict(int),
        "commit_days": defaultdict(int)
    }
    
    for data in all_data:
        merged["total_commits"] += len(data.get("commits", []))
        
        for k, v in data.get("by_directory", {}).items():
            merged["by_directory"][k] += v
            
        for k, v in data.get("by_file_type", {}).items():
            merged["by_file_type"][k] += v
            
        for k, v in data.get("commit_hours", {}).items():
            merged["commit_hours"][k] += v
            
        for k, v in data.get("commit_days", {}).items():
            merged["commit_days"][k] += v
            
    # Convert defaultdicts to regular dicts for JSON serialization
    merged["by_directory"] = dict(merged["by_directory"])
    merged["by_file_type"] = dict(merged["by_file_type"])
    merged["commit_hours"] = {str(k): v for k, v in merged["commit_hours"].items()}
    merged["commit_days"] = dict(merged["commit_days"])
    
    return merged


def display_preview(data: dict) -> None:
    """Display what will be sent (for transparency)"""
    print("\n" + "=" * 60)
    print("📊 YOUR WORK REALITY (what will be sent)")
    print("=" * 60)
    
    print(f"\n📝 Total Commits: {data['total_commits']}")
    
    print("\n📁 By Directory:")
    sorted_dirs = sorted(data["by_directory"].items(), key=lambda x: x[1], reverse=True)
    for dir_name, count in sorted_dirs[:5]:
        pct = count / sum(data["by_directory"].values()) * 100 if data["by_directory"] else 0
        print(f"   {dir_name}: {count} ({pct:.1f}%)")
    
    print("\n📄 By File Type:")
    sorted_types = sorted(data["by_file_type"].items(), key=lambda x: x[1], reverse=True)
    for ext, count in sorted_types[:5]:
        pct = count / sum(data["by_file_type"].values()) * 100 if data["by_file_type"] else 0
        print(f"   {ext}: {count} ({pct:.1f}%)")
    
    print("\n⏰ Peak Commit Hours:")
    sorted_hours = sorted(data["commit_hours"].items(), key=lambda x: int(x[0]))
    hour_counts = [(int(h), c) for h, c in sorted_hours]
    top_hours = sorted(hour_counts, key=lambda x: x[1], reverse=True)[:3]
    for hour, count in top_hours:
        print(f"   {hour}:00 - {count} commits")
    
    print("\n" + "=" * 60)


def submit_to_reflog(data: dict, email: str, api_url: str) -> dict:
    """Submit data to Reflog API"""
    endpoint = f"{api_url}/shadow/submit/{email}"
    
    payload = {
        "total_commits": data["total_commits"],
        "by_directory": data["by_directory"],
        "by_file_type": data["by_file_type"],
        "commit_hours": data["commit_hours"],
        "commit_days": data["commit_days"]
    }
    
    try:
        response = requests.post(endpoint, json=payload, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}


def main():
    parser = argparse.ArgumentParser(
        description="Reflog Local Truth Agent - Analyze your real work patterns",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    parser.add_argument(
        "--path", "-p",
        default=".",
        help="Base path to scan for git repos (default: current directory)"
    )
    
    parser.add_argument(
        "--email", "-e",
        required=True,
        help="Your Reflog account email"
    )
    
    parser.add_argument(
        "--days", "-d",
        type=int,
        default=DEFAULT_DAYS,
        help=f"Number of days to analyze (default: {DEFAULT_DAYS})"
    )
    
    parser.add_argument(
        "--api-url",
        default=DEFAULT_API_URL,
        help=f"Reflog API URL (default: {DEFAULT_API_URL})"
    )
    
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview what would be sent without actually sending"
    )
    
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output raw JSON instead of formatted display"
    )
    
    args = parser.parse_args()
    
    print("🕵️ Reflog Local Truth Agent")
    print("=" * 40)
    print(f"Scanning: {os.path.abspath(args.path)}")
    print(f"Days: {args.days}")
    print(f"Email: {args.email}")
    print()
    
    # Find repos
    repos = find_git_repos(args.path)
    
    if not repos:
        print("❌ No git repositories found in the specified path")
        return 1
        
    print(f"📂 Found {len(repos)} git repositories")
    
    # Analyze each repo
    all_data = []
    for repo in repos:
        print(f"   Analyzing: {os.path.basename(repo)}")
        log_lines = get_git_log(repo, args.days)
        if log_lines:
            repo_data = parse_git_data(log_lines)
            all_data.append(repo_data)
    
    # Merge data
    merged = merge_repo_data(all_data)
    
    if merged["total_commits"] == 0:
        print(f"\n⚠️ No commits found in the last {args.days} days")
        return 1
    
    # Display or output
    if args.json:
        print(json.dumps(merged, indent=2))
    else:
        display_preview(merged)
    
    # Submit or dry run
    if args.dry_run:
        print("\n🔍 DRY RUN - No data sent")
        print("Remove --dry-run to submit to Reflog")
    else:
        print("\n📤 Submitting to Reflog...")
        result = submit_to_reflog(merged, args.email, args.api_url)
        
        if "error" in result:
            print(f"❌ Error: {result['error']}")
            return 1
        else:
            print(f"✅ {result.get('message', 'Data submitted successfully')}")
            if "roast_preview" in result:
                print(f"\n🔥 Preview: {result['roast_preview']}")
            print(f"\n📊 Visit your Reflog dashboard to see your full reality check.")
    
    return 0


if __name__ == "__main__":
    exit(main())
