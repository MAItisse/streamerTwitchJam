package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"github.com/andreykaipov/goobs"
	"github.com/andreykaipov/goobs/api/requests/sceneitems"
	"github.com/andreykaipov/goobs/api/requests/sources"
	"log"
	"streamerAppConfig/types"
)

// App struct
type App struct {
	ctx       context.Context
	ObsClient *goobs.Client

	WindowConfig *types.WindowConfig
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called at application startup
func (a *App) startup(ctx context.Context) {
	// Perform your setup here
	a.ctx = ctx
}

// domReady is called after the front-end dom has been loaded
func (a *App) domReady(ctx context.Context) {
	// Add your action here
}

// beforeClose is called when the application is about to quit,
// either by clicking the window close button or calling runtime.Quit.
// Returning true will cause the application to continue,
// false will continue shutdown as normal.
func (a *App) beforeClose(ctx context.Context) (prevent bool) {
	return false
}

// shutdown is called at application termination
func (a *App) shutdown(ctx context.Context) {
	// Perform your teardown here
}

func (a *App) LoadSecretPy() *types.SecretPy {
	log.Printf("LoadSecretPy")
	secret, err := LoadSecretPy("secret.py")
	if err != nil {

	}
	return secret
}

func (a *App) SaveSecretPy(secret *types.SecretPy) types.StatusMessage {
	log.Printf("SaveSecretPy")
	err := SaveSecretPy("secret.py", secret)
	if err != nil {
		return types.NewStatusMessage("error", err.Error(), nil)
	}
	return types.NewStatusMessage("success", "Saved Successfully!", nil)
}

func (a *App) ConnectOBS() types.StatusMessage {
	log.Printf("ConnectOBS")
	if a.ObsClient != nil {
		log.Printf("Disconnecting from existing OBS connection...")
		a.ObsClient.Disconnect()
		a.ObsClient = nil
	}

	secrets := a.LoadSecretPy()
	host := "localhost"
	port := "4455"
	password := secrets.Password

	obsHost := fmt.Sprintf("%s:%s", host, port)
	obsClient, err := goobs.New(obsHost, goobs.WithPassword(password))
	if err != nil {
		return types.NewStatusMessage("error", err.Error(), nil)
	}
	a.ObsClient = obsClient

	videoOutputSettings, err := a.GetVideoOutputSettings()
	if err != nil {
		return types.NewStatusMessage("error", fmt.Sprintf("error getting video output settings: %v", err), nil)
	}
	return types.NewStatusMessage("success", "Connected to OBS", videoOutputSettings)
}

func (a *App) GetBounds() types.StatusMessage {
	// Load WindowConfig
	windowConfig, err := ReadWindowConfig("windowConfig.json")
	log.Printf("GetBounds")
	if err != nil {
		return types.NewStatusMessage("error", err.Error(), nil)
	}
	a.WindowConfig = windowConfig
	return types.NewStatusMessage("success", "Loaded windowConfig successfully!", windowConfig)
}

func (a *App) GetInfoWindowConfig() types.StatusMessage {
	infoWindowData, err := ReadInfoWindowData("infoWindowDataConfig.json")
	if err != nil {
		return types.NewStatusMessage("error", err.Error(), nil)
	}
	return types.NewStatusMessage("success", "Loaded infoWindowData successfully!", infoWindowData)
}

func (a *App) GetSceneItems() types.StatusMessage {
	if a.ObsClient == nil {
		return types.NewStatusMessage("error", "OBS not connected...", nil)
	}

	// Get SceneItems
	sceneName := "Scene"
	params := sceneitems.NewGetSceneItemListParams().WithSceneName(sceneName)
	sceneItemList, err := a.ObsClient.SceneItems.GetSceneItemList(params)
	if err != nil {
		return types.NewStatusMessage("error", err.Error(), nil)
	}
	return types.NewStatusMessage("success", "Fetched OBS SceneItems successfully!", sceneItemList)
}

func (a *App) GetVideoOutputScreenshot(sourceName string) types.StatusMessage {
	params := sources.NewGetSourceScreenshotParams().WithSourceName(sourceName)
	sourceScreenshot, err := a.ObsClient.Sources.GetSourceScreenshot(params)
	if err != nil {
		return types.NewStatusMessage("error", err.Error(), nil)
	}

	// Convert the screenshot data to a base64 string
	base64Image := base64.StdEncoding.EncodeToString([]byte(sourceScreenshot.ImageData))
	return types.NewStatusMessage("success", "Successfully loaded source screenshot", base64Image)
}
