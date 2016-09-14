crontab -l > /tmp/cronjob

# cronjob rules
echo "0 0 * * * /usr/bin/find /opt/shared -mtime +1 -type f -exec rm {} \;" >> /tmp/cronjob

crontab /tmp/cronjob && rm /tmp/cronjob
echo 'Script successful executed, crontab updated.'
