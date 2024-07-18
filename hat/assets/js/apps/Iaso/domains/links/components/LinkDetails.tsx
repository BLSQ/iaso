import CheckBox from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlank from '@mui/icons-material/CheckBoxOutlineBlank';
import { grey } from '@mui/material/colors';
import React, { FunctionComponent } from 'react';
import { Button, Container, Divider, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    commonStyles,
    useSafeIntl,
    LoadingSpinner,
} from 'bluesquare-components';
import { LinksCompare } from './LinksCompareComponent';
import MESSAGES from '../messages';
import { useValidateLink } from '../hooks/useValidateLink';
import { Link } from '../types';
import { useGetLinkDetails } from '../hooks/useGetLinkDetails';

const useStyles = makeStyles((theme: any) => ({
    ...commonStyles(theme),
    root: {
        cursor: 'default',
        paddingBottom: theme.spacing(4),
        paddingTop: theme.spacing(4),
        backgroundColor: grey['100'],
    },
}));

type Props = {
    link: Link;
};

export const LinksDetails: FunctionComponent<Props> = ({
    link: parentLink,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const { id: linkId, validated = false } = parentLink;
    const { data: link, isFetching } = useGetLinkDetails(linkId);
    const { mutateAsync: validateLink } = useValidateLink();

    return (
        <>
            <Divider />
            <Container maxWidth={false} className={classes.root}>
                {isFetching && <LoadingSpinner />}
                {link && (
                    <>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <LinksCompare
                                    validated={validated}
                                    title={formatMessage(MESSAGES.destination)}
                                    link={link.destination}
                                    compareLink={link.source}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <LinksCompare
                                    validated={validated}
                                    title={formatMessage(MESSAGES.origin)}
                                    link={link.source}
                                    compareLink={link.destination}
                                />
                            </Grid>
                        </Grid>
                        <Grid container spacing={2} justifyContent="center">
                            <Button
                                className={classes.marginTop}
                                variant="contained"
                                color={validated ? 'primary' : 'secondary'}
                                onClick={() => validateLink(link)}
                            >
                                {validated && (
                                    <>
                                        <CheckBox
                                            className={classes.buttonIcon}
                                        />

                                        {formatMessage(MESSAGES.validated)}
                                    </>
                                )}
                                {!validated && (
                                    <>
                                        <CheckBoxOutlineBlank
                                            className={classes.buttonIcon}
                                        />
                                        {formatMessage(MESSAGES.notValidated)}
                                    </>
                                )}
                            </Button>
                        </Grid>{' '}
                    </>
                )}
            </Container>
        </>
    );
};

export const linkDetailsSubComponent = (link?: Link) => {
    return link ? <LinksDetails link={link} /> : null;
};
