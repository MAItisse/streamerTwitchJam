# Chat Plays OBS
Twitch Hackathon project for https://twitchstreamertools.devpost.com/

## How to use
- Step 1: Add the [Extension](https://dashboard.twitch.tv/extensions/k82fkk45cyr54fkinpozggfporx191-0.0.1) to your twitch account
- Step 2 
  - add one of the below options to your obs custom docks
  - ![obsCustomBrowser.png](images%2FobsCustomBrowser.png)

  <details>
    <summary>Option 1: Hosted</summary>
    
  - `https://stg.chronx.dev/chat-plays-obs/index.html#/`
  - ![hostedDashboard.png](images%2FhostedDashboard.png)
  - add that dock to your obs view
  </details>
  <details>
  <summary>Option 2: Local</summary>
    
  - clone this project
  - go to the streamerAppOBS folder
  - open terminal
  - `npm install`
  - `npm run dev`
  - add `localhost:5173` as the url for the custom dock
  - ![localDashboard.png](images%2FlocalDashboard.png)
  - add that dock to your obs view
  </details>
    

## Results
![streamView.png](images%2FstreamView.png)
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
