<#
.SYNOPSIS
    SewNex / QTech Line Balancing Application - 1-Click GCP Deployment Automation (PowerShell)
    Automates: APIs, Cloud SQL (PostgreSQL), Artifact Registry, Cloud Run Backend & Frontend
#>

[CmdletBinding()]
param(
    [string]$Region = "asia-south1",
    [string]$DbInstanceName = "sewnex-postgres-db",
    [string]$DbName = "qtech_linebalancing",
    [string]$DbUser = "postgres",
    [string]$DbTier = "db-g1-small",
    [string]$RepoName = "sewnex-app-repo"
)

$ErrorActionPreference = "Stop"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   SewNex / QTech Line Balancing - GCP Production Deployment    " -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# 1. Verification of GCP Project
$ProjectId = (gcloud config get-value project 2>$null).Trim()
if ([string]::IsNullOrWhiteSpace($ProjectId)) {
    Write-Error "No active GCP project found. Run 'gcloud config set project YOUR_PROJECT_ID' first."
}

Write-Host "Deploying to Project: $ProjectId" -ForegroundColor Green
Write-Host "Target Region:       $Region" -ForegroundColor Green

# 2. Enable APIs
Write-Host "`nStep 1: Enabling Required GCP Services..." -ForegroundColor Yellow
gcloud services enable `
    run.googleapis.com `
    sqladmin.googleapis.com `
    artifactregistry.googleapis.com `
    secretmanager.googleapis.com `
    vpcaccess.googleapis.com `
    cloudbuild.googleapis.com

# 3. Create Artifact Registry Docker Repository
Write-Host "`nStep 2: Checking Artifact Registry..." -ForegroundColor Yellow
$repoExists = gcloud artifacts repositories describe $RepoName --location=$Region 2>$null
if (-not $repoExists) {
    Write-Host "Creating Artifact Registry repository '$RepoName' in $Region..."
    gcloud artifacts repositories create $RepoName `
        --repository-format=docker `
        --location=$Region `
        --description="Docker repository for SewNex Application"
} else {
    Write-Host "Artifact Registry repository '$RepoName' already exists."
}

# 4. Provision Cloud SQL PostgreSQL Instance
Write-Host "`nStep 3: Checking Cloud SQL PostgreSQL Instance..." -ForegroundColor Yellow
$instanceExists = gcloud sql instances describe $DbInstanceName 2>$null
if (-not $instanceExists) {
    $DbPassword = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})
    Write-Host "Creating Cloud SQL PostgreSQL 16 instance '$DbInstanceName' (Tier: $DbTier)... This takes ~4-5 minutes."
    gcloud sql instances create $DbInstanceName `
        --database-version=POSTGRES_16 `
        --tier=$DbTier `
        --region=$Region `
        --root-password=$DbPassword `
        --storage-auto-increase `
        --backup-start-time=02:00

    Write-Host "Creating database '$DbName'..."
    gcloud sql databases create $DbName --instance=$DbInstanceName

    # Store DB password in Secret Manager
    $DbPassword | gcloud secrets create sewnex-db-password --data-file=- --replication-policy=automatic 2>$null
} else {
    Write-Host "Cloud SQL instance '$DbInstanceName' already exists."
}

$ConnectionName = (gcloud sql instances describe $DbInstanceName --format="value(connectionName)").Trim()
Write-Host "Cloud SQL Connection Name: $ConnectionName" -ForegroundColor Green

# 5. Build and Push Backend Image
Write-Host "`nStep 4: Building Backend Container Image..." -ForegroundColor Yellow
$BackendImage = "$Region-docker.pkg.dev/$ProjectId/$RepoName/backend:latest"
gcloud builds submit ./backend --tag $BackendImage

# 6. Deploy Backend to Cloud Run
Write-Host "`nStep 5: Deploying Backend API to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy sewnex-backend `
    --image=$BackendImage `
    --platform=managed `
    --region=$Region `
    --allow-unauthenticated `
    --port=8085 `
    --memory=1Gi `
    --cpu=1 `
    --min-instances=0 `
    --max-instances=5 `
    --add-cloudsql-instances=$ConnectionName `
    --set-env-vars="SPRING_PROFILES_ACTIVE=prod,SPRING_DATASOURCE_URL=jdbc:postgresql:///${DbName}?cloudSqlInstance=${ConnectionName}&socketFactory=com.google.cloud.sql.postgres.SocketFactory,SPRING_DATASOURCE_USERNAME=${DbUser},CORS_ALLOWED_ORIGINS=*" `
    --set-secrets="SPRING_DATASOURCE_PASSWORD=sewnex-db-password:latest"

$BackendUrl = (gcloud run services describe sewnex-backend --platform=managed --region=$Region --format="value(status.url)").Trim()
Write-Host "Backend Deployed Successfully at: $BackendUrl" -ForegroundColor Green

# 7. Build and Push Frontend Image
Write-Host "`nStep 6: Building Frontend Container Image..." -ForegroundColor Yellow
$FrontendImage = "$Region-docker.pkg.dev/$ProjectId/$RepoName/frontend:latest"
gcloud builds submit ./frontend `
    --tag $FrontendImage

# 8. Deploy Frontend to Cloud Run
Write-Host "`nStep 7: Deploying Frontend SPA to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy sewnex-frontend `
    --image=$FrontendImage `
    --platform=managed `
    --region=$Region `
    --allow-unauthenticated `
    --port=80 `
    --memory=512Mi `
    --cpu=1 `
    --min-instances=0 `
    --max-instances=5

$FrontendUrl = (gcloud run services describe sewnex-frontend --platform=managed --region=$Region --format="value(status.url)").Trim()

# 9. Update Backend CORS to securely allow the Frontend URL
Write-Host "`nStep 8: Updating Backend CORS for Frontend URL..." -ForegroundColor Yellow
gcloud run services update sewnex-backend `
    --platform=managed `
    --region=$Region `
    --update-env-vars="CORS_ALLOWED_ORIGINS=${FrontendUrl},http://localhost:5173,http://localhost:3000"

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "  🎉 DEPLOYMENT COMPLETE! APPLICATION IS LIVE ON GCP 🎉" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Frontend URL: $FrontendUrl" -ForegroundColor Green
Write-Host "Backend API:  $BackendUrl/api" -ForegroundColor Green
Write-Host "Health Check: $BackendUrl/actuator/health" -ForegroundColor Green
Write-Host "Database:     $ConnectionName" -ForegroundColor Green
