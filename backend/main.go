package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

type FuelRequest struct {
	FuelType string `json:"fuelType"`
	Country  string `json:"country"`
}

func main() {
	// Load values from env
	if err := godotenv.Load("key.env"); err != nil {
		log.Println("Warning: .env file is not found, Claude API is not working!")
	}

	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	if apiKey == "" {
		log.Fatal("ANTHROPIC_API_KEY is not installed")
	}

	router := gin.Default()

	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	router.POST("api/fuel-price", func(c *gin.Context) {

		var req FuelRequest

		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request format"})
			return
		}

		if req.FuelType == "" {
			req.FuelType = "Diesel"
		}
		if req.Country == "" {
			req.Country = "Estonia"
		}

		anthropicPayload := map[string]interface{}{
			"model":      "claude-haiku-4-5-20251001",
			"max_tokens": 200,
			"system": `You are fuel price assistant.
			IMPORTANT: Respond with ONLY a JSON object. No thinking, no steps, no explanations.
			You may use approximate conversion if needed.
			{"price": 1.234, "source": "source_name", "date": "date found"}
			If not found: {"price": null, "source": "not found", "date": ""}`,
			"tools": []map[string]string{
				{
					"type": "web_search_20250305",
					"name": "web_search",
				},
			},
			"messages": []map[string]string{
				{
					"role":    "user",
					"content": "What is the current price of " + req.FuelType + " in " + req.Country + " today in euros per liter? Search for it and return JSON only.",
				},
			},
		}

		jsonPayload, err := json.Marshal(anthropicPayload)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encode request"})
			return
		}

		// HTTP-request to Anthropic API
		httpReq, err := http.NewRequest("POST", "https://api.anthropic.com/v1/messages", bytes.NewBuffer(jsonPayload))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create HTTP request"})
			return
		}

		httpReq.Header.Set("Content-Type","application/json")
		httpReq.Header.Set("x-api-key", apiKey)
		httpReq.Header.Set("anthropic-version", "2023-06-01")

		client := &http.Client{}
		resp, err := client.Do(httpReq)
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": "Failed to connect to Anthropic API"})
			return
		}
		defer resp.Body.Close()

		respBody, err := io.ReadAll(resp.Body)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read API response"})
			return
		}

		c.Data(resp.StatusCode, "application/json", respBody)
	})

	port := os.Getenv("PORT")
		if port == "" {
			port = "8080"
		}
		log.Println("Server started at" + port + "...")
		router.Run(":" + port)
}
