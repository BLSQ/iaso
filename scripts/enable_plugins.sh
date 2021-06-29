if [ "$PLUGIN_POLIO_ENABLED" == 'true' ]; then
    cd plugins/polio/js
    node --version && npm --version
    which npm
    npm install
    SKIP_PREFLIGHT_CHECK=true npm run build
fi;