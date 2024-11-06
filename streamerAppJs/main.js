import { OBSWebSocket } from 'obs-websocket-js';
import { username, password } from "./secret.json"
import fs from 'node:fs'

import { io } from "socket.io-client";

const obsWs = new OBSWebSocket();

await obsWs.connect(url = 'ws://localhost:4455', password)

let IDs = []
let windowConfigData = {}
let infoWindowDataConfigData = {} // lol this variable name

let videoWidth, videoHeight, allScenes, sceneItems
let selectedScene = 'Scene'

let ws;

async function getSceneItems(sceneName = 'Scene') {
    const sceneItems = await obsWs.call('GetSceneItemList', { sceneName })
}

/**
    :param itemList: Array representing the scene items
    :param itemsToSelect: List of item names to select from the scene items. If empty, all items will be selected.
    :param sceneName: obs scene to use
    :return: A tuple containing:
        - A list of selected scene item IDs.
        - A list of dictionaries containing details of the selected scene items, including window ID, window name, width, height, x location, and y location.
*/
async function getSelectedSceneItems(itemList, itemsToSelect = [], sceneName = 'Scene') {
    selectedIds = []
    jsonData = []

    for(const sceneItem of itemList) {
        if (itemsToSelect.length === 0 || itemsToSelect.includes(sceneItem.sourceName)) {
            const sceneWindowData = await getWindowDetails(sceneName, sceneItem.sceneItemId)

            jsonData.push({
                windowId: sceneItem.sceneItemId,
                windowName: sceneItem.sourceName,
                // ...sceneWindowData // could just use this, but the var names get written to a config that we don't
                // control
                width: sceneWindowData.width,
                height: sceneWindowData.height,
                xLocation: sceneWindowData.x,
                yLocation: sceneWindowData.y
            })
            selectedIds.push(sceneItem.sceneItemId)
        }
    }

    fs.writeFileSync('obsConfig.json', jsonData, { flag: 'w+' })

    return selectedIds, jsonData
}

async function transformId(x, y, sceneItemId, sceneName = 'Scene', sizeOfWindow = { width: 100, height: 100 }) {
    await obsWs.call('SetSceneItemTransform', {
        sceneName,
        sceneItemId,
        sceneItemTransform: {
            positionX: Math.min(Math.max(x, 0), videoWidth - sizeOfWindow.width),
            positionY: Math.min(Math.max(y, 0), height - sizeOfWindow.height)
        }
    })
}

function getSizeOfWindow(window) {
    return {
        width: Math.abs(window.sourceWidth - window.cropLeft + window.cropRight) * Math.abs(window.scaleX),
        height: Math.abs(window.sourceHeight - window.cropTop + window.cropBottom) * Math.abs(window.scaleY)
    }
}

async function getWindowDetails(sceneName = 'Scene', sceneItemId) {
    let sceneItemTransform;

    try {
        sceneItemTransform = await obsWs.call('GetSceneItemTransform', {
            sceneName, sceneItemId
        })
    } catch (e) {
        console.log(`Item id ${sceneItemId} doesn't exist`)
        return { x: 0, y: 0, width: 0, height: 0, scaleX: 0, scaleY: 0 }
    }

    const sceneResponse = sceneItemTransform.sceneItemTransform;
    const sizeOfWindow = getSizeOfWindow(sceneResponse);

    const xPosition = sceneResponse.positionX;
    const yPosition = sceneResponse.positionY;

    if (sceneResponse.scaleX < 0) {
        xPosition -= sizeOfWindow.width
    }
    if (sceneResponse.scaleY < 0) {
        yPosition -= sizeOfWindow.height
    }

    return {
        id: sceneItemId,
        x: xPosition,
        y: yPosition,
        ...sizeOfWindow,
        scaleX: sceneResponse.scaleX,
        scaleY: sceneResponse.scaleY
    }
}

async function getVideoOutputSettings() {
    const { baseWidth: width, baseHeight: height } = await obsWs.call('GetVideoSettings')
    return { width, height }
}

