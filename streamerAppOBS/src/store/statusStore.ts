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
        obsConnectionStatus: OBSConnectionStatus.Closed,
        proxyConnectionStatus: false,
    }),
    getters: {
        isObsConnected: (state) => state.obsConnectionStatus == OBSConnectionStatus.Open,
        isProxyConnected: (state) => state.proxyConnectionStatus == true,
    },
    actions: {
        setObsConnectionStatus(status: OBSConnectionStatus) {
            this.obsConnectionStatus = status
        },
        setProxyConnectionStatus(status: boolean) {
            this.proxyConnectionStatus = status;
        }
    }
});
