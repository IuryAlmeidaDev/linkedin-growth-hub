# Script para atualizar a tarefa no Agendador de Tarefas do Windows a cada 2 dias com LLM Dinâmica

$taskName = "LinkedInAutoPost"
$nodePath = "C:\Program Files\nodejs\node.exe"
$scriptPath = "C:\Users\03573608183\linkedin-autopost\gerar_e_publicar.js"
$workingDir = "C:\Users\03573608183\linkedin-autopost"

Write-Host "Configurando tarefa a cada 2 dias com LLM dinâmica para: $taskName..." -ForegroundColor Cyan

$action = New-ScheduledTaskAction -Execute $nodePath -Argument "`"$scriptPath`"" -WorkingDirectory $workingDir
$trigger = New-ScheduledTaskTrigger -Daily -DaysInterval 2 -At "08:30AM"
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Publicador a cada 2 dias Dinâmico com LLM - Iury Dev" -Force | Out-Null
    Write-Host "✅ Tarefa agendada com sucesso com LLM Local!" -ForegroundColor Green
    Write-Host "Horário configurado: A cada 2 dias às 08:30 da manhã gerando post inédito do zero." -ForegroundColor Yellow
} catch {
    Write-Error "Falha ao registrar tarefa: $_"
}
