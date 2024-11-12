import { defineStore } from 'pinia';

// localStorage key constants
const KEY_OBS_HOST = 'obsHost';
const KEY_OBS_PORT = 'obsPort';
const KEY_OBS_PASSWORD = 'obsPassword';
const KEY_TWITCH_USERNAME = 'twitchUsername';
const KEY_OBS_SCENE_NAME = 'obsSceneName';
const KEY_BOUNDARIES = 'boundaries';
const KEY_SCENE_ITEMS = 'sceneItems';

export const useConfigStore = defineStore('config', {
    state: () => ({
        obsHost: localStorage.getItem(KEY_OBS_HOST) || 'localhost',
        obsPort: localStorage.getItem(KEY_OBS_PORT) || '4455',
        obsPassword: localStorage.getItem(KEY_OBS_PASSWORD) || '',
        twitchUsername: localStorage.getItem(KEY_TWITCH_USERNAME) || '',
        obsSceneName: localStorage.getItem(KEY_OBS_SCENE_NAME) || '',
        boundaries: JSON.parse(localStorage.getItem(KEY_BOUNDARIES) || '[]') || [],
        sceneItems: JSON.parse(localStorage.getItem(KEY_SCENE_ITEMS) || '[]') || []
    }),
    actions: {
        saveLoginToLocalStorage() {
            console.log("configStore: saveLoginToLocalStorage()")
            localStorage.setItem(KEY_OBS_HOST, this.obsHost);
            localStorage.setItem(KEY_OBS_PORT, this.obsPort);
            localStorage.setItem(KEY_OBS_PASSWORD, this.obsPassword);
            localStorage.setItem(KEY_TWITCH_USERNAME, this.twitchUsername);
            localStorage.setItem(KEY_OBS_SCENE_NAME, this.obsSceneName);
        },
        loadLoginFromLocalStorage() {
            console.log("configStore: loadLoginFromLocalStorage()")
            this.obsHost = localStorage.getItem(KEY_OBS_HOST) || '';
            this.obsPort = localStorage.getItem(KEY_OBS_PORT) || '';
            this.obsPassword = localStorage.getItem(KEY_OBS_PASSWORD) || '';
            this.twitchUsername = localStorage.getItem(KEY_TWITCH_USERNAME) || '';
            this.obsSceneName = localStorage.getItem(KEY_OBS_SCENE_NAME) || '';
        },

        saveAllToLocalStorage() {
            console.log("configStore: saveAllToLocalStorage()")
            this.saveLoginToLocalStorage();

            localStorage.setItem(KEY_BOUNDARIES, JSON.stringify(this.boundaries));
            localStorage.setItem(KEY_SCENE_ITEMS, JSON.stringify(this.sceneItems));
        },
        loadAllFromLocalStorage() {
            console.log("configStore: loadAllFromLocalStorage()")
            this.loadLoginFromLocalStorage();

            this.boundaries = JSON.parse(localStorage.getItem(KEY_BOUNDARIES) || '[]') || [];
            this.sceneItems = JSON.parse(localStorage.getItem(KEY_SCENE_ITEMS) || '[]') || [];
        },
        // updateBoundary(id, newBoundary) {
        //   const index = this.boundaries.findIndex(boundary => boundary.id === id);
        //   if (index !== -1) this.boundaries[index] = newBoundary;
        // }
    }
});
