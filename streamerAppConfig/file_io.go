package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"streamerAppConfig/types"
	"strings"
)

// LoadSecretPy reads the secret.py file and parses it into a SecretPy struct
func LoadSecretPy(filename string) (*types.SecretPy, error) {
	file, err := os.Open(filename)
	if err != nil {
		//return nil, err
		newSecretPy := types.SecretPy{
			Username: "",
			Password: "",
		}
		return &newSecretPy, nil
	}
	defer file.Close()

	secret := &types.SecretPy{}
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		parts := strings.SplitN(line, " = ", 2)
		if len(parts) != 2 {
			continue
		}
		key := parts[0]
		value := strings.Trim(parts[1], "\"") // Remove quotes around the value

		switch key {
		case "username":
			secret.Username = value
		case "password":
			secret.Password = value
		}
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}
	return secret, nil
}

// SaveSecretPy writes the SecretPy struct to the specified file in the same format
func SaveSecretPy(filename string, secret *types.SecretPy) error {
	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	// Write each field in the required format
	_, err = file.WriteString(fmt.Sprintf("username = \"%s\"\n", secret.Username))
	if err != nil {
		return err
	}
	_, err = file.WriteString(fmt.Sprintf("password = \"%s\"\n", secret.Password))
	return err
}

// ReadWindowConfig reads and parses the JSON configuration file into a WindowConfig struct.
func ReadWindowConfig(filename string) (*types.WindowConfig, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	bytes, err := io.ReadAll(file)
	if err != nil {
		return nil, err
	}

	var config types.WindowConfig
	config.Bounds = map[string]types.Bound{}
	if err := json.Unmarshal(bytes, &config); err != nil {
		return nil, err
	}

	return &config, nil
}

// SaveWindowConfig writes a WindowConfig struct to a JSON configuration file.
func SaveWindowConfig(filename string, config *types.WindowConfig) error {
	// Open the file for writing; create it if it doesn't exist
	file, err := os.OpenFile(filename, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
	if err != nil {
		return err
	}
	defer file.Close()

	// Encode the struct to JSON
	bytes, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return err
	}

	// Write the JSON data to the file
	_, err = file.Write(bytes)
	return err
}

// ReadInfoWindowData loads InfoWindowData from a file
func ReadInfoWindowData(filename string) (*types.InfoWindowData, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	bytes, err := io.ReadAll(file)
	if err != nil {
		return nil, err
	}

	var data types.InfoWindowData
	if err := json.Unmarshal(bytes, &data); err != nil {
		return nil, err
	}

	return &data, nil
}

// SaveInfoWindowData marshals InfoWindowData struct and writes it to disk
func SaveInfoWindowData(filename string, data *types.InfoWindowData) error {
	// Open the file for writing; create it if it doesn't exist
	file, err := os.OpenFile(filename, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
	if err != nil {
		return err
	}
	defer file.Close()

	// Encode the struct to JSON
	bytes, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return err
	}

	// Write the JSON data to the file
	_, err = file.Write(bytes)
	return err
}

// SaveMovableWindowNames encodes and array of strings to JSON and writes it to specified file
func SaveMovableWindowNames(filename string, data []string) error {
	// Open the file for writing; create it if it doesn't exist
	file, err := os.OpenFile(filename, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
	if err != nil {
		return err
	}
	defer file.Close()

	// Encode the struct to JSON
	bytes, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return err
	}

	// Write the JSON data to the file
	_, err = file.Write(bytes)
	return err
}
