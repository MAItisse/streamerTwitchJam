package main

import (
	"context"
	"github.com/andreykaipov/goobs"
	"log"
	"streamerAppConfig/types"
)

// App struct
type App struct {
	ctx       context.Context
	ObsClient *goobs.Client
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

func (a *App) SaveSecretPy(secret *types.SecretPy) string {
	log.Printf("SaveSecretPy")
	err := SaveSecretPy("secret.py", secret)
	if err != nil {
		return err.Error()
	}
	return "Saved Successfully!"
}
