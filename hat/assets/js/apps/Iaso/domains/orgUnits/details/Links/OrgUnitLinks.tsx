import React, { FunctionComponent } from 'react';
import { LinksFilter } from './LinksFilter';
import { LinksTableWithDownloads } from '../../../links/components/LinksTableWithDownloads';

type Props = {
    baseUrl: string;
    params: Record<string, string>;
    paramsPrefix: string;
};

export const OrgUnitLinks: FunctionComponent<Props> = ({
    baseUrl,
    params,
    paramsPrefix,
}) => {
    return (
        <LinksTableWithDownloads
            baseUrl={baseUrl}
            params={params}
            paramsPrefix={paramsPrefix}
        >
            <LinksFilter baseUrl={baseUrl} params={params} />
        </LinksTableWithDownloads>
    );
};
