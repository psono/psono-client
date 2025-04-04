import * as React from 'react';
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";

import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

import notification from '../services/notification';

export default function NotificationSnackbar() {
    const { t } = useTranslation();

    const messages = useSelector(state => state.notification.messages);

    return messages.map((message, index) => {

        const handleClose = (event, reason) => {
            const newMessages = [...messages];
            newMessages.splice(index, 1);
            notification.set(newMessages);
        };
        return (
            <Snackbar
                anchorOrigin={{ 'vertical': 'top', 'horizontal': 'center' }}
                open={message.text !== ''}
                //autoHideDuration={6000}
                onClose={handleClose}
                key={index}
            >
                <Alert
                    onClose={handleClose}
                    severity={message.type}
                    sx={{ width: '100%' }}
                >
                    {t(message.text)}
                </Alert>
            </Snackbar>
        );
    })

}