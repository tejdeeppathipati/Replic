#!/usr/bin/env python3
"""
Setup verification script.

Checks that all dependencies are installed and environment is configured correctly.

Usage:
    python tools/verify_setup.py
"""

import sys
import os


def check_python_version():
    """Check Python version is 3.11+"""
    version = sys.version_info
    if version.major == 3 and version.minor >= 11:
        print("Python version: {}.{}.{}".format(version.major, version.minor, version.micro))
        return True
    else:
        print("Python 3.11+ required, found {}.{}.{}".format(version.major, version.minor, version.micro))
        return False


def check_dependencies():
    """Check required Python packages are installed"""
    required = [
        "fastapi",
        "uvicorn",
        "pydantic",
        "redis",
        "httpx",
        "twilio",
        "pytest"
    ]
    
    missing = []
    for package in required:
        try:
            __import__(package)
            print(f"{package}")
        except ImportError:
            print(f"{package} (missing)")
            missing.append(package)
    
    return len(missing) == 0


def check_env_file():
    """Check if .env file exists"""
    if os.path.exists(".env"):
        print(".env file found")
        return True
    else:
        print("  .env file not found (copy env.example to .env)")
        return False


def check_redis_connection():
    """Check Redis connection"""
    try:
        import redis
        from dotenv import load_dotenv
        
        load_dotenv()
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        
        client = redis.from_url(redis_url, socket_connect_timeout=2)
        client.ping()
        print(f" Redis connection ({redis_url})")
        return True
    except Exception as e:
        print(f" Redis connection failed: {e}")
        print("   Start Redis: make docker-redis")
        return False


def check_file_structure():
    """Check that all required files exist"""
    required_files = [
        "app/__init__.py",
        "app/main.py",
        "app/models.py",
        "app/config.py",
        "app/redis_store.py",
        "app/rate_limit.py",
        "app/whatsapp.py",
        "app/imessage.py",
        "requirements.txt",
        "Makefile",
        "README.md"
    ]
    
    all_exist = True
    for filepath in required_files:
        if os.path.exists(filepath):
            print(f" {filepath}")
        else:
            print(f" {filepath} (missing)")
            all_exist = False
    
    return all_exist


def main():
    print("🔍 BrandPilot Approval Gateway - Setup Verification\n")
    
    checks = [
        ("Python Version", check_python_version),
        ("Python Dependencies", check_dependencies),
        ("Environment File", check_env_file),
        ("File Structure", check_file_structure),
        ("Redis Connection", check_redis_connection),
    ]
    
    results = []
    
    for name, check_func in checks:
        print(f"\n Checking {name}...")
        print("-" * 60)
        result = check_func()
        results.append(result)
        print()
    
    print("=" * 60)
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f" All checks passed ({passed}/{total})")
        print("\n You're ready to go!")
        print("\nNext steps:")
        print("  1. Configure .env with your credentials")
        print("  2. Run: make run")
        print("  3. Test: make seed")
        return 0
    else:
        print(f"  {passed}/{total} checks passed")
        print("\n🔧 Please fix the issues above and run this script again.")
        return 1


if __name__ == "__main__":
    sys.exit(main())

