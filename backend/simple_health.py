import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/health', methods=['GET'])
def health_check():
    print("\n" + "="*60)
    print("=== HEALTH CHECK REQUEST START ===")
    print("="*60)
    
    # Log request details
    print(f"Request method: {request.method}")
    print(f"Request URL: {request.url}")
    print(f"Request headers: {dict(request.headers)}")
    print(f"Request args: {dict(request.args)}")
    print(f"Request remote_addr: {request.remote_addr}")
    print(f"Request user_agent: {request.headers.get('User-Agent', 'Unknown')}")
    
    print("\n--- ENVIRONMENT VARIABLES ---")
    # Check for API credentials
    openai_key = os.getenv('OPENAI_API_KEY')
    anthropic_key = os.getenv('ANTHROPIC_API_KEY')
    
    print(f"OPENAI_API_KEY exists: {bool(openai_key)}")
    print(f"ANTHROPIC_API_KEY exists: {bool(anthropic_key)}")
    
    if openai_key:
        print(f"OPENAI_API_KEY length: {len(openai_key)}")
        print(f"OPENAI_API_KEY starts with: {openai_key[:10]}...")
        print(f"OPENAI_API_KEY ends with: ...{openai_key[-4:]}")
    else:
        print("OPENAI_API_KEY: NOT SET")
        
    if anthropic_key:
        print(f"ANTHROPIC_API_KEY length: {len(anthropic_key)}")
        print(f"ANTHROPIC_API_KEY starts with: {anthropic_key[:10]}...")
        print(f"ANTHROPIC_API_KEY ends with: ...{anthropic_key[-4:]}")
    else:
        print("ANTHROPIC_API_KEY: NOT SET")
    
    # Log all environment variables containing API, KEY, or TOKEN
    print("\n--- ALL API-RELATED ENVIRONMENT VARIABLES ---")
    api_env_vars = []
    for key, value in os.environ.items():
        if any(keyword in key.upper() for keyword in ['API', 'KEY', 'TOKEN', 'OPENAI', 'ANTHROPIC']):
            if 'KEY' in key.upper() or 'TOKEN' in key.upper():
                # Mask sensitive values
                masked = value[:8] + '...' + value[-4:] if len(value) > 12 else '***'
                api_env_vars.append(f"{key}: {masked}")
            else:
                api_env_vars.append(f"{key}: {value}")
    
    if api_env_vars:
        for var in sorted(api_env_vars):
            print(var)
    else:
        print("No API-related environment variables found")
    
    # Determine provider and configuration
    api_key = openai_key or anthropic_key
    provider = None
    base_url = None
    model = None
    has_key = bool(api_key)
    
    print("\n--- PROVIDER DETECTION ---")
    if openai_key:
        provider = 'openai'
        base_url = os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1')
        model = os.getenv('OPENAI_MODEL', 'gpt-4')
        print(f"Detected provider: OpenAI")
        print(f"OpenAI base URL: {base_url}")
        print(f"OpenAI model: {model}")
    elif anthropic_key:
        provider = 'anthropic'
        base_url = os.getenv('ANTHROPIC_BASE_URL', 'https://api.anthropic.com')
        model = os.getenv('ANTHROPIC_MODEL', 'claude-3-sonnet-20240229')
        print(f"Detected provider: Anthropic")
        print(f"Anthropic base URL: {base_url}")
        print(f"Anthropic model: {model}")
    else:
        print("No provider detected - no API keys found")
    
    print(f"Final provider: {provider}")
    print(f"Final base URL: {base_url}")
    print(f"Final model: {model}")
    print(f"Has API Key: {has_key}")
    
    # Test API connection if credentials are available
    ok = False
    if has_key and provider:
        print(f"\n--- TESTING {provider.upper()} API CONNECTION ---")
        try:
            if provider == 'openai':
                test_url = f"{base_url}/models"
                headers = {
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json'
                }
                print(f"Testing OpenAI API at: {test_url}")
            elif provider == 'anthropic':
                test_url = f"{base_url}/v1/messages"
                headers = {
                    'x-api-key': api_key,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                }
                print(f"Testing Anthropic API at: {test_url}")
            
            print(f"Request headers: {headers}")
            print("Making API request...")
            
            # Make a test request
            response = requests.get(test_url, headers=headers, timeout=10)
            print(f"Response status code: {response.status_code}")
            print(f"Response headers: {dict(response.headers)}")
            print(f"Response body (first 200 chars): {response.text[:200]}")
            
            if response.status_code == 200:
                print("✅ API connection successful!")
                ok = True
            else:
                print(f"❌ API connection failed with status {response.status_code}")
                ok = False
            
        except requests.exceptions.Timeout:
            print("❌ API request timed out")
            ok = False
        except requests.exceptions.ConnectionError as e:
            print(f"❌ API connection error: {str(e)}")
            ok = False
        except requests.exceptions.RequestException as e:
            print(f"❌ API request error: {str(e)}")
            ok = False
        except Exception as e:
            print(f"❌ Unexpected error during API test: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            ok = False
    else:
        print(f"\n--- SKIPPING API TEST ---")
        print(f"Reason: has_key={has_key}, provider={provider}")
    
    # Prepare result
    result = {
        "ok": ok,
        "provider": provider,
        "baseUrl": base_url,
        "model": model,
        "hasKey": has_key
    }
    
    print(f"\n--- FINAL RESULT ---")
    print(f"Health check result: {result}")
    print("="*60)
    print("=== HEALTH CHECK REQUEST END ===")
    print("="*60 + "\n")
    
    return jsonify(result)

if __name__ == '__main__':
    print("🚀 Starting enhanced health debug server...")
    print("📍 Server will run on http://127.0.0.1:8787")
    print("🔍 Detailed logs will be shown for each request")
    print("="*60)
    app.run(host='127.0.0.1', port=8787, debug=False)
