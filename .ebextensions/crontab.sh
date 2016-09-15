# save existing cronjobs
crontab -l > /tmp/cronjob

# add cronjob
echo "0 0 * * * /usr/bin/find /opt/shared -mtime +1 -type f -exec rm {} \;" >> /tmp/cronjob

# load cronjobs and remove tmp cron file
crontab /tmp/cronjob && rm /tmp/cronjob
echo 'Script successful executed, crontab updated.'
