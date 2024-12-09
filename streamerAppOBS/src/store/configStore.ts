import { defineStore } from 'pinia';
import {
    Boundaries, AllowListToSource, OBSVideoSettings, SourceInfoCards, SourceToBoundaryMap,
    SourceToAllowList, TwitchNameToIdMap
} from '../types';

// localStorage key constants to avoid potential typos
const KEY_OBS_HOST = 'obsHost';
const KEY_OBS_PORT = 'obsPort';
const KEY_OBS_PASSWORD = 'obsPassword';
const KEY_TWITCH_USERNAME = 'twitchUsername';
const KEY_OBS_SCENE_NAME = 'obsSceneName';
const KEY_BOUNDS = 'bounds';
const KEY_SOURCE_TO_BOUNDARY_MAP = 'sourceToBoundaryMap';
const KEY_SOURCE_INFO_CARDS = 'sourceInfoCards';
const KEY_ALLOW_LIST = 'allowList';
const KEY_SOURCE_TO_ALLOW_LIST = 'sourceToAllowList';
const KEY_TWITCH_NAME_TO_ID = 'twitchNameToId';

export const useConfigStore = defineStore('config', {
    state: () => ({
        // Basic login fields
        obsHost: 'localhost',
        obsPort: '4455',
        obsPassword: '',
        twitchUsername: '',
        obsSceneName: 'Scene',

        // Persisted user settings
        bounds: {} as Boundaries,
        sourceToBoundaryMap: {} as SourceToBoundaryMap,
        sourceInfoCards: {} as SourceInfoCards,
        allowList: {} as AllowListToSource,
        sourceToAllowList: {} as SourceToAllowList,
        twitchNameToUserId: {} as TwitchNameToIdMap,

        // Misc ephemeral data
        obsSceneItems: [] as any, // TODO: I'd like this to be JsonObject[] ...
        videoSettings: {} as OBSVideoSettings,
    }),
    actions: {

        // Save/Load all state
        saveAllToLocalStorage() {
            console.log("configStore: saveAllToLocalStorage()")
            this.saveLoginToLocalStorage();
            this.saveSettingsToLocalStorage();
        },
        loadAllFromLocalStorage() {
            console.log("configStore: loadAllFromLocalStorage()")
            this.loadLoginFromLocalStorage();
            this.loadSettingsFromLocalStorage();
        },


        // Save/Load login configs
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
            this.obsHost = localStorage.getItem(KEY_OBS_HOST) || 'localhost';
            this.obsPort = localStorage.getItem(KEY_OBS_PORT) || '4455';
            this.obsPassword = localStorage.getItem(KEY_OBS_PASSWORD) || '';
            this.twitchUsername = localStorage.getItem(KEY_TWITCH_USERNAME) || '';
            this.obsSceneName = localStorage.getItem(KEY_OBS_SCENE_NAME) || 'Scene';
        },


        // Save/Load User Settings. (These are boundaries/windowconfigs/etc)
        saveSettingsToLocalStorage() {
            console.log("configStore: saveSettingsToLocalStorage()")
            console.log("saving bounds: ", this.bounds);
            console.log("bounds stringified: ", JSON.stringify(this.bounds))
            console.log("saving allow list: ", this.allowList);

            // Convert the front-end states into a storable format
            this.obsSceneItems.forEach((scene: any, _: number) => {
                if (('twitch_movable' in scene) && scene.twitch_movable == true) {
                    this.sourceToBoundaryMap[scene.sceneItemId] = scene.boundary_key;
                    this.sourceInfoCards[scene.sceneItemId] = {
                        title: scene.info_title,
                        description: scene.info_description
                    }
                    this.sourceToAllowList[scene.sceneItemId] = scene.allowList_key;
                }
            });

            localStorage.setItem(KEY_BOUNDS, JSON.stringify(this.bounds));
            localStorage.setItem(KEY_SOURCE_INFO_CARDS, JSON.stringify(this.sourceInfoCards));
            localStorage.setItem(KEY_SOURCE_TO_BOUNDARY_MAP, JSON.stringify(this.sourceToBoundaryMap));
            localStorage.setItem(KEY_ALLOW_LIST, JSON.stringify(this.allowList));
            localStorage.setItem(KEY_SOURCE_TO_ALLOW_LIST, JSON.stringify(this.sourceToAllowList));
            localStorage.setItem(KEY_TWITCH_NAME_TO_ID, JSON.stringify(this.twitchNameToUserId));
        },
        loadSettingsFromLocalStorage() {
            console.log("configStore: loadSettingsFromLocalStorage()")

            try {
                const loadedBounds = JSON.parse(localStorage.getItem(KEY_BOUNDS) || '[]') || [];
                Object.keys(this.bounds).forEach(key => { delete this.bounds[key]; })
                Object.keys(loadedBounds).forEach(key => { this.bounds[key] = loadedBounds[key]; })

                const loadedSourceToBoundaryMap = (JSON.parse(localStorage.getItem(KEY_SOURCE_TO_BOUNDARY_MAP) || '{}') || {}) as SourceToBoundaryMap;
                Object.keys(this.sourceToBoundaryMap).forEach(key => { delete this.sourceToBoundaryMap[key]; })
                Object.keys(loadedSourceToBoundaryMap).forEach(key => { this.sourceToBoundaryMap[key] = loadedSourceToBoundaryMap[key]; })

                const loadedSourceInfoCards = (JSON.parse(localStorage.getItem(KEY_SOURCE_INFO_CARDS) || '{}') || {}) as SourceInfoCards;
                Object.keys(this.sourceInfoCards).forEach(key => { delete this.sourceInfoCards[key]; })
                Object.keys(loadedSourceInfoCards).forEach(key => { this.sourceInfoCards[key] = loadedSourceInfoCards[key]; })

                const loadedAllowLists = JSON.parse(localStorage.getItem(KEY_ALLOW_LIST) || '[]') || [];
                Object.keys(this.allowList).forEach(key => { delete this.allowList[key]; })
                Object.keys(loadedAllowLists).forEach(key => { this.allowList[key] = loadedAllowLists[key]; })

                const loadedSourceToAllowLists = (JSON.parse(localStorage.getItem(KEY_SOURCE_TO_ALLOW_LIST) || '{}') || {}) as SourceToAllowList;
                Object.keys(this.sourceToAllowList).forEach(key => { delete this.sourceToAllowList[key]; })
                Object.keys(loadedSourceToAllowLists).forEach(key => { this.sourceToAllowList[key] = loadedSourceToAllowLists[key]; })

                const loadedTwitchNameToId = (JSON.parse(localStorage.getItem(KEY_TWITCH_NAME_TO_ID) || '{}') || {}) as TwitchNameToIdMap;
                Object.keys(this.twitchNameToUserId).forEach(key => { delete this.twitchNameToUserId[key]; })
                Object.keys(loadedTwitchNameToId).forEach(key => { this.twitchNameToUserId[key] = loadedTwitchNameToId[key]; })

            } catch (e) {
                // If a parse error occurs just ...nuke all the settings back to defaults ._.
                console.error("configStore: loadSettingsFromLocalStorage error:", e);
                this.resetSettings();
            }
        },

        resetSettings() {
            localStorage.setItem(KEY_BOUNDS, '{}');
            localStorage.setItem(KEY_SOURCE_TO_BOUNDARY_MAP, '{}');
            localStorage.setItem(KEY_SOURCE_INFO_CARDS, '{}');
            localStorage.setItem(KEY_ALLOW_LIST, '{}');
            localStorage.setItem(KEY_SOURCE_TO_ALLOW_LIST, '{}');
            localStorage.setItem(KEY_TWITCH_NAME_TO_ID, '{}');

            Object.keys(this.bounds).forEach(key => { delete this.bounds[key]; })
            Object.keys(this.sourceToBoundaryMap).forEach(key => { delete this.sourceToBoundaryMap[key]; })
            Object.keys(this.sourceInfoCards).forEach(key => { delete this.sourceInfoCards[key]; })
            Object.keys(this.allowList).forEach(key => { delete this.allowList[key]; })
            Object.keys(this.sourceToAllowList).forEach(key => { delete this.sourceToAllowList[key]; })
            Object.keys(this.twitchNameToUserId).forEach(key => { delete this.twitchNameToUserId[key]; })
        }
    }
});
