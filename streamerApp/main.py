from typing import Tuple

import obsws_python as obs
import websocket
import json
import threading
import requests
import time
from secret import password, username

obsWs = obs.ReqClient(host='localhost', port=4455, password=password, timeout=3)
IDs = []
windowConfigData = {}

def getSceneItems(sceneName):
    raw_request = {
        "requestType": "GetSceneItemList",
        "sceneName": sceneName,
    }
    response = obsWs.send('GetSceneItemList', data=raw_request, raw=True)
    return response

def getSelectedSceneItems(itemList, itemsToSelect, sceneName="Scene"):
    """
    :param itemList: Dictionary representing the list of scene items, expected to have a key 'sceneItems' which is a list of scene item objects.
    :param itemsToSelect: List of item names to select from the scene items. If empty, all items will be selected.
    :param sceneName: obs scene to use
    :return: A tuple containing:
        - A list of selected scene item IDs.
        - A list of dictionaries containing details of the selected scene items, including window ID, window name, width, height, x location, and y location.
    """
    selectedIds = []
    jsonData = []
    for sceneItem in itemList['sceneItems']:
        if sceneItem['sourceName'] in itemsToSelect or len(itemsToSelect) == 0:
            sceneWindowData = getWindowDetails(sceneName, sceneItem['sceneItemId'])
            jsonData.append({"windowId": sceneItem['sceneItemId'], "windowName": sceneItem['sourceName'],
                             'width': sceneWindowData[0][0], 'height': sceneWindowData[0][1],
                             'xLocation': sceneWindowData[1][0], 'yLocation': sceneWindowData[1][1]})
            # print(sceneItem)
            selectedIds.append(sceneItem['sceneItemId'])
    with open("obsConfig.json", "w+") as f:
        json.dump(jsonData, f)

    return selectedIds, jsonData

def transformId(x: int, y: int, windowId: int, sceneName: str = "Scene"):
    raw_request = {
        "requestType": "SetSceneItemTransform",
        "sceneName": sceneName,
        "sceneItemId": windowId,
        "sceneItemTransform": {
            "positionX": x,
            "positionY": y,
        }
    }
    print(f"transform Id request: {raw_request}")
    response = obsWs.send('SetSceneItemTransform', data=raw_request, raw=True)

def getSizeOfWindow(sceneResponse) -> Tuple[float, float]:
    return ((float(sceneResponse['sourceWidth']) - float(sceneResponse['cropLeft'] + sceneResponse['cropRight'])) * sceneResponse['scaleX'],
            (float(sceneResponse['sourceHeight']) - float(sceneResponse['cropTop'] + sceneResponse['cropBottom'])) * sceneResponse['scaleY'])

def getWindowDetails(sceneName, sceneItemId) -> tuple[tuple[float, float], tuple[float, float]]:
    raw_request = {
        "requestType": "GetSceneItemTransform",
        "sceneName": sceneName,
        "sceneItemId": sceneItemId
    }
    response = obsWs.send('GetSceneItemTransform', data=raw_request, raw=True)
    # print(response)

    sceneResponse = response['sceneItemTransform']
    # print(sceneResponse)
    sizeOfWindow = getSizeOfWindow(sceneResponse)
    locationOfWindow = (float(sceneResponse['positionX']), float(sceneResponse['positionY']))

    # print(f"sizeOfWindow: {sizeOfWindow}")
    # print(f"locationOfWindow: {locationOfWindow}")
    return sizeOfWindow, locationOfWindow

def getVideoOutputSettings():
    raw_request = {
        "requestType": "GetVideoSettings",
    }
    print(f"transform Id request: {raw_request}")
    response = obsWs.send('GetVideoSettings', data=raw_request, raw=True)
    return response['baseWidth'], response['baseHeight']

def getScenes():
    raw_request = {
        "requestType": "GetSceneList",
    }
    response = obsWs.send('GetSceneList', data=raw_request, raw=True)
    print(response)
    sceneResponse = ""
    for scene in response['scenes']:
        sceneResponse += f"{scene['sceneName']}, "
    return sceneResponse[:-2]

def startWebsocketRoom(userId):
    print("Starting WebSocket room with ID:", userId)
    # Replace with your actual WebSocket server URL
    postUrl = f'https://websocket.matissetec.dev/lobby/new?user={userId}'
    print(postUrl)
    response = requests.post(postUrl)
    ws_url = f'wss://websocket.matissetec.dev/lobby/connect/streamer?user={userId}&key={response.text}'
    print(ws_url)
    ws_app = websocket.WebSocketApp(
        ws_url,
        on_open=on_open,
        on_message=on_message,
        on_error=on_error,
        on_close=on_close
    )
    ws_app.run_forever()

