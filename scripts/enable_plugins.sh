if [ $PLUGIN_POLIO_ENABLED == 'true' ]
then
    cd plugins/polio/js
    npm install
    npm run build
fi;