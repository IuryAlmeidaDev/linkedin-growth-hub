# Script para criar a tarefa diária no Agendador de Tarefas do Windows

$taskName = "LinkedInAutoPost"
$nodePath = "C:\Program Files\nodejs\node.exe"
$scriptPath = "C:\Users\03573608183\linkedin-autopost\publicar.js"
$workingDir = "C:\Users\03573608183\linkedin-autopost"

Write-Host "Configurando tarefa diária no Windows para: $taskName..." -ForegroundColor Cyan

$action = New-ScheduledTaskAction -Execute $nodePath -Argument "`"$scriptPath`"" -WorkingDirectory $workingDir
$trigger = New-ScheduledTaskTrigger -Daily -At "08:30AM"
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Publicador Diário Automático do LinkedIn - Iury Dev" -Force | Out-Null
    Write-Host "✅ Tarefa agendada com sucesso!" -ForegroundColor Green
    Write-Host "Horário configurado: Todo dia às 08:30 da manhã." -ForegroundColor Yellow
} catch {
    Write-Error "Falha ao registrar tarefa: $_"
}
