#!/usr/bin/env bash
# =============================================================
# Rain Forecasting System — Step-by-Step Deployment Script
# Target: AWS EC2 (backend) + S3 (frontend)
# Run this from the project root on your LOCAL machine.
# =============================================================

set -euo pipefail

# ── Config — Edit these ──────────────────────────────────────
EC2_IP=""                       # Your EC2 Elastic IP
EC2_KEY="rain-forecasting.pem"  # Path to your .pem key file
EC2_USER="ec2-user"
S3_BUCKET="rain-forecasting-frontend"
AWS_REGION="ap-south-1"
BACKEND_API_URL="http://${EC2_IP}:5000"

RED='\033[0;31m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'
log()   { echo -e "${BLUE}[INFO]${NC}  $1"; }
success(){ echo -e "${GREEN}[✓]${NC}    $1"; }
error() { echo -e "${RED}[✗]${NC}    $1"; exit 1; }

# ─────────────────────────────────────────────────────────────
# STEP 1: Validate pre-requisites
# ─────────────────────────────────────────────────────────────
step1_validate() {
  log "Step 1: Validating prerequisites..."
  [ -z "$EC2_IP" ]   && error "EC2_IP is not set. Edit this script first."
  [ -f "$EC2_KEY" ]  || error "EC2 key file not found: $EC2_KEY"
  command -v aws     >/dev/null || error "AWS CLI not installed (pip install awscli)"
  command -v ssh     >/dev/null || error "ssh not found"
  command -v rsync   >/dev/null || error "rsync not found"
  chmod 400 "$EC2_KEY"
  success "Prerequisites OK"
}

# ─────────────────────────────────────────────────────────────
# STEP 2: Train the ML model locally (or on EC2)
# ─────────────────────────────────────────────────────────────
step2_train_model() {
  log "Step 2: Training ML model..."
  cd ml
  python3 -m pip install -r requirements.txt -q
  python3 train_model.py
  success "Model trained and saved to ml/models/"
  cd ..
}

# ─────────────────────────────────────────────────────────────
# STEP 3: Sync backend + ML to EC2
# ─────────────────────────────────────────────────────────────
step3_deploy_backend() {
  log "Step 3: Deploying backend to EC2 (${EC2_IP})..."

  # Rsync project files (exclude node_modules, .env, __pycache__)
  rsync -avz \
    --exclude 'node_modules' \
    --exclude '.env' \
    --exclude '__pycache__' \
    --exclude '*.pyc' \
    --exclude 'client' \
    -e "ssh -i $EC2_KEY -o StrictHostKeyChecking=no" \
    . "${EC2_USER}@${EC2_IP}:/home/${EC2_USER}/rain-forecasting-system/"

  # Install deps & restart services on EC2
  ssh -i "$EC2_KEY" -o StrictHostKeyChecking=no "${EC2_USER}@${EC2_IP}" << 'ENDSSH'
    set -e
    cd ~/rain-forecasting-system/server
    npm install --production

    cd ../ml
    python3.11 -m pip install -r requirements.txt -q

    # Restart Node.js backend
    pm2 restart rain-backend 2>/dev/null || \
      pm2 start server.js --name rain-backend --env production

    # Restart ML Flask service
    pm2 restart rain-ml 2>/dev/null || \
      pm2 start prediction_service.py --name rain-ml --interpreter python3.11

    pm2 save
    pm2 list
ENDSSH

  success "Backend deployed to EC2"
}

# ─────────────────────────────────────────────────────────────
# STEP 4: Build React frontend
# ─────────────────────────────────────────────────────────────
step4_build_frontend() {
  log "Step 4: Building React frontend..."
  cd client

  # Write production .env
  cat > .env.production << EOF
REACT_APP_API_URL=${BACKEND_API_URL}/api
EOF

  npm install
  npm run build
  success "React build complete → client/build/"
  cd ..
}

# ─────────────────────────────────────────────────────────────
# STEP 5: Upload React build to S3
# ─────────────────────────────────────────────────────────────
step5_deploy_frontend() {
  log "Step 5: Uploading frontend to S3 bucket: ${S3_BUCKET}..."

  # Sync build to S3
  aws s3 sync client/build/ "s3://${S3_BUCKET}" \
    --region "$AWS_REGION" \
    --delete \
    --acl public-read \
    --cache-control "max-age=86400" \
    --exclude "*.html"

  # Upload HTML with no-cache (for SPA routing)
  aws s3 sync client/build/ "s3://${S3_BUCKET}" \
    --region "$AWS_REGION" \
    --acl public-read \
    --cache-control "no-cache, no-store, must-revalidate" \
    --include "*.html"

  FRONTEND_URL="http://${S3_BUCKET}.s3-website.${AWS_REGION}.amazonaws.com"
  success "Frontend deployed → ${FRONTEND_URL}"
}

# ─────────────────────────────────────────────────────────────
# STEP 6: Health check
# ─────────────────────────────────────────────────────────────
step6_health_check() {
  log "Step 6: Running health checks..."
  sleep 3

  BACKEND_HEALTH=$(curl -sf "${BACKEND_API_URL}/api/health" || echo "FAILED")
  ML_HEALTH=$(curl -sf "http://${EC2_IP}:5001/health" || echo "FAILED")

  if echo "$BACKEND_HEALTH" | grep -q "healthy"; then
    success "Node.js backend: HEALTHY"
  else
    error  "Node.js backend: UNHEALTHY — $BACKEND_HEALTH"
  fi

  if echo "$ML_HEALTH" | grep -q "healthy"; then
    success "Flask ML service: HEALTHY"
  else
    error  "Flask ML service: UNHEALTHY — $ML_HEALTH"
  fi
}

# ─────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────
main() {
  echo ""
  echo "═══════════════════════════════════════════════════"
  echo "  🌧️  Rain Forecasting System — Deploy to AWS"
  echo "═══════════════════════════════════════════════════"
  echo ""

  step1_validate
  step2_train_model
  step3_deploy_backend
  step4_build_frontend
  step5_deploy_frontend
  step6_health_check

  echo ""
  echo "═══════════════════════════════════════════════════"
  success "🚀 DEPLOYMENT COMPLETE!"
  echo ""
  echo "  Frontend : http://${S3_BUCKET}.s3-website.${AWS_REGION}.amazonaws.com"
  echo "  Backend  : ${BACKEND_API_URL}/api"
  echo "  ML API   : http://${EC2_IP}:5001"
  echo "═══════════════════════════════════════════════════"
}

main "$@"
