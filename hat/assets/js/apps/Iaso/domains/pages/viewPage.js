import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import Box from '@material-ui/core/Box';
import { withRouter } from 'react-router';
import PropTypes from 'prop-types';
import TopBar from '../../components/nav/TopBarComponent';
import MESSAGES from '../forms/messages';
import { baseUrls } from '../../constants/urls';

const ViewPage = ({ router }) => {
    const intl = useSafeIntl();

    return (
        <>
            <TopBar
                title={intl.formatMessage(MESSAGES.title)}
                displayBackButton
                goBack={() => {
                    router.push(baseUrls.pages);
                }}
            />
            <Box>
                <iframe
                    title="powerbi dashboard"
                    style={{
                        height: '100vh',
                    }}
                    width="100%"
                    height="100%"
                    src="https://app.powerbi.com/view?r=eyJrIjoiMWFjNTI5NWItOWI2Yi00NDNjLWExYzQtOGNiMTMwNWMxYTM5IiwidCI6IjIxZmZhYjVkLWJlNzEtNGQ2ZS05YzRjLTFmYWZkYWUwNjdhOCIsImMiOjl9&pageName=ReportSection"
                    frameBorder="0"
                    allowFullScreen="true"
                />
            </Box>
        </>
    );
};

ViewPage.propTypes = {
    router: PropTypes.any.isRequired,
};

export default withRouter(ViewPage);
