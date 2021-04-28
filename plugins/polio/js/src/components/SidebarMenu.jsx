import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import Drawer from "@material-ui/core/Drawer";
import Divider from "@material-ui/core/Divider";
import ArrowForwardIcon from "@material-ui/icons/ArrowForward";
import List from "@material-ui/core/List";

import commonStyles from "../styles/common";
import { SIDEBAR_WIDTH } from "../styles/constants";
import { LogoSvg } from "./LogoSvgComponent";
import { makeStyles } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  ...commonStyles(theme),
  listItemIcon: {
    minWidth: 35,
  },
  logo: {
    height: 35,
    width: 90,
  },
  list: {
    width: SIDEBAR_WIDTH,
  },
  toolbar: {
    ...theme.mixins.toolbar,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    height: 90,
  },
}));

export const SidebarMenu = ({ isDrawerOpened, toggleDrawer }) => {
  const classes = useStyles();

  return (
    <Drawer anchor="left" open={isDrawerOpened} onClose={toggleDrawer}>
      <div className={classes.toolbar}>
        <LogoSvg className={classes.logo} />
        <IconButton
          className={classes.menuButton}
          color="inherit"
          aria-label="Menu"
          onClick={toggleDrawer}
        >
          <ArrowForwardIcon />
        </IconButton>
      </div>
      <Divider />

      <List className={classes.list}></List>
    </Drawer>
  );
};