def runHello(ws):
    # Receive new x and y positions
    wholeData = {'data': []}
    for windowId in IDs:
        print(f"running for id {windowId}")
        sizeOfWindow, locationOfWindow = getWindowDetails("Scene", windowId)
        # this data needs to be gathered from the config
        wholeData['data'].append({"data": [
            {
                #      parent id              child id
                "parent": 69 if int(windowId) == 97 else 0,
                "name": windowId,
                "x": locationOfWindow[0],
                "y": locationOfWindow[1],
                "width": f"{sizeOfWindow[0]}px",
                "height": f"{sizeOfWindow[1]}px",
                "info": "some data to register later",
                # maybe we also have this settable for each window
                "zIndex": 10,
                "isParent": False
            }]})

    wholeData['data'].append({"data": [
        {
            # need the parent id
            "name": 69,
            # take these from the config
            "x": 200,
            "y": 100,
            # sizes will be set by the config
            "width": "712px",
            "height": "712px",
            # zindex by the config
            "zIndex": 1,
            "isParent": True
        }]})
    ws.send(json.dumps(wholeData))

def sendWindowConfig(ws):
    print("sending window config")
    print(f"whole data from json {windowConfigData}")
    ws.send(json.dumps(windowConfigData))

def on_message(ws, message):
    print("Received message:", message)
    # Parse the message if it's in JSON format
    if 'Hello Server!' in message:
        sendWindowConfig(ws)
        runHello(ws)
        return
    try:
        data = json.loads(message)
        x = data.get('x', .5)
        y = data.get('y', .5)
        windowId = int(data.get('name', 0))
        sizeOfWindow, _ = getWindowDetails("Scene", windowId)

        print("Getting new location for ID:", windowId)

        # get id from name off list we create at beginning
        transformId(x*float(width), y*float(height), windowId, "Scene")
        ws.send(json.dumps({"data":[
            {
                "name": windowId,
                "x": x*float(width),
                "y": y*float(height),
                "width": f"{sizeOfWindow[0]}px",
                "height": f"{sizeOfWindow[1]}px",
                "info": "some data to register later"
            }]}))
        print("Moved window to", x, y)
    except json.JSONDecodeError:
        print("Received non-JSON message" + message)

def on_error(ws, error):
    print("WebSocket error:", error)

def on_close(ws, close_status_code, close_msg):
    print("WebSocket connection closed")

def on_open(ws):
    print("WebSocket connection opened")
    for windowId in IDs:
        ws.send(json.dumps({"command": "get_positions", "id": windowId}))

    def ping():
        while True:
            time.sleep(30)
            ws.send("ping")
    threading.Thread(target=ping, daemon=True).start()

def getUserIdFromName(name):
    url = f'https://decapi.me/twitch/id/{name}'
    response = requests.get(url)
    return response.text

if __name__ == '__main__':
    width, height = getVideoOutputSettings()
    allScenes = getScenes()
    print(allScenes)
    #    Get names of the scenes wanted to be modified
    selectedScene = "Scene"
    # allow for more than 1 scene to be in the scene item list
    # likely this will need to become a map like they have on obs
    sceneItems = getSceneItems(selectedScene)
    _, jsonData = getSelectedSceneItems(sceneItems, [], selectedScene)
    print(jsonData)

    # get items to select from json data save above

    # for scene in sceneItems:
    #     print(scene)
    #     windowData = getWindowDetails('Scene', scene['sceneItemId'])
    #     print({"windowId": scene['sceneItemId'], "windowName": scene['sourceName'], 'width': windowData[0][1], 'height': windowData[0][0],'xLocation': windowData[1][0], 'yLocation': windowData[1][1]})
    #     print(scene['sceneItemId'], scene['sourceName'])

    #                                                       From the config
    IDs, _ = getSelectedSceneItems(sceneItems, ['gitEasy', 'gif'], selectedScene)
    # print(IDs)
    userId = getUserIdFromName(username)
    # print(userId)

    with open("windowConfig.json", "r", encoding="utf-8") as f:
        windowConfigData = f.read()
        print(windowConfigData)

    listener_thread = threading.Thread(target=startWebsocketRoom, args=(userId,))
    listener_thread.start()
