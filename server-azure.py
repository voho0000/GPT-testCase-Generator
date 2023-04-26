from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import openai
import requests
import json
from dotenv import load_dotenv
import os

# Load the .env file located in the project directory
load_dotenv()
AZURE_API_KEY = os.getenv('AZURE_API_KEY')

openai.api_type = "azure"
# replace with you api endpoint
openai.api_base = "https://YourOwn-OpenAI-EndPoint.openai.azure.com/"
openai.api_version = "2023-03-15-preview"
openai.api_key = AZURE_API_KEY

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

    # If you use a GPT-3 series model, use the following code to call api
    '''
    response = openai.Completion.create(
        engine="text-davinci-003",
        prompt=prompt,
        temperature=0.5,
        max_tokens=1000,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0,
        stop=None)
    test_steps = response['choices'][0]['text'].strip()
    '''

    # If you use GPT 3.5 or GPT 4, use the following code to call api
    response = openai.ChatCompletion.create(
        engine="gpt-35-turbo",  # engine="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": full_prompt}
        ],
        temperature=0.5,
        max_tokens=1000,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0,
        stop=None)

    test_steps = response['choices'][0]['message']['content'].strip()

    print(test_steps)

    return jsonify(test_steps=test_steps)


if __name__ == '__main__':
    app.run()