async function startWebsocketRoom(userId) {
    const resp = await fetch(`https://websocket.matissetec.dev/lobby/new?user=${userId}`, { method: 'POST' })
    const key = await response.text()
    const socketio = io(`wss://websocket.matissetec.dev/lobby/connect/streamer?user=${userId}&key=${key}`);

    // TODO: set up socket message/close/error/open hooks

    socketio.on('connection', (socket) => {
        ws = socket;

        setInterval(() => {
            ws.emit('ping')
        }, 30000)

        ws.on('error', () => {
            console.error('websocket error')
        })
    
        ws.on('disconnect', () => {
            console.log('websocket closed')
        })

        ws.onAny((evName, data) => {
            // not sure how this'll look yet
            console.log('name', evName, data)

            handleSocketMessage(data);
        })
    })
}

async function handleSocketMessage(data) {
    if (data.includes('Hello Server!')) {
        sendObsSizeConfig();
        sendWindowConfig();
        sendInfoWindowDataConfig()
        runHello()

        return;
    }

    let d;

    try {
        d = JSON.parse(data)
    } catch (e) {
        console.error('received non-json message', data)
        return
    }

    if (d.includes("color")) {
        return // frontend only for now
    }

    const x = d.x || .5
    const y = d.y || .5

    if (d.name === undefined) {
        console.error('error name does not exist in data', d)
        return
    }

    const windowId = parseInt(d.name, 10)

    const windowDetails = await getWindowDetails('Scene', windowId)

    console.log('curWindowId', windowId)

    const transformX = x * videoWidth;
    const transformY = y * videoHeight;

    await transformId(transformX, transformY, windowId, "Scene", { width: windowDetails.width, height: windowDetails.height })
    ws.emit({ data: [
        {
            name: windowId,
            x: transformX,
            y: transformY,
            width: `${windowDetails.width}px`,
            height: `${windowDetails.height}px`,
            info: 'some data to register later'
        }
    ]})
    console.log(`${windowId} moved window to ${transformX} ${transformY}`)
}

async function runHello() {
    const windowDetails = await Promise.all(IDs.map(id => getWindowDetails('Scene', id)))

    const wholeData = { data: [] }

    for(const window of windowDetails) {
        wholeData.data.push({
            name: window.id,
            x: window.x,
            y: window.y,
            width: `${window.width}px`,
            height: `${window.height}px`,
            // copying random stuff from python version
            info: 'some data to register later',
            // maybe we also have this settable for each window
            zIndex: 10
        })
    }

    ws.emit(wholeData)
}

function sendInfoWindowDataConfig() {
    ws.emit(infoWindowDataConfigData)
}

function sendWindowConfig() {
    ws.emit(windowConfigData)
}

// TODO: BUGFIX: Current production extension expects this double-encoded format, so we have to leave it for now
function sendObsSizeConfig() {
    ws.emit({
        obsSize: JSON.stringify({
            obsSize: {
                width: videoWidth,
                height: videoHeight
            }
        })
    })
}

async function getTwitchUserIdFromName(name) {
    const resp = await fetch(`https://decapi.me/twitch/id/${name}`)
    return resp.text()
}

// The meat that kicks off everything

const videoSettings = await getVideoOutputSettings()
videoWidth = videoSettings.width;
videoHeight = videoSettings.height;

sceneItems = await getSceneItems(selectedScene)

// Leaving out the first getSelectedSceneItems as A) it's not used, and B) calling it multiple times is weird because
// it also writes to a file. this is a pattern we should completely eliminate

const movableWindowNames = JSON.parse(fs.readFileSync('movableWindowNames.json', { encoding: 'utf8', flag: 'r' }))

const { ids, _ } = await getSelectedSceneItems(sceneItems, movableWindowNames, selectedScene)

// put the response ids into the global IDs var
IDs = ids

const userId = await getTwitchUserIdFromName(username)

windowConfigData = fs.readFileSync('windowConfig.json', { encoding: 'utf-8', flag: 'r' })
infoWindowDataConfigData = fs.readFileSync('infoWindowDataConfig.json', { encoding: 'utf-8' , flag: 'r' })

startWebsocketRoom(userId)