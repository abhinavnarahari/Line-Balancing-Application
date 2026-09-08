#!/usr/bin/env bash
# ==============================================================================
# SewNex / QTech Line Balancing - DigitalOcean Ubuntu Droplet 1-Click Setup Script
# Installs: Docker, Docker Compose, Git, UFW Firewall, Swap Memory Optimization
# ==============================================================================

set -e

# Output Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}   SewNexa Application - DigitalOcean Droplet Environment Setup  ${NC}"
echo -e "${BLUE}================================================================${NC}"

# 1. Update OS Packages
echo -e "\n${YELLOW}[1/5] Updating Ubuntu packages...${NC}"
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y curl wget git ufw apt-transport-https ca-certificates gnupg lsb-release

# 2. Configure 4GB Swap File (Ensures Java 21 & PostgreSQL never run OOM)
echo -e "\n${YELLOW}[2/5] Configuring 4GB Swap Space...${NC}"
if [ ! -f /swapfile ]; then
    sudo fallocate -l 4G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    echo -e "${GREEN}4GB Swap successfully enabled.${NC}"
else
    echo "Swap file already exists."
fi

# 3. Install Docker Engine & Docker Compose Plugin
echo -e "\n${YELLOW}[3/5] Installing Docker Engine & Compose...${NC}"
if ! command -v docker &> /dev/null; then
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
    echo -e "${GREEN}Docker installed successfully.${NC}"
else
    echo "Docker is already installed."
fi

# 4. Configure UFW Firewall
echo -e "\n${YELLOW}[4/5] Configuring UFW Firewall...${NC}"
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP Web'
sudo ufw allow 443/tcp comment 'HTTPS SSL'
sudo ufw allow 3000/tcp comment 'Frontend Port'
sudo ufw allow 8085/tcp comment 'Backend API Port'
sudo ufw --force enable
echo -e "${GREEN}Firewall configured (Ports 22, 80, 443, 3000, 8085 open).${NC}"

# 5. Success Message & Next Steps
echo -e "\n${BLUE}================================================================${NC}"
echo -e "${GREEN}  🎉 DROPLET INITIALIZATION COMPLETE! 🎉${NC}"
echo -e "${BLUE}================================================================${NC}"
echo -e "Next steps to run the application:"
echo -e "1. Clone your project:"
echo -e "   ${YELLOW}git clone <YOUR_GIT_REPO_URL>${NC}"
echo -e "   ${YELLOW}cd Line-Balancing-Application${NC}"
echo -e "2. Start everything in the background:"
echo -e "   ${YELLOW}docker compose up -d --build${NC}"
echo -e "3. Open your browser:"
echo -e "   ${GREEN}http://$(curl -s ifconfig.me)${NC}"
