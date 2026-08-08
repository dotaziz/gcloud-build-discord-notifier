# Cloud Build Discord Notifier (TypeScript Port)

This notifier uses Discord Webhooks to send notifications about your Google Cloud Build runs to a Discord channel.

It runs as a containerized service via Google Cloud Run and responds to events that Cloud Build publishes via its default Pub/Sub topic (`cloud-builds`).

## How it Works

Unlike the Go version which relies on the compiled `cloud-build-notifiers` framework binary, this TypeScript version runs as a lightweight Express application. When Cloud Build publishes status events to the Pub/Sub topic, Pub/Sub makes a secure HTTP POST request containing the build JSON payload to your Cloud Run service.

## Configuration Variables

This notifier expects the following structure in your configuration YAML file:

- **`webhookUrl`**: A `secretRef: <name>` map referencing the secret entry holding your Discord Webhook URL.
- **`filter`**: Optional status or substitution filters to control which build events trigger notifications.
- **`template`**: Optional Handlebars-based JSON template string to customize the output message structure.

### Example configuration (`discord.yaml`):

```yaml
apiVersion: cloud-build-notifiers/v1
kind: DiscordNotifier
metadata:
  name: example-discord-notifier
spec:
  notification:
    filter:
      statuses:
        - SUCCESS
        - FAILURE
        - TIMEOUT
    delivery:
      webhookUrl:
        secretRef: webhook-url
  secrets:
  - name: webhook-url
    value: projects/<YOUR_PROJECT_ID>/secrets/discord-webhook-url/versions/latest
```

---

## Setup & Deployment Guide

Follow these commands to deploy and configure the notifier on GCP:

### 1. Store your Discord Webhook URL in Secret Manager
```bash
echo -n "https://discord.com/api/webhooks/..." | gcloud secrets create discord-webhook-url --data-file=- --replication-policy="automatic"
```

### 2. Upload your YAML configuration to Google Cloud Storage
Create `discord.yaml` and upload it to a bucket:
```bash
gcloud storage cp discord.yaml gs://<YOUR_BUCKET_NAME>/discord.yaml
```

### 3. Deploy the Service to Google Cloud Run
Compile and build the container remotely, configuring the environment variables:
```bash
gcloud run deploy gcloud-build-discord-notifier \
  --source . \
  --platform managed \
  --region us-central1 \
  --no-allow-unauthenticated \
  --set-env-vars="CONFIG_PATH=gs://<YOUR_BUCKET_NAME>/discord.yaml"
```

### 4. Configure IAM Service Permissions
Whichever service account runs your Cloud Run container (default is `PROJECT_NUMBER-compute@developer.gserviceaccount.com`), grant it permissions:

* **Secret Accessor role:**
  ```bash
  gcloud projects add-iam-policy-binding <YOUR_PROJECT_ID> \
    --member="serviceAccount:<SERVICE_ACCOUNT>" \
    --role="roles/secretmanager.secretAccessor"
  ```
* **Storage Viewer role:**
  ```bash
  gcloud projects add-iam-policy-binding <YOUR_PROJECT_ID> \
    --member="serviceAccount:<SERVICE_ACCOUNT>" \
    --role="roles/storage.objectViewer"
  ```

### 5. Map the Cloud Build Pub/Sub Topic to Cloud Run
Retrieve the service URL and create a secure Pub/Sub Push Subscription to the `cloud-builds` topic:

```bash
# Get your service URL
SERVICE_URL=$(gcloud run services describe gcloud-build-discord-notifier \
  --platform managed \
  --region us-central1 \
  --format='value(status.url)')

# Grant Pub/Sub permission to create OIDC identity tokens
gcloud projects add-iam-policy-binding <YOUR_PROJECT_ID> \
  --member="serviceAccount:service-<YOUR_PROJECT_NUMBER>@gcp-sa-pubsub.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountTokenCreator"

# Create the subscription
gcloud pubsub subscriptions create cloud-builds-to-discord-sub \
  --topic=cloud-builds \
  --push-endpoint=$SERVICE_URL \
  --push-auth-service-account=<SERVICE_ACCOUNT>
```

---

## Local Development

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Run tests:**
   ```bash
   pnpm test
   ```

3. **Start local development server:**
   ```bash
   CONFIG_PATH=./test/test-discord.yml pnpm dev
   ```
