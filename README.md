# Dumb This Down

Build a Chrome extension that takes confusing text from any webpage and rewrites it in simpler language using AWS Lambda, API Gateway, and Amazon Bedrock Nova Lite.

```txt
Chrome Extension -> API Gateway -> AWS Lambda -> Amazon Bedrock Nova Lite
```

By the end, you will have a working browser extension where you can highlight text, click the red `D` button, and get a simplified version back.

---

## What You Are Building

This project has two parts:

1. A **Chrome extension** that runs in your browser.
2. An **AWS backend** that sends text to Amazon Bedrock and returns the simplified version.

The browser does not call Bedrock directly. The extension calls your API Gateway URL, API Gateway invokes Lambda, and Lambda calls Bedrock using its AWS execution role.

---

## Before You Start

You need:

- A Chrome or Chromium-based browser
- An AWS account
- Access to the AWS Console
- This project folder on your computer
- Basic comfort copying code into AWS Lambda

Use this AWS region for the whole project:

```txt
us-east-1
```

Keeping everything in one region avoids most setup headaches.

---

## Project Files

```txt
dumb-this-down/
|-- README.md
|-- .gitignore
|-- extension/
|   |-- manifest.json
|   |-- config.js
|   |-- background.js
|   |-- content.js
|   |-- popup.html
|   |-- popup.js
|   `-- icon.png
`-- lambda/
    |-- index.js
    `-- package.json
```

The important files are:

| File | What It Does |
|---|---|
| `extension/config.js` | Stores your API Gateway URL locally |
| `extension/background.js` | Sends selected text to your backend |
| `extension/content.js` | Adds the red `D` button and result panel to webpages |
| `extension/popup.html` | Builds the extension popup |
| `extension/popup.js` | Handles popup state and copy behavior |
| `lambda/index.js` | Runs in AWS Lambda and calls Amazon Bedrock |

---

## Step 1: Create The Lambda Function

Open the AWS Console and go to:

```txt
Lambda -> Create function
```

Use these settings:

| Setting | Value |
|---|---|
| Authoring option | Author from scratch |
| Function name | `dumb-this-down` |
| Runtime | `Node.js 20.x` |
| Architecture | `x86_64` |
| Region | `us-east-1` |

Create the function.

Then set the timeout:

```txt
Lambda -> Configuration -> General configuration -> Edit
```

Set:

```txt
Timeout: 30 seconds
```

Save.

---

## Step 2: Add The Lambda Code

Open this local file:

```txt
lambda/index.js
```

Copy the whole file.

In AWS Lambda:

```txt
Code -> index.js
```

Paste the code into the editor.

Click:

```txt
Deploy
```

---

## Step 3: Add The IAM Inline Policy

Lambda needs permission to:

- Write logs to CloudWatch
- Call Amazon Bedrock Nova Lite

Go to:

```txt
Lambda -> Configuration -> Permissions
```

Click the Lambda **execution role** link. This opens IAM.

In IAM, choose:

```txt
Add permissions -> Create inline policy
```

Choose the JSON editor and paste this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "logs:CreateLogGroup",
      "Resource": "arn:aws:logs:us-east-1:179388325443:"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": [
        "arn:aws:logs:us-east-1:179388325443:log-group:/aws/lambda/dumb-this-down:"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "arn:aws:bedrock:*::foundation-model/amazon.nova-lite-v1:0"
    }
  ]
}
```

Name the policy:

```txt
DumbThisDownLambdaPolicy
```

Save it.

Important: add this policy to the **Lambda execution role**, not your AWS user and not the root account.

The IAM policy above is what lets the Lambda call Nova Lite.

---

## Step 4: Test Lambda

In your Lambda function, go to:

```txt
Test -> Create new event
```

Use this test event:

```json
{
  "body": "{\"text\": \"The mitochondria is the powerhouse of the cell.\"}"
}
```

Click:

```txt
Test
```

A successful result should have:

```txt
statusCode: 200
```

The response body should include a simplified sentence.

If you get `statusCode: 500`, open the logs:

```txt
Monitor -> View CloudWatch logs
```

Look for the line that starts with:

```txt
Bedrock error:
```

That line usually tells you exactly what is wrong.

---

## Step 5: Create API Gateway

Go to:

```txt
API Gateway -> Create API
```

Choose:

```txt
HTTP API -> Build
```

Add an integration:

| Setting | Value |
|---|---|
| Integration type | Lambda |
| Lambda function | `dumb-this-down` |
| Region | `us-east-1` |

Create the route:

```txt
POST /simplify
```

Deploy the API.

You can use the default stage:

```txt
$default
```

or a named stage like:

```txt
prod
```

---

## Step 6: Turn On CORS

In your HTTP API, open:

```txt
CORS
```

Use these settings:

| CORS Setting | Value |
|---|---|
| Access-Control-Allow-Origin | `*` |
| Access-Control-Allow-Methods | `POST, OPTIONS` |
| Access-Control-Allow-Headers | `Content-Type` |

Save.

