# pull-db-backup.ps1
# Pulls the latest DB backup from the Pi to this machine.
# Run manually or schedule via Task Scheduler for off-site disaster recovery.

$PI_HOST    = "void@void.local"
$REMOTE_DIR = "/home/wes/voidvendor-backups"
$LOCAL_DIR  = "$PSScriptRoot\db-backups"

if (-not (Test-Path $LOCAL_DIR)) {
    New-Item -ItemType Directory -Path $LOCAL_DIR | Out-Null
}

# Find the newest backup on the Pi
$latest = ssh $PI_HOST "ls -t $REMOTE_DIR/*.sql.gz 2>/dev/null | head -1"
if (-not $latest) {
    Write-Host "No backup files found on Pi." -ForegroundColor Red
    exit 1
}

$filename = Split-Path $latest -Leaf
$dest = Join-Path $LOCAL_DIR $filename

Write-Host "Pulling $filename from Pi..."
scp "${PI_HOST}:${latest}" $dest

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup saved to: $dest" -ForegroundColor Green
    # Keep only the 14 most recent local backups
    Get-ChildItem $LOCAL_DIR -Filter "*.sql.gz" |
        Sort-Object LastWriteTime -Descending |
        Select-Object -Skip 14 |
        Remove-Item -Force
} else {
    Write-Host "SCP failed." -ForegroundColor Red
}
