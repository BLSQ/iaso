#!/bin/bash

NGINX_CONF="/etc/nginx/nginx.conf"

# Replace 'gzip off;' with 'gzip on;'
sed -i 's/^\(\s*\)gzip\s\+off;/\1gzip on;/' "$NGINX_CONF"

# Test and reload Nginx
nginx -t && systemctl reload nginx