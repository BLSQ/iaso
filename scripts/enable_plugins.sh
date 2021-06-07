if [ "$PLUGIN_POLIO_ENABLED" == 'true' ]; then
    cd plugins/polio/js
    npm install
    SKIP_PREFLIGHT_CHECK=true npm run build
fi;