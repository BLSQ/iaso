import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import { SxStyles } from 'Iaso/types/general';
import TopBar from '../../components/nav/TopBarComponent';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { Filters } from './components/Filters';
import { FormsTable } from './components/FormsTable';
import MESSAGES from './messages';
import { FormsParams } from './types/forms';

const styles = {
    root: {
        backgroundColor: theme => theme.palette.primary.background,
        padding: 4,
    },
} satisfies SxStyles;

const Forms: FunctionComponent = () => {
    const baseUrl = baseUrls.forms;
    const params = useParamsObject(baseUrl) as unknown as FormsParams;
    const { formatMessage } = useSafeIntl();

    return (
        <>
            <TopBar title={formatMessage(MESSAGES.title)} />
            <MainWrapper sx={styles.root}>
                <Filters params={params} />
                <FormsTable baseUrl={baseUrl} params={params} />
            </MainWrapper>
        </>
    );
};

export default Forms;
