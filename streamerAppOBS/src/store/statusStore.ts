import { defineStore } from 'pinia';

export enum OBSConnectionStatus {
    Connecting = 'Connecting',
    AuthenticationError = 'AuthenticationError',
    Open = 'Open',
    Error = 'Error',
    Closing = 'Closing',
    Closed = 'Closed',
};

export enum ProxyConnectionStatus {
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
        invalidSceneName: false,
        obsConnectionStatus: OBSConnectionStatus.Closed,
        proxyConnectionStatus: ProxyConnectionStatus.Closed,
    }),
    getters: {
        getGeneralErrorMessage: (state) => state.generalErrorMessage,
        getInvalidTwitchUsername: (state) => state.invalidTwitchUsername,
        getInvalidSceneName: (state) => state.invalidSceneName,
        isObsConnected: (state) => state.obsConnectionStatus == OBSConnectionStatus.Open,
        isProxyConnected: (state) => state.proxyConnectionStatus == ProxyConnectionStatus.Open,
    },
    actions: {
        setGeneralErrorMessage(message: string) {
            this.generalErrorMessage = message;
        },
        setInvalidTwitchUsername(isInvalid: boolean) {
            this.invalidTwitchUsername = isInvalid;
        },
        setInvalidSceneName(isInvalid: boolean) {
            this.invalidSceneName = isInvalid;
        },
        setObsConnectionStatus(status: OBSConnectionStatus) {
            this.obsConnectionStatus = status
        },
        setProxyConnectionStatus(status: ProxyConnectionStatus) {
            this.proxyConnectionStatus = status;
        }
    }
});
