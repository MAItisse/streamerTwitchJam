package types

type SecretPy struct {
	Username  string
	Password  string
	SceneName string
}

// Bound represents the bounds of a window.
type Bound struct {
	Left   float64 `json:"left"`
	Top    float64 `json:"top"`
	Right  float64 `json:"right"`
	Bottom float64 `json:"bottom"`
}

// WindowConfig represents the structure of windowConfig.json.
type WindowConfig struct {
	Bounds map[string]Bound `json:"bounds"`
}

func NewWindowConfig() *WindowConfig {
	return &WindowConfig{
		Bounds: make(map[string]Bound),
	}
}

// Info represents each entry in the infoWindow map with title and description fields.
type Info struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

// InfoWindowData represents the structure of infoWindowData.json.
type InfoWindowData struct {
	InfoWindow map[string]Info `json:"infoWindow"`
}

func NewInfoWindowData() *InfoWindowData {
	return &InfoWindowData{
		InfoWindow: make(map[string]Info),
	}
}
