#!/bin/bash
# Run this on the server as root to set up the dev environment
# Usage: bash server-dev-setup.sh

set -e

# 1. Clone dev environment
if [ ! -d /opt/cs231-dev ]; then
  git clone https://github.com/dilyorm/cs231-final.git /opt/cs231-dev
fi
cd /opt/cs231-dev
git checkout dev
git pull origin dev

# 2. Copy env file (uses same DB but different port)
if [ ! -f /opt/cs231-dev/backend/.env ]; then
  cp /opt/cs231/backend/.env /opt/cs231-dev/backend/.env
  # Dev backend runs on port 8101
  echo "PORT=8101" >> /opt/cs231-dev/backend/.env
fi

# 3. Install backend deps
pip install -r /opt/cs231-dev/backend/requirements.txt -q

# 4. Build frontend
cd /opt/cs231-dev/frontend
npm ci
npm run build

# 5. Systemd service for dev
cat > /etc/systemd/system/cs231-dev.service << 'EOF'
[Unit]
Description=CS231 Dev Backend
After=network.target

[Service]
User=root
WorkingDirectory=/opt/cs231-dev/backend
EnvironmentFile=/opt/cs231-dev/backend/.env
ExecStart=/usr/bin/python3 -m uvicorn main:app --host 127.0.0.1 --port 8101
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable cs231-dev
systemctl restart cs231-dev

# 6. Nginx config for dev subdomain
cat > /etc/nginx/sites-available/dev-cs231.dilyor.dev << 'EOF'
server {
    listen 80;
    server_name dev-cs231.dilyor.dev;

    root /opt/cs231-dev/frontend/dist;
    index index.html;

    location /api/ {
        proxy_pass http://127.0.0.1:8101;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

ln -sf /etc/nginx/sites-available/dev-cs231.dilyor.dev /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 7. SSL via certbot
certbot --nginx -d dev-cs231.dilyor.dev --non-interactive --agree-tos -m d.muhammadjonov@newuu.uz

echo "Dev environment ready at https://dev-cs231.dilyor.dev"
