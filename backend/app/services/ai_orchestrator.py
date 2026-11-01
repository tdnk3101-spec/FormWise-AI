import os
import json
import re
import requests
from typing import Dict, Any, Optional, List
from app.core.config import settings

class AIOrchestrator:
    @staticmethod
    def is_external_ai_configured() -> bool:
        return bool(settings.LLM_API_KEY and len(settings.LLM_API_KEY.strip()) > 5)

    @staticmethod
    def _call_groq(messages: List[Dict[str, str]], response_format: Optional[Dict[str, Any]] = None, max_tokens: int = 1000) -> Optional[str]:
        """
        Executes an inference request against Groq's high-speed LLM API.
        """
        if not settings.LLM_API_KEY:
            return None

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.LLM_API_KEY.strip()}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": settings.effective_llm_model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.2
        }
        if response_format:
            payload["response_format"] = response_format

        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=20)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]
            else:
                print(f"[AIOrchestrator] Groq error HTTP {resp.status_code}: {resp.text}")
                return None
        except Exception as e:
            print(f"[AIOrchestrator] Groq request failed: {e}")
            return None

    @staticmethod
    def explain_field(field_label: str, normalized_name: str, form_title: str, language: str = "en") -> Dict[str, Any]:
        """
        Generates contextual explanation, required format, examples, and supporting documents in EN, TE, or HI.
        Uses Groq if configured with gsk_ key, Gemini if configured with AIza key, or deterministic internal engine.
        """
        provider = settings.effective_llm_provider

        # 1. Groq LLM Provider
        if AIOrchestrator.is_external_ai_configured() and provider == "groq":
            try:
                lang_instruction = "Respond in clear English."
                if language == "te":
                    lang_instruction = "Respond in fluent Telugu (తెలుగు లిపి)."
                elif language == "hi":
                    lang_instruction = "Respond in fluent Hindi (हिन्दी लिपि)."

                prompt = f"""You are FormWise AI, an expert Indian application form guide and document specialist.
Form Title: "{form_title}"
Field Label: "{field_label}" (Normalized Key: {normalized_name})
Target Language: {language}

Provide a structured JSON object with exactly these four keys:
- "meaning": A clear, simple 1-2 sentence explanation of what this field is asking for and why it matters.
- "format_example": A realistic sample format (explicitly mark it as [Example]).
- "supporting_doc": Official certificate or document required in India (or "None required" if self-declaration).
- "warnings": Any critical pitfalls (e.g. spelling match with 10th marksheet, income certificate validity, masking Aadhaar).

{lang_instruction}
Return pure JSON with no markdown wrapping.
"""
                messages = [
                    {"role": "system", "content": "You are FormWise AI, a helpful Indian citizen document intelligence assistant. Always output valid JSON."},
                    {"role": "user", "content": prompt}
                ]

                groq_res = AIOrchestrator._call_groq(messages, response_format={"type": "json_object"}, max_tokens=600)
                if groq_res:
                    parsed = json.loads(groq_res.strip())
                    return {
                        "field_id": normalized_name,
                        "label": field_label,
                        "meaning": parsed.get("meaning", f"Enter details for {field_label}"),
                        "format_example": parsed.get("format_example", "[Example] Valid input"),
                        "supporting_doc": parsed.get("supporting_doc", "Relevant official document"),
                        "warnings": parsed.get("warnings", "Ensure details match verified certificates."),
                        "language": language
                    }
            except Exception as e:
                print(f"[AIOrchestrator] Groq explain_field error: {e}. Falling back to internal engine.")

        # 2. Google Gemini Provider
        elif AIOrchestrator.is_external_ai_configured() and provider == "gemini":
            try:
                from google import genai
                client = genai.Client(api_key=settings.LLM_API_KEY)
                
                lang_instruction = "Respond in English."
                if language == "te":
                    lang_instruction = "Respond in fluent Telugu (తెలుగు script)."
                elif language == "hi":
                    lang_instruction = "Respond in fluent Hindi (हिन्दी script)."

                prompt = f"""
You are FormWise AI, an expert Indian application form guide.
Form Title: "{form_title}"
Field Label: "{field_label}" (Normalized key: {normalized_name})
Target Language: {language}

Provide a structured JSON response with:
1. "meaning": A clear 1-2 sentence explanation of what this field is asking for and why it matters.
2. "format_example": A realistic sample format (explicitly mark it as [Example]).
3. "supporting_doc": Official certificate or document required in India (or "None required" if self-declaration).
4. "warnings": Any critical pitfalls.

{lang_instruction}
Return pure JSON with no markdown wrapping.
"""
                response = client.models.generate_content(
                    model=settings.LLM_MODEL,
                    contents=prompt
                )
                txt = response.text.strip()
                if txt.startswith("```"):
                    txt = txt.split("```")[1]
                    if txt.startswith("json"):
                        txt = txt[4:]
                return json.loads(txt.strip())
            except Exception as e:
                print(f"[AIOrchestrator] Gemini API call exception: {e}. Falling back to internal engine.")

        # 3. High-Fidelity Heuristic / Internal Multilingual Knowledge Engine (Deterministic Fallback)
        return AIOrchestrator._internal_field_explanation(normalized_name, field_label, language)

    @staticmethod
    def _internal_field_explanation(norm_name: str, label: str, language: str) -> Dict[str, Any]:
        # English Knowledge Base
        en_db = {
            "full_name": {
                "meaning": "Enter your complete official name exactly as printed on your 10th standard certificate or Aadhaar card.",
                "format_example": "[Example] RAMESH KUMAR REDDY (Use BLOCK capital letters)",
                "supporting_doc": "10th SSC Certificate or Aadhaar Card",
                "warnings": "Do not include titles like Mr., Shri, or Dr. Ensure spelling matches your certificate exactly."
            },
            "father_name": {
                "meaning": "Enter your father's official legal name as recognized in school records and caste/income certificates.",
                "format_example": "[Example] VENKATA SUBBAIAH REDDY",
                "supporting_doc": "10th Marksheet or Family Ration Card",
                "warnings": "Spelling must align with the income certificate submitted for scholarship eligibility."
            },
            "dob": {
                "meaning": "Enter the applicant's exact date of birth in Day/Month/Year format.",
                "format_example": "[Example] 15/08/2003",
                "supporting_doc": "10th SSC Board Certificate / Birth Certificate",
                "warnings": "Discrepancy in date of birth between school records and Aadhaar will lead to rejection."
            },
            "annual_income": {
                "meaning": "Enter the gross annual family income from all combined sources (salary, agriculture, business).",
                "format_example": "[Example] 150000 (Numeric value in Rupees, without commas)",
                "supporting_doc": "Income Certificate issued by Tahsildar / Revenue Authority (MRO)",
                "warnings": "Most government scholarships require annual income to be below ₹1.5 Lakhs or ₹2.5 Lakhs."
            },
            "category": {
                "meaning": "Select your constitutional reservation category to determine fee reimbursement and quota benefits.",
                "format_example": "[Example] OBC / BC-A / SC / ST / EWS / General",
                "supporting_doc": "Integrated Community, Nativity & Date of Birth Certificate",
                "warnings": "Must hold an active MeeSeva / e-District certificate number."
            },
            "mobile_number": {
                "meaning": "Enter your active 10-digit mobile number linked with your bank and Aadhaar.",
                "format_example": "[Example] 9876543210 (10 digits starting with 6-9)",
                "supporting_doc": "Active SIM card with SMS capability",
                "warnings": "All OTP verification codes and status updates will be dispatched to this number."
            },
            "pincode": {
                "meaning": "Enter the 6-digit postal index number of your permanent residential locality.",
                "format_example": "[Example] 500081",
                "supporting_doc": "Aadhaar Card / Voter ID / Utility Bill",
                "warnings": "Must match the district and state entered in your address."
            },
            "account_number_masked": {
                "meaning": "Enter your individual savings bank account number for direct scholarship benefit transfer (DBT).",
                "format_example": "[Example] 30981234567",
                "supporting_doc": "Bank Passbook First Page or Cancelled Cheque",
                "warnings": "Account must be seeded with Aadhaar and active (not dormant or joint account)."
            },
            "ifsc_code": {
                "meaning": "Enter the 11-character alphanumeric code identifying your specific bank branch.",
                "format_example": "[Example] SBIN0001234",
                "supporting_doc": "Bank Passbook or Cheque Leaf",
                "warnings": "The 5th character is always the digit zero '0'."
            }
        }

        # Telugu Knowledge Base (తెలుగు వివరణలు)
        te_db = {
            "full_name": {
                "meaning": "మీ 10వ తరగతి మార్కుల జాబితా లేదా ఆధార్ కార్డులో ఉన్న విధంగా మీ పూర్తి పేరును నమోదు చేయండి.",
                "format_example": "[ఉదాహరణ] రామేష్ కుమార్ రెడ్డి (పెద్ద అక్షరాలలో)",
                "supporting_doc": "10వ తరగతి సర్టిఫికేట్ లేదా ఆధార్ కార్డు",
                "warnings": "శ్రీ, మిస్టర్ వంటి బిరుదులు ఉపయోగించవద్దు. సర్టిఫికేట్‌తో అక్షరాలు సరిగ్గా సరిపోలాలి."
            },
            "father_name": {
                "meaning": "పాఠశాల రికార్డులు మరియు ఆదాయ ధృవీకరణ పత్రంలో ఉన్న మీ తండ్రిగారి అధికారిక పేరును రాయండి.",
                "format_example": "[ఉదాహరణ] వెంకట సుబ్బయ్య రెడ్డి",
                "supporting_doc": "10వ తరగతి సర్టిఫికేట్ లేదా రేషన్ కార్డు",
                "warnings": "స్కాలర్‌షిప్ దరఖాస్తు కోసం ఆదాయ సర్టిఫికేట్‌లోని పేరుతో సరిపోలాలి."
            },
            "dob": {
                "meaning": "మీ పుట్టిన తేదీని రోజు/నెల/సంవత్సరం ఫార్మాట్‌లో నమోదు చేయండి.",
                "format_example": "[ఉదాహరణ] 15/08/2003",
                "supporting_doc": "10వ తరగతి బోర్డు సర్టిఫికేట్ లేదా జనన ధృవీకరణ పత్రం",
                "warnings": "పాఠశాల రికార్డులు మరియు ఆధార్‌లోని పుట్టిన తేదీ ఒకేలా ఉండాలి."
            },
            "annual_income": {
                "meaning": "అన్ని మార్గాల ద్వారా మీ కుటుంబానికి వచ్చే మొత్తం వార్షిక ఆదాయాన్ని నమోదు చేయండి.",
                "format_example": "[ఉదాహరణ] 150000 (రూపాయలలో సంఖ్య)",
                "supporting_doc": "తహశీల్దార్ / MRO జారీ చేసిన ఆదాయ ధృవీకరణ పత్రం",
                "warnings": "ప్రభుత్వ స్కాలర్‌షిప్‌లకు సాధారణంగా ఆదాయ పరిమితి ₹2.5 లక్షల లోపు ఉండాలి."
            },
            "category": {
                "meaning": "ఫీజు రీయింబర్స్‌మెంట్ మరియు రిజర్వేషన్ ప్రయోజనాల కోసం మీ సామాజిక వర్గాన్ని ఎంచుకోండి.",
                "format_example": "[ఉదాహరణ] BC-A / SC / ST / EWS / జనరల్",
                "supporting_doc": "మీసేవ / అధికారిక కుల ధృవీకరణ పత్రం",
                "warnings": "ప్రస్తుతం చెల్లుబాటు అయ్యే కుల ధృవీకరణ పత్రం నంబర్ ఉండాలి."
            },
            "mobile_number": {
                "meaning": "మీ బ్యాంక్ ఖాతా మరియు ఆధార్‌తో అనుసంధానించబడిన 10 అంకెల మొబైల్ నంబర్‌ను నమోదు చేయండి.",
                "format_example": "[ఉదాహరణ] 9876543210",
                "supporting_doc": "క్రియాశీల మొబైల్ సిమ్ కార్డు",
                "warnings": "అన్ని OTP మరియు దరఖాస్తు సమాచారం ఈ నంబర్‌కు మాత్రమే వస్తాయి."
            },
            "account_number_masked": {
                "meaning": "స్కాలర్‌షిప్ నగదు నేరుగా జమ కావడానికి (DBT) మీ సేవింగ్స్ బ్యాంక్ ఖాతా నంబర్‌ను నమోదు చేయండి.",
                "format_example": "[ఉదాహరణ] 30981234567",
                "supporting_doc": "బ్యాంక్ పాస్‌బుక్ మొదటి పేజీ లేదా రద్దు చేసిన చెక్",
                "warnings": "ఖాతా ఆధార్‌తో లింక్ (NPCI Mapping) చేయబడి ఉండాలి. ఉమ్మడి ఖాతా అనుమతించబడదు."
            },
            "ifsc_code": {
                "meaning": "మీ బ్యాంక్ శాఖను గుర్తించే 11 అంకెల/అక్షరాల IFSC కోడ్‌ను నమోదు చేయండి.",
                "format_example": "[ఉదాహరణ] SBIN0001234",
                "supporting_doc": "బ్యాంక్ పాస్‌బుక్ లేదా చెక్కు",
                "warnings": "5వ అక్షరం ఎల్లప్పుడూ సున్నా '0' సంఖ్యగా ఉంటుంది."
            }
        }

        # Hindi Knowledge Base (हिन्दी विवरण)
        hi_db = {
            "full_name": {
                "meaning": "अपने 10वीं कक्षा के प्रमाणपत्र या आधार कार्ड के अनुसार अपना पूरा नाम दर्ज करें।",
                "format_example": "[उदाहरण] RAMESH KUMAR REDDY (बड़े अक्षरों में)",
                "supporting_doc": "10वीं मार्कशीट या आधार कार्ड",
                "warnings": "नाम के आगे श्री, मिस्टर आदि न लगाएं। स्पेलिंग दस्तावेजों से पूरी तरह मिलनी चाहिए।"
            },
            "annual_income": {
                "meaning": "सभी स्रोतों से परिवार की कुल वार्षिक आय दर्ज करें।",
                "format_example": "[उदाहरण] 150000 (रुपये में संख्या)",
                "supporting_doc": "सक्षम राजस्व अधिकारी (तहसीलदार) द्वारा जारी आय प्रमाण पत्र",
                "warnings": "छात्रवृत्ति के लिए आय प्रमाण पत्र चालू वित्तीय वर्ष का होना आवश्यक है।"
            }
        }

        selected_db = en_db
        if language == "te":
            selected_db = te_db
        elif language == "hi":
            selected_db = hi_db

        entry = selected_db.get(norm_name, None)
        if not entry and language != "en":
            entry = en_db.get(norm_name, None)

        if entry:
            return {
                "field_id": norm_name,
                "label": label,
                "meaning": entry["meaning"],
                "format_example": entry["format_example"],
                "supporting_doc": entry.get("supporting_doc", "Standard documentation"),
                "warnings": entry.get("warnings", "Ensure information matches official records."),
                "language": language
            }

        # Generic default
        return {
            "field_id": norm_name,
            "label": label,
            "meaning": f"Enter the requested information for {label} accurately in accordance with the application instructions.",
            "format_example": "[Example] Enter valid details as indicated",
            "supporting_doc": "Relevant supporting institutional certificate",
            "warnings": "Check that the spelling and figures match your personal profile.",
            "language": language
        }

    @staticmethod
    def chat_with_form_assistant(message: str, field_context: Optional[Dict[str, Any]], language: str = "en") -> Dict[str, Any]:
        """
        Conversational assistant answering citizen questions about forms, fields, and certificates.
        Uses Groq if configured, Gemini if configured, or deterministic fallback.
        """
        msg_lower = message.lower()
        provider = settings.effective_llm_provider

        # 1. Groq LLM Assistant
        if AIOrchestrator.is_external_ai_configured() and provider == "groq":
            try:
                lang_prompt = "English"
                if language == "te":
                    lang_prompt = "Telugu (తెలుగు)"
                elif language == "hi":
                    lang_prompt = "Hindi (हिन्दी)"

                system_prompt = f"""You are the FormWise AI Indian Citizen Application Assistant.
Your goal is to guide the citizen kindly, clearly, and concisely in 2-3 sentences.
Target Language: {lang_prompt}
Field Context: {json.dumps(field_context or {})}

Rules:
1. Always be practical, respectful, and simple.
2. If asking about a certificate (caste, income, residence), explain that it is obtained from MeeSeva, Tahsildar/MRO office, or DigiLocker in India.
3. If asking about income, clarify family gross income criteria.
4. If asking about banking, clarify that Aadhaar must be linked for Direct Benefit Transfer (DBT).
5. Provide your response directly in {lang_prompt}."""

                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ]

                reply_text = AIOrchestrator._call_groq(messages, max_tokens=500)
                if reply_text:
                    return {
                        "reply": reply_text.strip(),
                        "suggested_action": "review_field",
                        "language": language
                    }
            except Exception as e:
                print(f"[AIOrchestrator] Groq chat error: {e}. Falling back to internal engine.")

        # 2. Gemini Assistant
        elif AIOrchestrator.is_external_ai_configured() and provider == "gemini":
            try:
                from google import genai
                client = genai.Client(api_key=settings.LLM_API_KEY)
                
                lang_prompt = "English"
                if language == "te":
                    lang_prompt = "Telugu (తెలుగు)"
                elif language == "hi":
                    lang_prompt = "Hindi (हिन्दी)"

                system_prompt = f"""
You are the FormWise AI Indian Document & Application Assistant.
Help the citizen complete their application form accurately.
Context Field: {json.dumps(field_context or {})}
Language: {lang_prompt}

Rules:
1. Always be polite, practical, and clear.
2. If asking about a document, explain where they can get it (e.g. MeeSeva, Tahsildar, DigiLocker, College).
3. Provide response in {lang_prompt}.
"""
                response = client.models.generate_content(
                    model=settings.LLM_MODEL,
                    contents=[system_prompt, message]
                )
                return {
                    "reply": response.text.strip(),
                    "suggested_action": "review_field",
                    "language": language
                }
            except Exception as e:
                print(f"[AIOrchestrator] Gemini Chat fallback triggered: {e}")

        # 3. Deterministic multilingual assistant responses (Fallback)
        if "document" in msg_lower or "certificate" in msg_lower or "సర్టిఫికేట్" in msg_lower or "దస్తావేజు" in msg_lower:
            if language == "te":
                reply = "ఈ దరఖాస్తుకు సాధారణంగా 10వ తరగతి మార్కుల జాబితా, కుల ధృవీకరణ పత్రం, తాజా ఆదాయ సర్టిఫికేట్ మరియు బ్యాంక్ పాస్‌బుక్ కాపీ అవసరం. మీరు వీటిని మీ 'డాక్యుమెంట్ వాల్ట్' (Document Vault) లో అప్‌లోడ్ చేసి భద్రపరచుకోవచ్చు."
            else:
                reply = "For this application, the key required supporting documents typically include: 10th SSC Marksheet (for Date of Birth and Name verification), Income Certificate issued by Tahsildar/Revenue authority, Community/Caste Certificate (if claiming reservation), and Bank Passbook (first page with IFSC for Direct Benefit Transfer). You can upload these to your secure Document Vault."
            action = "open_vault"
        elif "income" in msg_lower or "ఆదాయం" in msg_lower or "आय" in msg_lower:
            if language == "te":
                reply = "వార్షిక కుటుంబ ఆదాయం (Annual Family Income) అంటే కుటుంబ సభ్యులందరి మొత్తం వార్షిక రాబడి. మీసేవ లేదా రెవెన్యూ అధికారి జారీ చేసిన ఆదాయ ధృవీకరణ పత్రంలో పేర్కొన్న మొత్తాన్ని ఇక్కడ నమోదు చేయాలి."
            else:
                reply = "Annual Family Income refers to the combined annual gross income from all sources (salary, agriculture, or business) of your household. You should enter the exact figure mentioned on your official Income Certificate issued by the competent Revenue Authority (Tahsildar/MRO)."
            action = "autofill_income"
        elif "bank" in msg_lower or "ifsc" in msg_lower or "బ్యాంక్" in msg_lower:
            if language == "te":
                reply = "మీ బ్యాంక్ పాస్‌బుక్ మొదటి పేజీలో ఉన్న ఖాతా సంఖ్య మరియు 11 అంకెల IFSC కోడ్‌ను నమోదు చేయండి. ఖాతా మీ ఆధార్‌తో NPCI ద్వారా లింక్ చేయబడి ఉండాలి."
            else:
                reply = "Enter the account number and 11-digit IFSC code from the front page of your bank passbook. Ensure the account is an active savings account in your name seeded with Aadhaar for Direct Benefit Transfer (DBT)."
            action = "verify_bank"
        else:
            if language == "te":
                reply = "మీ దరఖాస్తును సరిగ్గా పూరించడానికి సహాయం చేయడానికి నేను ఇక్కడ ఉన్నాను. మీరు ఏదైనా ఫీల్డ్ లేదా అవసరమైన సర్టిఫికేట్ గురించి నన్ను అడగవచ్చు."
            else:
                reply = "I am here to help you complete your application accurately. You can select any field to see what documents are required or ask me questions about income limits, certificates, or formatting."
            action = "explore_fields"

        return {
            "reply": reply,
            "suggested_action": action,
            "language": language
        }
