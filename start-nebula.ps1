Write-Host ""
Write-Host "Starting Nebula..." -ForegroundColor Cyan
Write-Host ""

# Activate Python environment
.\.venv\Scripts\Activate.ps1

# Start backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd nebula-backend; uvicorn main:app --reload --port 8000"

# Start frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Nebula launch complete." -ForegroundColor Green