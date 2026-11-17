// Django still renders a `common` bundle before `iaso`.
// Importing the shared libraries here lets Rollup emit them once.
// React Fast Refresh preamble (Django has no Vite index.html).
import '@vitejs/plugin-react/preamble';
import 'react';
import 'react-dom';
import 'react-intl';
import '@mui/material';
import '@mui/lab';
import '@mui/x-date-pickers';
import 'lodash';
import 'moment';
import 'leaflet';
import 'leaflet-draw';
import 'video.js';
import 'bluesquare-components';
