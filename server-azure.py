from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
import openai
import requests
import json
from dotenv import load_dotenv
import os
import asana
import re

# Load the .env file located in the project directory
load_dotenv()
AZURE_API_KEY = os.getenv('AZURE_API_KEY')
project_gid = '1203880491753826'  # master script


openai.api_type = "azure"
# replace with you api endpoint
openai.api_base =  "https://user1-create-gpt.openai.azure.com/"
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
    full_prompt = f"{prompt} *** {defect_description} ***"

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
        #engine="gpt-35-turbo",  
        engine="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": full_prompt}
        ],
        temperature=0,
        max_tokens=3000,
        #top_p=1,
        #frequency_penalty=0,
        #presence_penalty=0,
        #stop=None
        )

    test_steps = response['choices'][0]['message']['content'].strip()

    print(test_steps)

    return jsonify(test_steps=test_steps)


def get_custom_field_gid(project_gid, api_key):
    url = f"https://app.asana.com/api/1.0/projects/{project_gid}/custom_field_settings"

    headers = {
        "Authorization": f"Bearer {api_key}",
    }

    response = requests.get(url, headers=headers)
    result = response.json()

    fields_option_gid = {}
    for item in result['data']:
        if item['custom_field']['type'] in ['enum', 'multi_enum']:
            enum_options = item['custom_field']['enum_options']
            option_gid = {opt['name']: opt['gid'] for opt in enum_options}
            fields_option_gid[item['custom_field']['name']] = {
                'enum_options': option_gid, 'type': item['custom_field']['type']}
        else:
            fields_option_gid[item['custom_field']['name']] = {'type': item['custom_field']['type']}

    fields_gid = {}
    for item in result['data']:
        fields_gid[item['custom_field']['name']] = item['custom_field']['gid']

    return fields_gid, fields_option_gid

def create_custom_fields(formData, fields_gid, fields_option_gid):
    custom_field_data = {
        "CaseSuite": formData['caseSuite'],
        "Manual Test Coverage": formData["manualTestCoverage"],
        "Case Source": formData['caseSource'],
        "Generated By": formData['generatedBy'],
        "MainTicket": formData['mainTicket'],
        "Manual Test Environment": formData['manualTestEnvironment'],
        "Pre-Condition": formData['preCondition'],
        "Test Step": formData['testStep'],
        "Expected Result": formData['expectedResult'],
        "xRelease": formData['xRelease'],
        "Manual Test Priority": formData['Priority']
    }

    custom_fields = {}

    for field_name, field_options in fields_option_gid.items():
        field_type = field_options.get('type')
        if not (custom_field_data.get(field_name)):
            continue
        if field_type == 'enum':
            # Get the gid of the enum option
            enum_gid = field_options['enum_options'].get(custom_field_data.get(field_name))
            if enum_gid:
                custom_fields[field_name] = enum_gid
        elif field_type == 'multi_enum':
            # Get the gids of the multi-enum options
            if type(custom_field_data.get(field_name))==str:
                multi_enum_values = [field_options['enum_options'].get(custom_field_data.get(field_name))]
            elif custom_field_data.get(field_name)==None:
                multi_enum_values = None
            else:
                multi_enum_values = [field_options['enum_options'][name] for name in custom_field_data.get(field_name)]
            if multi_enum_values:
                custom_fields[field_name] =  multi_enum_values
        else:
            # Assume it's a text field
            text_value = custom_field_data.get(field_name)
            if text_value:
                custom_fields[field_name] = text_value

    custom_fields_final= {
        fields_gid["CaseSuite"]:  custom_fields['CaseSuite'],
        fields_gid["Manual Test Coverage"]: custom_fields["Manual Test Coverage"],
        fields_gid["Case Source"]:  custom_fields['Case Source'],
        fields_gid["Generated By"]:  custom_fields['Generated By'],
        fields_gid["MainTicket"]: custom_fields['MainTicket'],
        fields_gid["Manual Test Environment"]: custom_fields['Manual Test Environment'],
        fields_gid["Pre-Condition"]:  custom_fields['Pre-Condition'],
        fields_gid["Test Step"]:  custom_fields['Test Step'],
        fields_gid["Expected Result"]: custom_fields['Expected Result'],
    }

    return custom_fields_final

@app.route('/create_task', methods=['POST'])
@cross_origin(project_gid)
def create_task():
    formData = request.json
    print(formData)
    client = asana.Client.access_token(ASANA_API_KEY)
    client.headers.update({
        "Asana-Enable": "new_user_task_lists,new_goal_memberships"
    })

    task_id_pattern = r"/(\d+)(/f)?$"

    match = re.search(task_id_pattern, formData['mainTicket'])

    if match:
        defect_gid = match.group(1)
    else:
        raise ValueError("Please provide asana task URL")

    defect_task = client.tasks.get_task(
        defect_gid, opt_fields=["custom_fields", "Priority"])
    for field in defect_task['custom_fields']:
        if field['gid'] == '1204151393723065':  # xRelease gid
            xRelease = field['display_value']
            formData['xRelease'] = xRelease
            print(xRelease)
        if field['gid'] == '977653033713577':  # Priority gid
            Priority = field['display_value']
            formData['Priority'] = Priority
            print(Priority)

    fields_gid, fields_option_gid = get_custom_field_gid(project_gid, ASANA_API_KEY)

    custom_fields = create_custom_fields(formData, fields_gid, fields_option_gid)

    if formData['generatedBy']=="Human":
        name = "[MS] "+formData['name']
    else:
        name = "[MS][AI] "+formData['name']


    result = client.tasks.create_task({
        "projects": [project_gid],
        "name": name,
        "custom_fields": custom_fields
    })

    print(result["permalink_url"])

    return jsonify(task_url=result["permalink_url"])


if __name__ == '__main__':
    app.run()

