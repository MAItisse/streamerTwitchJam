package main

import (
	"context"
	"fmt"
	"github.com/andreykaipov/goobs"
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

///////////////////////////////
///////////////////////////////

func (a *App) LoadSecretPy() *types.SecretPy {
	log.Printf("LoadSecretPy")
	secret, err := LoadSecretPy("secret.py")
	if err != nil {
		log.Printf("LoadSecretPy error: %v", err)
		return &types.SecretPy{
			Username: "",
			Password: "",
		}
	}
	return secret
}

func (a *App) SaveSecretPy(secret *types.SecretPy) types.StatusMessage {
	log.Printf("SaveSecretPy")
	err := SaveSecretPy("secret.py", secret)
	if err != nil {
		log.Printf("SaveSecretPy error: %v", err.Error())
		return types.NewStatusMessage("error", err.Error(), nil)
	}
	return types.NewStatusMessage("success", "Saved Successfully!", nil)
}

func (a *App) GetWindowConfig() types.StatusMessage {
	// Load WindowConfig
	windowConfig, err := ReadWindowConfig("windowConfig.json")
	log.Printf("GetWindowConfig")
	if err != nil {
		msg := fmt.Sprintf("ReadWindowConfig error: %v", err)
		log.Printf(msg)

		newWindowConfig := types.NewWindowConfig()
		return types.NewStatusMessage("success", "Couldn't find window config file. We'll create one later", newWindowConfig)
	}
	a.WindowConfig = windowConfig
	return types.NewStatusMessage("success", "Loaded windowConfig successfully!", windowConfig)
}

func (a *App) WriteWindowConfig(data types.WindowConfig) types.StatusMessage {
	log.Printf("WriteWindowConfig, got %#v", data)
	err := SaveWindowConfig("windowConfig.json", &data)
	if err != nil {
		msg := fmt.Sprintf("error saving window config: %v", err)
		log.Printf(msg)
		return types.NewStatusMessage("error", msg, nil)
	}
	return types.NewStatusMessage("success", "Saved Window Config", nil)
}

func (a *App) GetInfoWindowConfig() types.StatusMessage {
	infoWindowData, err := ReadInfoWindowData("infoWindowDataConfig.json")
	if err != nil {
		msg := fmt.Sprintf("ReadInfoWindowData error: %v", err)
		log.Printf(msg)

		newInfoWindowConfig := types.NewInfoWindowData()
		return types.NewStatusMessage("success", "Couldn't find infoWindowConfig file. We'll create one later", newInfoWindowConfig)
	}
	return types.NewStatusMessage("success", "Loaded infoWindowData successfully!", infoWindowData)
}

func (a *App) WriteInfoWindowConfig(data types.InfoWindowData) types.StatusMessage {
	log.Printf("WriteInfoWindowConfig")
	err := SaveInfoWindowData("infoWindowDataConfig.json", &data)
	if err != nil {
		msg := fmt.Sprintf("error writing infoWindowConfig: %s", err.Error())
		log.Printf(msg)
		return types.NewStatusMessage("error", msg, nil)
	}
	return types.NewStatusMessage("success", "Saved Info Window Config", nil)
}

func (a *App) WriteMovableWindowNames(data []string) types.StatusMessage {
	log.Printf("WriteMovableWindowNames")
	err := SaveMovableWindowNames("movableWindowNames.json", data)
	if err != nil {
		msg := fmt.Sprintf("error writing movableWindowNames: %s", err.Error())
		log.Printf(msg)
		return types.NewStatusMessage("error", msg, nil)
	}
	return types.NewStatusMessage("success", "Saved Window Names", nil)
}
