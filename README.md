# Chat Plays OBS
Twitch Hackathon project for https://twitchstreamertools.devpost.com/

## How to use
- Add the [Extension](https://dashboard.twitch.tv/extensions/k82fkk45cyr54fkinpozggfporx191-0.0.1) to your twitch account
- Hosted Option
  - add this to your obs custom docks
  - `https://stg.chronx.dev/chat-plays-obs/index.html#/`
  - add that dock to your obs view
- Local option
  - clone this project
  - go to the streamerAppOBS folder
  - open terminal
  - `npm install`
  - `npm run dev`
  - add `localhost:5173` as the url for the custom dock
  - add that dock to your obs view

![img.png](images%2FobsExtensionView.png)
![img.png](images%2FstreamView.png)
## How It Works
- **Click Data Processing:** 
  - Users interact via clicks in the frontend.
  - Clicks are processed and translated into commands to move OBS sources.
- **OBS WebSockets:**
  - Local WebSocket controls modify OBS sources in real-time.
  - Sources can be repositioned or adjusted dynamically based on input.
- **Room Creation:**
  - Uses a Rust-based WebSocket backend to create and manage rooms.
  - Supports multiple concurrent streams with separate configurations.
  
### Graph of the system
![vivGraphDescription.png](images%2FvivGraphDescription.png)

Graph provided by vivax3794