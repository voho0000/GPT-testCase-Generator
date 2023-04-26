from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import openai
import requests
import json
from dotenv import load_dotenv
import os

# Load the .env file located in the project directory
load_dotenv()
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

app = Flask(__name__)
CORS(app)

@app.route('/generate_test_case', methods=['POST'])
@cross_origin()
def generate_test_case():
    prompt = request.json['prompt']
    defect_description = request.json['defectDescription']   

    # Combine prompt and defect_description
    full_prompt = f"{prompt} {defect_description}"

    print(full_prompt)

    # Call GPT-3 API with the defect_description
    data = {
        "model": "gpt-3.5-turbo",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": full_prompt}
        ],
        "max_tokens": 2000,
        "temperature": 0.5
    }

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f"Bearer {OPENAI_API_KEY}"
    }

    response = requests.post(
        'https://api.openai.com/v1/chat/completions', headers=headers, data=json.dumps(data))
    response_json = response.json()
    print(response_json)

    test_steps = response_json['choices'][0]['message']['content'].strip()

    print(test_steps)

    return jsonify(test_steps=test_steps)

if __name__ == '__main__':
    app.run()
