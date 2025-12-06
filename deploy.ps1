# FixBot Backstage Deployment Script - AUTOMATED
# This script will build, push, and deploy your Backstage app to Kubernetes

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " FixBot Backstage - Auto Deploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$DOCKER_USERNAME = "fdhliakbar"
$IMAGE_NAME = "fixbot-backstage"
$IMAGE_TAG = "latest"
$NAMESPACE = "fixbot"
$KUBECONFIG_PATH = "credentials/kubeconfig.yaml"

# Step 1: Check Docker
Write-Host "[1/7] Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker not running. Start Docker Desktop first!" -ForegroundColor Red
    exit 1
}

# Step 2: Docker Login
Write-Host ""
Write-Host "[2/7] Docker Hub Login..." -ForegroundColor Yellow
docker login
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Docker login failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Logged in" -ForegroundColor Green

# Step 3: Build Image
Write-Host ""
Write-Host "[3/7] Building Docker image..." -ForegroundColor Yellow
Write-Host "⏳ This takes 10-15 minutes. Please wait..." -ForegroundColor Cyan
docker build -t "${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}" .
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Image built" -ForegroundColor Green

# Step 4: Push Image
Write-Host ""
Write-Host "[4/7] Pushing to Docker Hub..." -ForegroundColor Yellow
docker push "${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}"
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Push failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Image pushed" -ForegroundColor Green

# Step 5: Configure kubectl
Write-Host ""
Write-Host "[5/7] Configuring kubectl..." -ForegroundColor Yellow
$env:KUBECONFIG = $KUBECONFIG_PATH
Write-Host "✓ Kubeconfig set" -ForegroundColor Green

# Step 6: Deploy to Kubernetes
Write-Host ""
Write-Host "[6/7] Deploying to Kubernetes..." -ForegroundColor Yellow

Write-Host "  - Applying secrets..." -ForegroundColor Cyan
kubectl apply -f k8s/secrets.yaml 2>&1 | Out-Null

Write-Host "  - Applying deployment..." -ForegroundColor Cyan
kubectl apply -f k8s/deployment.yaml
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "  - Applying service..." -ForegroundColor Cyan
kubectl apply -f k8s/service.yaml
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Service failed" -ForegroundColor Red
    exit 1
}

Write-Host "  - Applying ingress..." -ForegroundColor Cyan
kubectl apply -f k8s/ingress.yaml
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Ingress failed" -ForegroundColor Red
    exit 1
}

Write-Host "✓ All resources deployed" -ForegroundColor Green

# Step 7: Check Status
Write-Host ""
Write-Host "[7/7] Checking deployment status..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Pods:" -ForegroundColor Cyan
kubectl -n $NAMESPACE get pods

Write-Host ""
Write-Host "Services:" -ForegroundColor Cyan
kubectl -n $NAMESPACE get svc

Write-Host ""
Write-Host "Ingress:" -ForegroundColor Cyan
kubectl -n $NAMESPACE get ingress

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app will be available at:" -ForegroundColor Yellow
Write-Host "  https://fixbot.hackathon.sev-2.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "Wait 2-3 minutes for pods to be ready." -ForegroundColor Yellow
Write-Host ""
Write-Host "Monitor logs:" -ForegroundColor Yellow
Write-Host "  kubectl -n fixbot logs -f deployment/fixbot-backstage" -ForegroundColor White
Write-Host ""
