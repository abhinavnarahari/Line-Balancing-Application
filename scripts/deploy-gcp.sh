#!/usr/bin/env bash
# ==============================================================================
# SewNex / QTech Line Balancing Application - 1-Click GCP Deployment Automation
# Automates: APIs, Cloud SQL (PostgreSQL), Artifact Registry, Cloud Run Backend & Frontend
# ==============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}   SewNex / QTech Line Balancing - GCP Production Deployment    ${NC}"
echo -e "${BLUE}================================================================${NC}"

# 1. Configuration & Default Variables
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
REGION=${REGION:-"asia-south1"}
DB_INSTANCE_NAME=${DB_INSTANCE_NAME:-"sewnex-postgres-db"}
DB_NAME=${DB_NAME:-"qtech_linebalancing"}
DB_USER=${DB_USER:-"postgres"}
DB_TIER=${DB_TIER:-"db-g1-small"} # or db-custom-2-7680 for high production load
REPO_NAME=${REPO_NAME:-"sewnex-app-repo"}

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: No active GCP project found. Run 'gcloud config set project YOUR_PROJECT_ID' first.${NC}"
    exit 1
fi

echo -e "${GREEN}Deploying to Project:${NC} $PROJECT_ID"
echo -e "${GREEN}Target Region:${NC}       $REGION"

# 2. Enable Required GCP APIs
echo -e "\n${YELLOW}Step 1: Enabling Required GCP Services...${NC}"
gcloud services enable \
    run.googleapis.com \
    sqladmin.googleapis.com \
    artifactregistry.googleapis.com \
    secretmanager.googleapis.com \
    vpcaccess.googleapis.com \
    cloudbuild.googleapis.com

# 3. Create Artifact Registry Docker Repository
echo -e "\n${YELLOW}Step 2: Checking Artifact Registry...${NC}"
if ! gcloud artifacts repositories describe $REPO_NAME --location=$REGION &>/dev/null; then
    echo "Creating Artifact Registry repository '$REPO_NAME' in $REGION..."
    gcloud artifacts repositories create $REPO_NAME \
        --repository-format=docker \
        --location=$REGION \
        --description="Docker repository for SewNex Application"
else
    echo "Artifact Registry repository '$REPO_NAME' already exists."
fi

# 4. Provision Cloud SQL PostgreSQL Instance
echo -e "\n${YELLOW}Step 3: Checking Cloud SQL PostgreSQL Instance...${NC}"
if ! gcloud sql instances describe $DB_INSTANCE_NAME &>/dev/null; then
    DB_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)
    echo "Creating Cloud SQL PostgreSQL 16 instance '$DB_INSTANCE_NAME' (Tier: $DB_TIER)... This takes ~4-5 minutes."
    gcloud sql instances create $DB_INSTANCE_NAME \
        --database-version=POSTGRES_16 \
        --tier=$DB_TIER \
        --region=$REGION \
        --root-password=$DB_PASSWORD \
        --storage-auto-increase \
        --backup-start-time=02:00

    echo "Creating database '$DB_NAME'..."
    gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE_NAME

    # Store DB password in Secret Manager
    echo -n "$DB_PASSWORD" | gcloud secrets create sewnex-db-password --data-file=- --replication-policy=automatic || \
    echo -n "$DB_PASSWORD" | gcloud secrets versions add sewnex-db-password --data-file=-
else
    echo "Cloud SQL instance '$DB_INSTANCE_NAME' already exists."
    CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME --format="value(connectionName)")
fi

CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE_NAME --format="value(connectionName)")
echo -e "${GREEN}Cloud SQL Connection Name:${NC} $CONNECTION_NAME"

# 5. Build and Push Backend Image
echo -e "\n${YELLOW}Step 4: Building Backend Container Image...${NC}"
BACKEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/backend:latest"
gcloud builds submit ./backend --tag $BACKEND_IMAGE

# 6. Deploy Backend to Cloud Run
echo -e "\n${YELLOW}Step 5: Deploying Backend API to Cloud Run...${NC}"
gcloud run deploy sewnex-backend \
    --image=$BACKEND_IMAGE \
    --platform=managed \
    --region=$REGION \
    --allow-unauthenticated \
    --port=8085 \
    --memory=1Gi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=5 \
    --add-cloudsql-instances=$CONNECTION_NAME \
    --set-env-vars="SPRING_PROFILES_ACTIVE=prod,SPRING_DATASOURCE_URL=jdbc:postgresql:///${DB_NAME}?cloudSqlInstance=${CONNECTION_NAME}&socketFactory=com.google.cloud.sql.postgres.SocketFactory,SPRING_DATASOURCE_USERNAME=${DB_USER},CORS_ALLOWED_ORIGINS=*" \
    --set-secrets="SPRING_DATASOURCE_PASSWORD=sewnex-db-password:latest"

BACKEND_URL=$(gcloud run services describe sewnex-backend --platform=managed --region=$REGION --format="value(status.url)")
echo -e "${GREEN}Backend Deployed Successfully at:${NC} $BACKEND_URL"

# 7. Build and Push Frontend Image
echo -e "\n${YELLOW}Step 6: Building Frontend Container Image...${NC}"
FRONTEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/frontend:latest"
gcloud builds submit ./frontend \
    --tag $FRONTEND_IMAGE \
    --substitutions="_VITE_API_BASE_URL=${BACKEND_URL}/api"

# 8. Deploy Frontend to Cloud Run
echo -e "\n${YELLOW}Step 7: Deploying Frontend SPA to Cloud Run...${NC}"
gcloud run deploy sewnex-frontend \
    --image=$FRONTEND_IMAGE \
    --platform=managed \
    --region=$REGION \
    --allow-unauthenticated \
    --port=80 \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=5

FRONTEND_URL=$(gcloud run services describe sewnex-frontend --platform=managed --region=$REGION --format="value(status.url)")

# 9. Update Backend CORS to securely allow the Frontend URL
echo -e "\n${YELLOW}Step 8: Updating Backend CORS for Frontend URL...${NC}"
gcloud run services update sewnex-backend \
    --platform=managed \
    --region=$REGION \
    --update-env-vars="CORS_ALLOWED_ORIGINS=${FRONTEND_URL},http://localhost:5173,http://localhost:3000"

echo -e "\n${BLUE}================================================================${NC}"
echo -e "${GREEN}  🎉 DEPLOYMENT COMPLETE! APPLICATION IS LIVE ON GCP 🎉${NC}"
echo -e "${BLUE}================================================================${NC}"
echo -e "Frontend URL: ${GREEN}${FRONTEND_URL}${NC}"
echo -e "Backend API:  ${GREEN}${BACKEND_URL}/api${NC}"
echo -e "Health Check: ${GREEN}${BACKEND_URL}/actuator/health${NC}"
echo -e "Database:     ${GREEN}${CONNECTION_NAME}${NC}"