If your API does not auto-deploy, deploy the API again after changing CORS.

---

## Step 7: Copy The Correct API URL

Find your API Gateway invoke URL.

If you used the `$default` stage, your final URL usually looks like:

```txt
https://abc123.execute-api.us-east-1.amazonaws.com/simplify
```

If you used a `prod` stage, your final URL usually looks like:

```txt
https://abc123.execute-api.us-east-1.amazonaws.com/prod/simplify
```

Do not add a trailing slash.

Use:

```txt
/simplify
```

Not:

```txt
/simplify/
```

---

## Step 8: Test API Gateway

From your terminal, test your API URL:

```bash
curl -i -X POST "https://abc123.execute-api.us-east-1.amazonaws.com/simplify" \
  -H "Content-Type: application/json" \
  -d '{"text":"The mitochondria is the powerhouse of the cell."}'
```

Replace the example URL with your real URL.

You want:

```txt
HTTP/2 200
```

and a response body with simplified text.

If you get `404`, your route or stage URL is wrong.

If you get `500`, Lambda is being reached but something inside Lambda failed. Check CloudWatch logs.

---

## Step 9: Add Your API URL To The Extension

Open:

```txt
extension/config.js
```

Set `API_URL` to your real API Gateway URL:

```js
const API_URL = "https://abc123.execute-api.us-east-1.amazonaws.com/simplify";
```

Save the file.

Keep `extension/config.js` local. Do not commit a real personal API endpoint if this project is public.

---

## Step 10: Load The Chrome Extension

Open Chrome and go to:

```txt
chrome://extensions
```

Turn on:

```txt
Developer mode
```

Click:

```txt
Load unpacked
```

Choose the local folder:

```txt
extension/
```

You should now see **Dumb This Down** in your extensions list.

Whenever you edit `extension/config.js`, click the reload button for the extension on `chrome://extensions`.

---

## Step 11: Try The Demo

Open a normal webpage.

Highlight one sentence, such as:

```txt
The mitochondria is the powerhouse of the cell.
```

Click the red `D` button.

The extension should show a small result panel with a simpler version of the selected text.

You can also open the extension popup to copy the latest result.

---

## Good Text To Test

Try short examples first.

Medical:

```txt
Hypertension may remain asymptomatic while contributing to cardiovascular morbidity over time.
```

Legal:

```txt
The lessee shall indemnify and hold harmless the lessor from any and all claims arising therefrom.
```

School:

```txt
Photosynthesis converts light energy into chemical energy through a sequence of reactions.
```

Corporate:

```txt
We need to operationalize cross-functional alignment to maximize stakeholder visibility.
```

Tech:

```txt
The client failed to authenticate because the provided token was malformed or expired.
```

---

## Troubleshooting

| Problem | What It Usually Means | What To Check |
|---|---|---|
| `Failed to fetch` | Browser could not reach the API | CORS, API URL, extension reload, region |
| `API returned 404` | API Gateway route or stage is wrong | Confirm `POST /simplify` and the exact stage path |
| `API returned 500` | Lambda ran but failed | Open CloudWatch logs |
| `AccessDeniedException` | Lambda role cannot call Bedrock | IAM policy is on the wrong role or missing `bedrock:InvokeModel` |
| Lambda test returns `500` | Backend issue | Check the `Bedrock error:` log line |
| Button does not appear | Extension is not loaded or disabled | Reload the extension and check the popup toggle |
| CORS error | Browser preflight failed | Add `POST`, `OPTIONS`, `Content-Type`, and origin `*` |
| Extension still uses old URL | Chrome has old extension state | Reload the extension at `chrome://extensions` |
| Lambda times out | Timeout is too short | Set timeout to 30 seconds |

---

## Common Fixes

### Fix A: Wrong API URL

If your API uses `$default`, use:

```txt
https://abc123.execute-api.us-east-1.amazonaws.com/simplify
```

If your API uses `prod`, use:

```txt
https://abc123.execute-api.us-east-1.amazonaws.com/prod/simplify
```

### Fix B: Policy Added To The Wrong Identity

The IAM policy must be on the Lambda execution role.

Find it from:

```txt
Lambda -> Configuration -> Permissions -> Execution role
```

Do not attach the policy only to your AWS user or root account.

### Fix C: Extension Was Not Reloaded

After changing `extension/config.js`, go to:

```txt
chrome://extensions
```

Click reload on **Dumb This Down**.

---

## Security Notes

- Do not put AWS access keys in the Chrome extension.
- The extension should only contain your API Gateway URL.
- Lambda calls Bedrock using its execution role.
- Keep real endpoints out of public repos when possible.
- For a production app, add authentication, rate limiting, monitoring, and stricter CORS.

---

## Cleanup

When you are done experimenting, you can delete the AWS resources to avoid future charges:

1. Delete the API Gateway HTTP API.
2. Delete the Lambda function.
3. Delete the IAM role if it is no longer used.
4. Remove any CloudWatch log groups you do not need.

The local Chrome extension files can stay on your computer.
