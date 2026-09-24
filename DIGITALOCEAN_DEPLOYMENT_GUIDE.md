# 🌊 DigitalOcean Droplet Deployment Guide (SewNex Application)

This guide walks you through deploying the complete **SewNex / QTech Line Balancing Application** (PostgreSQL 16 + Java 21 Spring Boot + React Vite Frontend) on a **DigitalOcean Ubuntu Droplet** using Docker Compose.

---

## 📋 Recommended Droplet Specifications

| Specification | Recommended Setting |
|---|---|
| **Image / OS** | **Ubuntu 24.04 LTS** (x64) |
| **Droplet Plan** | **Basic** -> **Regular or Premium AMD CPU** |
| **CPU & RAM** | **2 vCPUs / 4 GB RAM** ($24/month) *(or 2 vCPUs / 2 GB RAM with swap for $12/month)* |
| **Datacenter Region** | Bangalore (`blr1`), Singapore (`sgp1`), Frankfurt (`fra1`), or your closest region |
| **Authentication** | SSH Key (Recommended) or Strong Root Password |

---

## 🚀 Step-by-Step Deployment

### Step 1: Create Your Droplet in DigitalOcean
1. Log in to [DigitalOcean Cloud Console](https://cloud.digitalocean.com/).
2. Click **Create** (top right) -> **Droplets**.
3. Select **Ubuntu 24.04 LTS**, **2 vCPU / 4 GB RAM**, and your preferred datacenter.
4. Click **Create Droplet** and copy the **Public IPv4 Address** (e.g., `159.65.123.45`).

---

### Step 2: Connect to Your Droplet & Run the 1-Click Setup

Open your terminal or PowerShell on your computer and SSH into your Droplet:

```bash
ssh root@YOUR_DROPLET_IP
```

Download and run the automated setup script (installs Docker, Docker Compose, 4GB Swap, and UFW Firewall):

```bash
curl -fsSL https://raw.githubusercontent.com/your-org/Line-Balancing-Application/main/scripts/setup-droplet.sh | bash
```
*(Or clone your repository and run `bash ./scripts/setup-droplet.sh` directly)*.

---

### Step 3: Clone Your Repository & Launch the Application

```bash
# 1. Clone your project
git clone https://github.com/your-org/Line-Balancing-Application.git
cd Line-Balancing-Application

# 2. Build and launch all containers in detached mode
docker compose up -d --build
```

---

### Step 4: Access Your Application! 🎉

Once started, open your web browser:
- **Frontend Web Application:** `http://YOUR_DROPLET_IP` *(or `http://YOUR_DROPLET_IP:3000`)*
- **Backend API & Health Probes:** `http://YOUR_DROPLET_IP:8085/actuator/health`

### 📦 End-to-End Sample Data Included Automatically:
Flyway automatically executes all database migrations and seeds the complete enterprise dataset on the first launch:
- **2 Active Production Sewing Lines** (Line 01 - T-Shirt Assembly & Line 02 - Polo Shirt Assembly)
- **2 Production Orders** (Nike Activewear: 20,000 pcs & Tommy Hilfiger: 9,200 pcs)
- **2 Published Operation Bulletins** (Crewneck T-Shirt 8-Op Assembly & Polo Shirt 10-Op Assembly)
- **50 Factory Operators** (EMP-001 to EMP-050 with complete skill profiles, roles, and departments)
- **900 Calibrated Skill Matrix Assessments** (1 to 5 star ratings across all 18 standard operations)
- **14 Fleet Machines** (Single Needle Lockstitch, Overlock, Interlock, Flatlock, Bar Tack, etc.)
- **Active Line Plans & Workstation Assignments** (Line 01: 11 station assignments, Line 02: 10 station assignments)
- **Live Production Timesheets & Piece Logs** (Flow-balanced 145 pcs finished output, 113.9% floor efficiency dynamically synchronized to `CURRENT_DATE`)
- **Daily Biometric Attendance** (All 50 operators marked present with on-time check-ins for `CURRENT_DATE`)
- **Capacity Plans, Takt Pacing Profiles, and Line Designs** (125 pcs/hr & 100 pcs/hr targets)

---

## 🔒 Optional: Add a Custom Domain & Free SSL (HTTPS)

If you have a domain name (e.g., `sewnex.yourcompany.com`):

1. **Add a DNS A-Record:**
   - Point `sewnex.yourcompany.com` -> `YOUR_DROPLET_IP`.

2. **Install Nginx & Certbot for Free SSL:**
   ```bash
   sudo apt-get install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d sewnex.yourcompany.com
   ```
   *Certbot will automatically obtain a free Let's Encrypt certificate and renew it forever.*

---

## 🔄 How to Update Your Application When Code Changes

Whenever you push new changes to GitHub:

```bash
cd Line-Balancing-Application

# 1. Pull the latest code
git pull origin main

# 2. Rebuild and restart with zero hassle
docker compose up -d --build
```

---

## 💾 Automated Daily Database Backups (Cron Job)

To ensure your factory manufacturing data is always safely backed up:

1. **Create a backup script:**
   ```bash
   cat << 'EOF' > /root/backup-db.sh
   #!/bin/bash
   BACKUP_DIR="/root/db-backups"
   mkdir -p $BACKUP_DIR
   DATE=$(date +%Y-%m-%d_%H%M%S)
   docker exec -t qtech-postgres pg_dump -U postgres qtech_linebalancing | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"
   # Keep last 7 days of backups
   find $BACKUP_DIR -type f -mtime +7 -name "*.sql.gz" -exec rm {} \;
   EOF
   chmod +x /root/backup-db.sh
   ```

2. **Schedule it to run every night at 2:00 AM:**
   ```bash
   (crontab -l 2>/dev/null; echo "0 2 * * * /root/backup-db.sh") | crontab -
   ```

---

## 🛠️ Common Docker Maintenance Commands

| Task | Command |
|---|---|
| **View live logs of all services** | `docker compose logs -f` |
| **View backend logs only** | `docker compose logs -f backend` |
| **Restart all containers** | `docker compose restart` |
| **Stop everything** | `docker compose down` |
| **Check container resource usage (CPU/RAM)** | `docker stats` |
