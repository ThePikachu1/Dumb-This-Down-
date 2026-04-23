# Dumb This Down — Chrome Extension

Simplifies selected text to a 5th grade reading level using AWS Lambda + API Gateway + Amazon Bedrock (Nova Lite).

---

## Project Structure

```
dumb-this-down/
├── extension/          ← Load this folder into Chrome
│   ├── manifest.json
│   ├── config.js       ← EDIT THIS with your API Gateway URL
│   ├── content.js
│   ├── popup.html
│   ├── popup.js
│   └── icon.png
└── lambda/
    ├── index.js        ← Paste this into Lambda (or upload as zip)
    └── package.json
```

---

## Setup Steps

### 1. AWS Lambda

1. Go to AWS Console → Lambda → Create Function
2. Name it `dumb-this-down`, runtime **Node.js 20.x**
3. Paste the contents of `lambda/index.js` into the inline editor
4. Go to **Configuration → General Configuration → Edit** and set timeout to **30 seconds**
5. Go to **Configuration → Permissions**, click the role name
6. In IAM, add an inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "arn:aws:bedrock:*::foundation-model/amazon.nova-lite-v1:0"
    }
  ]
}
```

7. **Test Lambda** using this test event before moving on:
```json
{ "body": "{\"text\": \"The mitochondria is the powerhouse of the cell.\"}" }
```
You should get a 200 with a `simplified` field in the body.

---

### 2. API Gateway

1. Go to API Gateway → Create API → **HTTP API** → Build
2. Add Integration → Lambda → select your function
3. Route: **POST /simplify**
4. Deploy to stage `$default` (or rename to `prod`)
5. Go to **CORS** in the sidebar:
   - Allow Origins: `*`
   - Allow Methods: `POST`
   - Allow Headers: `Content-Type`
6. Copy the **Invoke URL** from the API details page

---

### 3. Chrome Extension

1. Open `extension/config.js` and replace `YOUR_API_GATEWAY_URL_HERE` with your full invoke URL:
   ```js
   const API_URL = "https://abc123.execute-api.us-east-1.amazonaws.com/simplify";
   ```
   No trailing slash.

2. Go to `chrome://extensions`
3. Enable **Developer Mode** (top right toggle)
4. Click **Load Unpacked** → select the `extension/` folder
5. Go to any webpage, highlight some text, click **Dumb It Down**

---

## Common Issues

| Symptom | Fix |
|---|---|
| Lambda times out | Set timeout to 30s (default is 3s) |
| CORS error in browser | Check CORS in API Gateway AND `Access-Control-Allow-Origin: *` in Lambda response headers |
| `AccessDeniedException` from Bedrock | Add the IAM inline policy to the Lambda execution role |
| API Gateway 502 | Check CloudWatch logs — Lambda returned a malformed response |
| API Gateway 403 | URL is wrong or has trailing slash — confirm it ends with `/simplify` |
| Button doesn't appear | Reload the extension at `chrome://extensions` after any file edit |
| Nova Lite not found | Lambda must be in `us-east-1` and model access must be granted in Bedrock |

---

## Bedrock Model Access

1. Go to AWS Console → Amazon Bedrock → **Model Access** (left sidebar)
2. Find **Amazon Nova Lite** and click **Request Access**
3. Approval is usually instant

Must be done **before** the workshop or Lambda calls will fail with `AccessDeniedException`.
