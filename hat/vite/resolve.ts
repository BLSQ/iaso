import path from 'node:path';

import {
    hatDir,
    iasoModuleAliases,
    liveComponents,
    pdfjsDistDir,
    repoNodeModules,
    repoRoot,
} from './context';

export const resolveConfig = () => ({
    alias: {
        'react/jsx-runtime.js': 'react/jsx-runtime',
        'pdfjs-dist': pdfjsDistDir,
        Iaso: path.resolve(hatDir, 'assets/js/apps/Iaso'),
        'IasoModules/plugins/configs': iasoModuleAliases.combinedConfigPath,
        'IasoModules/plugins/keys': iasoModuleAliases.pluginKeysPath,
        'IasoModules/translations/configs':
            iasoModuleAliases.combinedTranslationsPath,
        'IasoModules/language/configs': iasoModuleAliases.languageConfigsPath,
        ...(liveComponents && {
            'bluesquare-components': path.resolve(
                repoRoot,
                '../bluesquare-components/src/',
            ),
            react: path.resolve(repoNodeModules, 'react'),
            'react-dom': path.resolve(repoNodeModules, 'react-dom'),
            'react-router': path.resolve(repoNodeModules, 'react-router'),
            'react-router-dom': path.resolve(
                repoNodeModules,
                'react-router-dom',
            ),
            'react-intl': path.resolve(repoNodeModules, 'react-intl'),
            '@mui/material': path.resolve(repoNodeModules, '@mui/material'),
            '@mui/styles': path.resolve(repoNodeModules, '@mui/styles'),
            '@mui/x-date-pickers': path.resolve(
                repoNodeModules,
                '@mui/x-date-pickers',
            ),
            '@emotion/react': path.resolve(repoNodeModules, '@emotion/react'),
            '@emotion/styled': path.resolve(repoNodeModules, '@emotion/styled'),
            'react-query': path.resolve(repoNodeModules, 'react-query'),
        }),
    },
    dedupe: [
        'react',
        'react-dom',
        'react-router',
        'react-router-dom',
        'react-intl',
        '@mui/material',
    ],
    preserveSymlinks: false,
});