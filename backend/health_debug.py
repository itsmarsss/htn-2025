import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/health', methods=['GET'])
def health_check():
    print("=== HEALTH CHECK REQUEST ===")
    print(f"Request method: {request.method}")
    print(f"Request URL: {request.url}")
    print(f"Request headers: {dict(request.headers)}")
    print(f"Request args: {dict(request.args)}")
    
    print("\n=== ALL ENVIRONMENT VARIABLES ===")
    for key, value in sorted(os.environ.items()):
        if any(keyword in key.upper() for keyword in ['API', 'KEY', 'OPENAI', 'ANTHROPIC', 'TOKEN']):
            if 'KEY' in key.upper() or 'TOKEN' in key.upper():
                # Mask sensitive values
                masked = value[:8] + '...' + value[-4:] if len(value) > 12 else '***'
                print(f"{key}: {masked}")
            else:
                print(f"{key}: {value}")
    
    # Check for API credentials
    openai_key = os.getenv('OPENAI_API_KEY')
    anthropic_key = os.getenv('ANTHROPIC_API_KEY')
    
    print(f"\n=== API KEY DETECTION ===")
    print(f"OPENAI_API_KEY exists: {bool(openai_key)}")
    print(f"ANTHROPIC_API_KEY exists: {bool(anthropic_key)}")
    
    if openai_key:
        print(f"OPENAI_API_KEY length: {len(openai_key)}")
        print(f"OPENAI_API_KEY starts with: {openai_key[:10]}...")
    
    if anthropic_key:
        print(f"ANTHROPIC_API_KEY length: {len(anthropic_key)}")
        print(f"ANTHROPIC_API_KEY starts with: {anthropic_key[:10]}...")
    
    api_key = openai_key or anthropic_key
    provider = None
    base_url = None
    model = None
    has_key = bool(api_key)
    
    # Determine provider based on available keys
    if openai_key:
        provider = 'openai'
        base_url = os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1')
        model = os.getenv('OPENAI_MODEL', 'gpt-4')
    elif anthropic_key:
        provider = 'anthropic'
        base_url = os.getenv('ANTHROPIC_BASE_URL', 'https://api.anthropic.com')
        model = os.getenv('ANTHROPIC_MODEL', 'claude-3-sonnet-20240229')
    
    print(f"\n=== PROVIDER DETECTION ===")
    print(f"Provider: {provider}")
    print(f"Base URL: {base_url}")
    print(f"Model: {model}")
    print(f"Has API Key: {has_key}")
    
    # Test API connection if credentials are available
    ok = False
    if has_key and provider:
        try:
            print(f"\n=== TESTING {provider.upper()} API CONNECTION ===")
            if provider == 'openai':
                test_url = f"{base_url}/models"
                headers = {
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json'
                }
            elif provider == 'anthropic':
                test_url = f"{base_url}/v1/messages"
                headers = {
                    'x-api-key': api_key,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                }
            
            print(f"Test URL: {test_url}")
            print(f"Headers: {headers}")
            
            # Make a test request
            response = requests.get(test_url, headers=headers, timeout=10)
            print(f"Response status: {response.status_code}")
            print(f"Response headers: {dict(response.headers)}")
            print(f"Response body (first 500 chars): {response.text[:500]}")
            
            ok = response.status_code == 200
            
        except Exception as e:
            print(f"API test failed with error: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            ok = False
    else:
        print(f"\n=== NO API TEST (has_key={has_key}, provider={provider}) ===")
    
    result = {
        "ok": ok,
        "provider": provider,
        "baseUrl": base_url,
        "model": model,
        "hasKey": has_key
    }
    
    print(f"\n=== FINAL RESULT ===")
    print(f"Health check result: {result}")
    print("=== END HEALTH CHECK ===\n")
    
    return jsonify(result)

if __name__ == '__main__':
    print("Starting health debug server on port 8787...")
    app.run(host='0.0.0.0', port=8787, debug=True)
