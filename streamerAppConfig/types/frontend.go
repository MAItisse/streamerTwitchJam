package types

type StatusMessage struct {
	Status  string
	Message string
	Data    *any
}

func NewStatusMessage(status string, message string, data any) StatusMessage {
	return StatusMessage{
		Status:  status,
		Message: message,
		Data:    &data,
	}
}
