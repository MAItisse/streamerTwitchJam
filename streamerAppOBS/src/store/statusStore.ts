import { defineStore } from 'pinia';

export enum OBSConnectionStatus {
    Connecting = 'Connecting',
    AuthenticationError = 'AuthenticationError',
    Open = 'Open',
    Error = 'Error',
    Closing = 'Closing',
    Closed = 'Closed',
};

export const useStatusStore = defineStore('status', {
    state: () => ({
        generalErrorMessage: null as null | string,
        invalidTwitchUsername: false,
        obsConnectionStatus: OBSConnectionStatus.Closed,
        proxyConnectionStatus: false,
    }),
    getters: {
        getGeneralErrorMessage: (state) => state.generalErrorMessage,
        getInvalidTwitchUsername: (state) => state.invalidTwitchUsername,
        isObsConnected: (state) => state.obsConnectionStatus == OBSConnectionStatus.Open,
        isProxyConnected: (state) => state.proxyConnectionStatus == true,
    },
    actions: {
        setGeneralErrorMessage(message: string) {
            this.generalErrorMessage = message;
        },
        setInvalidTwitchUsername(isInvalid: boolean) {
            this.invalidTwitchUsername = isInvalid;
        },
        setObsConnectionStatus(status: OBSConnectionStatus) {
            this.obsConnectionStatus = status
        },
        setProxyConnectionStatus(status: boolean) {
            this.proxyConnectionStatus = status;
        }
    }
});
