# 🚀 Auto-Poster - Automatic Tweet Replies (No Approval!)

**Fully automatic pipeline:** Fetch → Generate → Post

No human approval needed! Perfect for hackathon demos.

---

## 🎯 **What It Does:**

```
1. X Fetcher → Find relevant tweets
2. LLM Generator → Create personalized reply (with full brand context)
3. X Poster → Post automatically ✅
```

**No approval step!** Everything happens automatically.

---

## 🚀 **Quick Start:**

### **1. Start All Services:**

```bash
# Terminal 1: X Fetcher
cd x-fetcher
uvicorn app.main:app --reload --port 8200

# Terminal 2: LLM Generator
cd llm-generator
uvicorn app.main:app --reload --port 8300

# Terminal 3: X Poster
cd x-poster
uvicorn app.main:app --reload --port 8400
```

### **2. Run Auto-Poster:**

```bash
# One-time run (posts up to 5 tweets)
python auto-poster.py --brand-id YOUR_BRAND_UUID

# Continuous mode (runs every 5 minutes)
python auto-poster.py --brand-id YOUR_BRAND_UUID --loop --interval 300

# Custom persona
python auto-poster.py --brand-id YOUR_BRAND_UUID --persona smart

# More posts per run
python auto-poster.py --brand-id YOUR_BRAND_UUID --max-posts 10
```

---

## 📋 **Options:**

| Flag | Description | Default |
|------|-------------|---------|
| `--brand-id` | Brand UUID (required) | - |
| `--persona` | Reply style (normal/smart/technical/unhinged) | `normal` |
| `--max-posts` | Max tweets to post per run | `5` |
| `--loop` | Run continuously | `false` |
| `--interval` | Seconds between runs (with `--loop`) | `300` |

---

## 📊 **Example Output:**

```
======================================================================
🚀 Auto-Poster Pipeline Started
   Brand ID: abc123...
   Persona: normal
   Max Posts: 5
   Time: 2024-01-01T12:00:00Z
======================================================================

📥 Fetching tweets for brand: abc123...
✅ Found 12 candidates

--- Candidate 1/5 ---
Tweet: Looking for a good CRM solution for my startup...
Author: @founder_steve

🤖 Generating reply for tweet: 1234567890
✅ Generated: We'd love to help! Our platform is built for startups...

📤 Posting tweet...
✅ Posted! https://x.com/yourbrand/status/9876543210

⏳ Waiting 5 seconds before next post...

--- Candidate 2/5 ---
...

======================================================================
✅ Pipeline Complete!
   Posted: 4
   Failed: 1
   Total: 5
======================================================================
```

---

## 🔧 **Configuration:**

### **Service URLs:**

Edit `auto-poster.py` if your services run on different ports:

```python
X_FETCHER_URL = "http://localhost:8200"
LLM_GENERATOR_URL = "http://localhost:8300"
X_POSTER_URL = "http://localhost:8400"
```

### **Rate Limiting:**

Built-in 5-second delay between posts to avoid X rate limits.

---

## 🎨 **Personas:**

```bash
# Normal - Friendly and helpful
python auto-poster.py --brand-id YOUR_ID --persona normal

# Smart - Knowledgeable expert
python auto-poster.py --brand-id YOUR_ID --persona smart

# Technical - Deep technical specialist
python auto-poster.py --brand-id YOUR_ID --persona technical

# Unhinged - Witty and bold
python auto-poster.py --brand-id YOUR_ID --persona unhinged
```

---

## 🧪 **Testing:**

### **Test Each Service:**

```bash
# 1. Test X Fetcher
curl http://localhost:8200/
# Should return: {"service":"x-fetcher","status":"ok"}

# 2. Test LLM Generator
curl http://localhost:8300/
# Should return: {"service":"llm-generator","status":"ok"}

# 3. Test X Poster
curl http://localhost:8400/
# Should return: {"service":"x-poster","status":"ok"}
```

### **Test Full Pipeline:**

```bash
# Dry run with small max-posts
python auto-poster.py --brand-id YOUR_ID --max-posts 1
```

---

## 🔄 **Continuous Mode:**

Perfect for **live demos** or **production**:

```bash
# Run every 5 minutes
python auto-poster.py --brand-id YOUR_ID --loop --interval 300

# Run every 15 minutes
python auto-poster.py --brand-id YOUR_ID --loop --interval 900

# Run every hour
python auto-poster.py --brand-id YOUR_ID --loop --interval 3600
```

**Press Ctrl+C to stop.**

---

## 📈 **For Production:**

### **Run as Background Service:**

```bash
# Using nohup
nohup python auto-poster.py --brand-id YOUR_ID --loop --interval 300 > auto-poster.log 2>&1 &

# Check logs
tail -f auto-poster.log

# Stop
ps aux | grep auto-poster
kill <PID>
```

### **Using systemd (Linux):**

```ini
# /etc/systemd/system/brandpilot-autoposter.service
[Unit]
Description=BrandPilot Auto-Poster
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/twitly
ExecStart=/usr/bin/python3 auto-poster.py --brand-id YOUR_ID --loop --interval 300
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable brandpilot-autoposter
sudo systemctl start brandpilot-autoposter
sudo systemctl status brandpilot-autoposter
```

---

## ✅ **Benefits:**

| Feature | Status |
|---------|--------|
| **Fully Automatic** | ✅ |
| **No Approval Needed** | ✅ |
| **Uses Full Brand Context** | ✅ |
| **Rate Limited** | ✅ |
| **Continuous Mode** | ✅ |
| **Error Handling** | ✅ |
| **Easy to Use** | ✅ |

---

## 🎉 **You're Done!**

```bash
# Start services
cd x-fetcher && uvicorn app.main:app --reload --port 8200 &
cd llm-generator && uvicorn app.main:app --reload --port 8300 &
cd x-poster && uvicorn app.main:app --reload --port 8400 &

# Run auto-poster
python auto-poster.py --brand-id YOUR_BRAND_UUID --loop

# ✅ Automatic tweet replies are live!
```

**No approval needed! Perfect for hackathons!** 🚀

