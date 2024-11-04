package main

import (
	"fmt"
	"github.com/andreykaipov/goobs"
	"github.com/andreykaipov/goobs/api/requests/config"
	"github.com/andreykaipov/goobs/api/requests/general"
	"github.com/andreykaipov/goobs/api/requests/sceneitems"
	"github.com/andreykaipov/goobs/api/requests/sources"
	"log"
	"streamerAppConfig/types"
)

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
		log.Printf("Error connecting to OBS: %v", err)
		return types.NewStatusMessage("error", err.Error(), nil)
	}
	a.ObsClient = obsClient

	videoOutputSettings, err := a.GetVideoOutputSettings()
	if err != nil {
		msg := fmt.Sprintf("error getting video output settings: %v", err)
		log.Printf(msg)
		return types.NewStatusMessage("error", msg, nil)
	}
	return types.NewStatusMessage("success", "Connected!", videoOutputSettings)
}

func (a *App) GetVideoOutputSettings() (*config.GetVideoSettingsResponse, error) {
	settings, err := a.ObsClient.Config.GetVideoSettings()
	if err != nil {
		return nil, err
	}
	return settings, nil
}

func (a *App) GetSceneItems() types.StatusMessage {

	// TODO: refactor this. Time crunch means it's ugly for now
	secrets := a.LoadSecretPy()

	log.Printf("GetSceneItems")
	if a.ObsClient == nil {
		log.Printf("GetSceneItems: OBS not connected.")
		return types.NewStatusMessage("error", "OBS not connected...", nil)
	}

	// Get SceneItems
	params := sceneitems.NewGetSceneItemListParams().WithSceneName(secrets.SceneName)
	sceneItemList, err := a.ObsClient.SceneItems.GetSceneItemList(params)
	if err != nil {
		return types.NewStatusMessage("error", err.Error(), nil)
	}
	return types.NewStatusMessage("success", "Fetched OBS SceneItems successfully!", sceneItemList)
}

func (a *App) GetVideoOutputScreenshot(sourceName string) types.StatusMessage {
	log.Printf("GetVideoOutputScreenshot")

	version, err := a.ObsClient.General.GetVersion(&general.GetVersionParams{})
	log.Printf("GetVideoOutputScreenshot supported img formats: %v", version.SupportedImageFormats)
	if err != nil {
		log.Printf("GetVerion error: %v", err)
		return types.NewStatusMessage("error", err.Error(), nil)
	}

	params := sources.NewGetSourceScreenshotParams().
		WithSourceName(sourceName).
		WithImageFormat("png")
	sourceScreenshot, err := a.ObsClient.Sources.GetSourceScreenshot(params)
	if err != nil {
		log.Printf("GetSourceScreenshot error: %v", err)
		return types.NewStatusMessage("error", err.Error(), nil)
	}

	return types.NewStatusMessage("success", "Successfully loaded source screenshot", sourceScreenshot)
}
