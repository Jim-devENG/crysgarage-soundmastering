@echo off
echo Uploading webhook setup to VPS...

REM Replace YOUR_VPS_IP with your actual VPS IP address
set VPS_IP=YOUR_VPS_IP

echo Uploading setup script...
scp setup_webhook.sh root@%VPS_IP%:/root/setup_webhook.sh

echo Uploading webhook.php file...
scp webhook.php root@%VPS_IP%:/var/www/html/webhook.php

echo Running setup script on VPS...
ssh root@%VPS_IP% "chmod +x /root/setup_webhook.sh && /root/setup_webhook.sh"

echo Webhook setup completed!
echo.
echo Next steps:
echo 1. Go to your GitHub repository settings
echo 2. Add webhook: http://%VPS_IP%/webhook.php
echo 3. Set content type to application/json
echo 4. Select "Just the push event"
echo 5. Test the webhook
pause 