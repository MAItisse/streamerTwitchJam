package main

import (
	"bufio"
	"fmt"
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
