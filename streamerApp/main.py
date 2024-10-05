from typing import Tuple

import obsws_python as obs
import websocket
import json
import threading
import requests
import time
from secret import password

ws = obs.ReqClient(host='localhost', port=4455, password=password, timeout=3)
IDs = []

def getSceneItems(sceneName):
    raw_request = {
        "requestType": "GetSceneItemList",
        "sceneName": sceneName,
    }
    response = ws.send('GetSceneItemList', data=raw_request, raw=True)
    return response

def getSelectedSceneItems(itemList, itemsToSelect):
    selectedIds = []
    for sceneItem in itemList['sceneItems']:
        # sceneTransform = sceneItem['sceneItemTransform']
        print(sceneItem['sceneItemId'], sceneItem['sourceName'])
        print(getWindowDetails('Scene', sceneItem['sceneItemId']))
        if sceneItem['sourceName'] in itemsToSelect:
            # print(sceneItem)
            selectedIds.append(sceneItem['sceneItemId'])
    return selectedIds

def transformId(x: int, y: int, windowId: int):
    raw_request = {
        "requestType": "SetSceneItemTransform",
        "sceneName": "Scene",
        "sceneItemId": windowId,
        "sceneItemTransform": {
            "positionX": x,
            "positionY": y,
        }
    }
    print(f"transform Id request: {raw_request}")
    response = ws.send('SetSceneItemTransform', data=raw_request, raw=True)

def getSizeOfWindow(sceneResponse) -> Tuple[float, float]:
    return ((float(sceneResponse['sourceWidth']) - float(sceneResponse['cropLeft'] + sceneResponse['cropRight'])) * sceneResponse['scaleX'],
            (float(sceneResponse['sourceHeight']) - float(sceneResponse['cropTop'] + sceneResponse['cropBottom'])) * sceneResponse['scaleY'])

def getWindowDetails(sceneName, sceneItemId):
    raw_request = {
        "requestType": "GetSceneItemTransform",
        "sceneName": sceneName,
        "sceneItemId": sceneItemId
    }
    response = ws.send('GetSceneItemTransform', data=raw_request, raw=True)
    # print(response)

    sceneResponse = response['sceneItemTransform']
    # print(sceneResponse)
    sizeOfWindow = getSizeOfWindow(sceneResponse)
    locationOfWindow = (sceneResponse['positionX'], sceneResponse['positionY'])

    print(f"sizeOfWindow: {sizeOfWindow}")
    print(f"locationOfWindow: {locationOfWindow}")
    return (sizeOfWindow, locationOfWindow)

def getVideoOutputSettings():
    raw_request = {
        "requestType": "GetVideoSettings",
    }
    print(f"transform Id request: {raw_request}")
    response = ws.send('GetVideoSettings', data=raw_request, raw=True)
    return (response['baseWidth'], response['baseHeight'])

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

def on_message(ws, message):
    print("Received message:", message)
    # Parse the message if it's in JSON format
    if 'Hello Server!' in message:
        # Receive new x and y positions
        wholeData = {'data': []}
        for windowId in IDs:
            print(f"running for id {windowId}")
            sizeOfWindow, locationOfWindow = getWindowDetails("Scene", windowId)
            wholeData['data'].append({"data":[
                {
                    "parent": 69 if int(windowId) == 97 else 0,
                    "name": windowId,
                    "x": locationOfWindow[0],
                    "y": locationOfWindow[1],
                    "width": f"{sizeOfWindow[0]}px",
                    "height": f"{sizeOfWindow[1]}px",
                    "info": "some data to register later",
                    "zIndex": 10,
                    "isParent": False
                }]})
        
        wholeData['data'].append({"data":[
            {
                "name": 69,
                "x": 200,
                "y": 100,
                "width": "712px",
                "height": "712px",
                "zIndex": 1,
                "isParent": True
            }]})
        ws.send(json.dumps(wholeData))
        return
    try:
        data = json.loads(message)
        x = data.get('x', .5)
        y = data.get('y', .5)
        windowId = int(data.get('name', 0))
        sizeOfWindow, _ = getWindowDetails("Scene", windowId)
        
        print("Getting new location for ID:", windowId)

        # get id from name off list we create at beginning
        transformId(x*float(width), y*float(height), windowId)
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
    # print(f"player native width: {width}, height: {height}")
    sceneItems = getSceneItems("Scene")
    IDs = getSelectedSceneItems(sceneItems, ['gitEasy', 'gif'])
    # print(IDs)
    userId = getUserIdFromName("matissetec")
    # print(userId)

    listener_thread = threading.Thread(target=startWebsocketRoom, args=(userId,))
    listener_thread.start()
