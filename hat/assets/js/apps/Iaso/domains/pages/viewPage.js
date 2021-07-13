import React from 'react';
import Box from '@material-ui/core/Box';
import { withRouter } from 'react-router';
import PropTypes from 'prop-types';
import TopBar from '../../components/nav/TopBarComponent';
import { baseUrls } from '../../constants/urls';
import { useGetPage } from './useGetPages';

const ViewPage = ({ router }) => {
    const {
        query: { data, status },
    } = useGetPage(router.params.slug);

    if (status !== 'success') {
        return null;
    }

    return (
        <>
            <TopBar
                title={data.name}
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
                    src={data.content}
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
