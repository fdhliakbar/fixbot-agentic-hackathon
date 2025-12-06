# FixBot Deployment Script untuk Kubernetes

# Pastikan Docker Desktop sudah running
Write-Host "🐳 Checking Docker..." -ForegroundColor Cyan
docker --version

# Step 1: Build Docker Image (jika belum)
Write-Host "`n📦 Step 1: Build Docker Image" -ForegroundColor Yellow
Write-Host "Command: yarn build-image" -ForegroundColor Gray
Write-Host "Atau manual: docker build -t fdhliakbar/fixbot-backend:latest -f packages/backend/Dockerfile ." -ForegroundColor Gray
Write-Host "⏳ Tunggu proses build selesai terlebih dahulu..." -ForegroundColor Yellow

# Step 2: Tag & Push to Docker Hub
Write-Host "`n🚀 Step 2: Push to Docker Hub" -ForegroundColor Yellow
Write-Host "Login ke Docker Hub:" -ForegroundColor Gray
Write-Host "  docker login" -ForegroundColor White
Write-Host "`nTag image:" -ForegroundColor Gray
Write-Host "  docker tag backstage:latest fdhliakbar/fixbot-backend:latest" -ForegroundColor White
Write-Host "`nPush image:" -ForegroundColor Gray
Write-Host "  docker push fdhliakbar/fixbot-backend:latest" -ForegroundColor White

# Step 3: Set Kubeconfig
Write-Host "`n⚙️  Step 3: Configure Kubernetes" -ForegroundColor Yellow
Write-Host "Set kubeconfig:" -ForegroundColor Gray
Write-Host '  $env:KUBECONFIG = ".\credentials\kubeconfig.yaml"' -ForegroundColor White
Write-Host "Atau gunakan flag:" -ForegroundColor Gray
Write-Host "  kubectl --kubeconfig=.\credentials\kubeconfig.yaml -n fixbot get pods" -ForegroundColor White

# Step 4: Deploy to Kubernetes
Write-Host "`n🎯 Step 4: Deploy to Kubernetes" -ForegroundColor Yellow
Write-Host "Deploy secrets:" -ForegroundColor Gray
Write-Host "  kubectl --kubeconfig=.\credentials\kubeconfig.yaml apply -f k8s\secrets.yaml" -ForegroundColor White
Write-Host "`nDeploy application:" -ForegroundColor Gray
Write-Host "  kubectl --kubeconfig=.\credentials\kubeconfig.yaml apply -f k8s\deployment.yaml" -ForegroundColor White
Write-Host "  kubectl --kubeconfig=.\credentials\kubeconfig.yaml apply -f k8s\service.yaml" -ForegroundColor White
Write-Host "  kubectl --kubeconfig=.\credentials\kubeconfig.yaml apply -f k8s\ingress.yaml" -ForegroundColor White

# Step 5: Check Status
Write-Host "`n📊 Step 5: Check Deployment Status" -ForegroundColor Yellow
Write-Host "Check pods:" -ForegroundColor Gray
Write-Host "  kubectl --kubeconfig=.\credentials\kubeconfig.yaml -n fixbot get pods" -ForegroundColor White
Write-Host "`nCheck service:" -ForegroundColor Gray
Write-Host "  kubectl --kubeconfig=.\credentials\kubeconfig.yaml -n fixbot get svc" -ForegroundColor White
Write-Host "`nCheck ingress:" -ForegroundColor Gray
Write-Host "  kubectl --kubeconfig=.\credentials\kubeconfig.yaml -n fixbot get ingress" -ForegroundColor White
Write-Host "`nView logs:" -ForegroundColor Gray
Write-Host "  kubectl --kubeconfig=.\credentials\kubeconfig.yaml -n fixbot logs -f deployment/fixbot-backend" -ForegroundColor White

# Step 6: Test Domain
Write-Host "`n🌐 Step 6: Test Domain Access" -ForegroundColor Yellow
Write-Host "Wait 1-2 minutes for DNS propagation, then test:" -ForegroundColor Gray
Write-Host "  curl https://fixbot.hackathon.sev-2.com/api/fixbot/health" -ForegroundColor White
Write-Host "`nExpected response:" -ForegroundColor Gray
Write-Host '  {"status":"ok","model":"claude-sonnet-4-20250514"}' -ForegroundColor Green

Write-Host "`n✅ Deployment Instructions Ready!" -ForegroundColor Green
Write-Host "Tunggu Docker build selesai, lalu jalankan command di atas step-by-step." -ForegroundColor Cyan
