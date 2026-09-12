# 🚀 Complete Deployment & Production Setup Guide

This guide provides everything needed to deploy the **SewNex / QTech Intelligent Line Balancing & Smart Factory Platform** with all sample data, migrations, and AI capabilities on any server (DigitalOcean, AWS, GCP, Azure, Hetzner, VPS, or On-Premise).

---

## 📦 What Is Included & Ready for Deployment

1. **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS v4 running on high-performance **Nginx Alpine**.
2. **Backend**: Spring Boot 3 + Java 21 LTS API on Eclipse Temurin with G1GC optimization and actuator health probes.
3. **Database**: PostgreSQL 16 + automated **Flyway Migrations (`V1` – `V52`)**.
4. **Rich Pre-Loaded Sample Data**:
   - **50 Standardized Garment Operators** with complete skill matrix and affinities
   - **18 Industrial Sewing Operations** with standard SMV, machine classification, and skill ratings
   - **8 Apparel Styles** (Nike Polo, Uniqlo LifeWear, Formal Shirts, Denims, T-Shirts, etc.)
   - **5 Production Orders** with dynamic takt time, deadlines, and delivery horizons
   - **5 Pre-configured Operation Bulletins** with customized WIP buffer thresholds (15–30 pcs)
   - **Sewing Lines & Machine Inventory** (SNLS, Overlock 4-Thread, Flatlock, Button Sew, etc.)
   - **Historical Production Logs & Manager Bottleneck Notifications**
5. **Standalone SQL Snapshot**: [`backend/src/main/resources/db/sample_database_dump.sql`](file:///c:/Users/Admin/Desktop/SkilGobal/Line-Balancing-Application/backend/src/main/resources/db/sample_database_dump.sql) (832 KB full database backup).

---

## ⚡ 1-Step Deployment with Docker Compose (Recommended)

### Prerequisites
- Docker Engine & Docker Compose installed on your server/machine.

### Run in 1 Command:
```bash
# 1. Clone or navigate to the repository
cd Line-Balancing-Application

# 2. Build and launch all containers in detached mode
docker compose up -d --build
```

### Accessing the System:
- **Web App (Frontend UI)**: `http://YOUR_SERVER_IP` or `http://localhost` (also available on port `3000`)
- **Backend REST API**: `http://YOUR_SERVER_IP:8085/api`
- **Actuator Health Check**: `http://YOUR_SERVER_IP:8085/actuator/health`

---

## 💾 Database Initialization Options

### Option A: Automatic Flyway Migration (Default - Zero Effort)
When you start the containers with `docker compose up -d`, Spring Boot's Flyway automatically creates the complete schema and seeds all sample records from migrations `V1` to `V52`.

### Option B: Restore Directly from the SQL Dump
If you ever want to restore the clean snapshot into a running PostgreSQL container:
```bash
docker exec -i qtech-postgres psql -U postgres -d qtech_linebalancing < backend/src/main/resources/db/sample_database_dump.sql
```

---

## 🛠️ Environment Configuration (`.env`)

You can customize runtime settings in the `.env` file:

```env
# Application Ports
PORT=8085
FRONTEND_PORT=80
FRONTEND_ALT_PORT=3000

# PostgreSQL Settings
POSTGRES_DB=qtech_linebalancing
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password123
POSTGRES_PORT=5432

# Flyway Settings
SPRING_FLYWAY_ENABLED=true
SPRING_FLYWAY_BASELINE_ON_MIGRATE=true
SPRING_FLYWAY_OUT_OF_ORDER=true

# AI Assistant
LLM_API_KEY=YOUR_GEMINI_OR_LLM_API_KEY
LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
LLM_MODEL=gemini-3.8-flash
```

---

## 🌐 Deploying to DigitalOcean Ubuntu Droplet

### 1. Connect to Droplet:
```bash
ssh root@YOUR_DROPLET_IP
```

### 2. Run Automated Server Setup:
```bash
# Installs Docker, Docker Compose, 4GB Swap memory, and UFW Firewall:
bash ./scripts/setup-droplet.sh
```

### 3. Launch the Stack:
```bash
docker compose up -d --build
```

### 4. Enable Free HTTPS (SSL) with Certbot (Optional):
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 🔄 Management & Maintenance Commands

| Action | Command |
|---|---|
| **View real-time logs** | `docker compose logs -f` |
| **View backend logs** | `docker compose logs -f backend` |
| **Restart services** | `docker compose restart` |
| **Stop application** | `docker compose down` |
| **Take fresh database backup** | `docker exec -t qtech-postgres pg_dump -U postgres qtech_linebalancing > backup_$(date +%F).sql` |
| **Monitor resource usage** | `docker stats` |
