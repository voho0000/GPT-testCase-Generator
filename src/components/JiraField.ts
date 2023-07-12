import axios, { AxiosResponse } from 'axios';

interface FormData {
    name?: string;
    caseSuite: string[];
    manualTestCoverage: string;
    caseSource: string;
    generatedBy: string;
    mainTicket: string;
    manualTestEnvironment: string;
    preCondition: string;
    testStep: string;
    expectedResult: string;
    xRelease: string;
    Priority: string;
}

interface EnumOption {
    name: string;
    gid: string;
}

interface CustomField {
    name: string;
    gid: string;
    type: string;
    enum_options?: EnumOption[];
}

export async function createJiraTask(formData: FormData, projectGid: string, email: string, apiKey: string) {
    let name = "[MS][AI] " + formData.name;
    name = name.replace(/\n$/, '');
    const result: any = await axios.post("https://aics-his.atlassian.net/rest/api/2/issue", 
        {
            "fields": {
                "project": {
                    "id": "10058"
                },
                "summary": name,
                "issuetype": {
                    "id": "10070"
                },
                "customfield_10014": "TC-5501",
                "customfield_10182": {"value":"MS Backlog"},
                "customfield_10187": {"value":"MS Backlog"},
                "customfield_10168": {"value":formData.generatedBy},
                "customfield_10166": formData.mainTicket,
                "customfield_10174": {"value":formData.manualTestCoverage},
                "customfield_10159": {"value":formData.caseSource},
                "priority": {"id":"3"},
                "customfield_10155": formData.preCondition,
                "customfield_10156": formData.testStep,
                "customfield_10157": formData.expectedResult,
            }
        },
        {
            headers: {
                'Content-Type': 'application/json'
            },
            auth: {
                username: email,
                password: apiKey
            }
        });
    if (result.status !== 201) {
        throw new Error("Create ticket failed. Please try again.");
    }
    console.log(result.response)
    // get user account id for later assigned assignee
    const getIssue: any = await axios.get("https://aics-his.atlassian.net/rest/api/3/issue/"+result.data.key,{
        headers: {
            'Content-Type': 'application/json'
        },
        auth: {
            username: email,
            password: apiKey
        }
    })
    const accountId = getIssue.data.fields.reporter.accountId;

    // update assignee for new create ticket
    const putAssignee: any = await axios.put("https://aics-his.atlassian.net/rest/api/3/issue/"+result.data.key+"/assignee",
    {
        accountId: accountId,
    },
    {
        headers: {
            'Content-Type': 'application/json'
        },
        auth: {
            username: email,
            password: apiKey
        }
    })
    // update defect MasterScript status to AI Generate
    const regex = /(CED-\d+|XD-\d+|XFT-\d+)/;
    const match = formData.mainTicket.match(regex);
    const updatePayload = {
        "fields": {
            "customfield_10146": {
            value: 'Done(GenAI)',
          },
        },
    };
    const updateDefect: any = await axios.put("https://aics-his.atlassian.net/rest/api/3/issue/"+match![0],
    updatePayload,
    {
        headers: {
            'Content-Type': 'application/json'
        },
        auth: {
            username: email,
            password: apiKey
        }
    })
    // update relateed link to defect ticket
    const updateRelatedLink: any = await axios.post("https://aics-his.atlassian.net/rest/api/2/issueLink",
    {
        "type": {
            "name": "Relates"
        },
        "inwardIssue": {
            "key": match![0]
        },
        "outwardIssue": {
            "key": result.data.key
        }
    },
    {
        headers: {
            'Content-Type': 'application/json'
        },
        auth: {
            username: email,
            password: apiKey
        }
    })
    if (updateRelatedLink.status !== 201) {
        throw new Error("Link related ticket failed. Please try again.");
    }
    return { task_url: result.data.key }
}
