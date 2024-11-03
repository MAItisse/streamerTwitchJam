package main

import "github.com/andreykaipov/goobs/api/requests/config"

func (a *App) GetVideoOutputSettings() (*config.GetVideoSettingsResponse, error) {
	settings, err := a.ObsClient.Config.GetVideoSettings()
	if err != nil {
		return nil, err
	}
	return settings, nil
}
