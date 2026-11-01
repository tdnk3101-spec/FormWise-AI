import os
import sys
import requests
import json

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from app.core.config import settings

api_key = settings.LLM_API_KEY
if not api_key:
    print("Skipping test: LLM_API_KEY is not configured.")
    sys.exit(0)

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

prompt = """
You are FormWise AI, an expert Indian application form guide.
Form Title: Post-Matric Scholarship
Field Label: Annual Family Income
Normalized Key: income
Target Language: en

Provide a structured JSON response with exactly these four keys:
- "meaning": A clear, simple 1-2 sentence explanation of what this field is asking for and why it matters.
- "format_example": A realistic sample format (explicitly mark it as [Example]).
- "supporting_doc": Official certificate or document required in India (or "None required" if self-declaration).
- "warnings": Any critical pitfalls (e.g. spelling match with 10th marksheet, income certificate validity, masking Aadhaar).

Return ONLY valid JSON.
"""

data = {
    "model": settings.effective_llm_model,
    "messages": [
        {"role": "user", "content": prompt}
    ],
    "response_format": {"type": "json_object"}
}

r = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=data, timeout=15)
print("Status:", r.status_code)
if r.status_code == 200:
    res = json.loads(r.json()["choices"][0]["message"]["content"])
    print("Keys:", list(res.keys()))
else:
    print("Error:", r.text)
