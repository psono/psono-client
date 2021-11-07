import React from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import actionCreators from "../../actions/action-creators";
import { compose } from "redux";
import { withTranslation } from "react-i18next";
import Typography from "@material-ui/core/Typography";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import Base from "../../containers/base";
import browserClient from "../../services/browser-client";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
    },
}));

const PendingsharesView = (props) => {
    const classes = useStyles();

    return (
        <Base {...props}>
            <Typography paragraph>PENDINGSHARES</Typography>
            <Typography paragraph>
                Consequat mauris nunc congue nisi vitae suscipit. Fringilla est ullamcorper eget nulla facilisi etiam dignissim diam. Pulvinar elementum integer
                enim neque volutpat ac tincidunt. Ornare suspendisse sed nisi lacus sed viverra tellus. Purus sit amet volutpat consequat mauris. Elementum eu
                facilisis sed odio morbi. Euismod lacinia at quis risus sed vulputate odio. Morbi tincidunt ornare massa eget egestas purus viverra accumsan in.
                In hendrerit gravida rutrum quisque non tellus orci ac. Pellentesque nec nam aliquam sem et tortor. Habitant morbi tristique senectus et.
                Adipiscing elit duis tristique sollicitudin nibh sit. Ornare aenean euismod elementum nisi quis eleifend. Commodo viverra maecenas accumsan
                lacus vel facilisis. Nulla posuere sollicitudin aliquam ultrices sagittis orci a.
            </Typography>
        </Base>
    );
};

function mapStateToProps(state) {
    return { state: state };
}
function mapDispatchToProps(dispatch) {
    return { actions: bindActionCreators(actionCreators, dispatch) };
}
export default compose(withTranslation(), connect(mapStateToProps, mapDispatchToProps))(PendingsharesView);
