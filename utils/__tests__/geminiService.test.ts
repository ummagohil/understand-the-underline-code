import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We'll use dynamic imports to avoid hoisting issues
let getExplanationForImageRegion: any;
let getGeminiClient: any;
let geminiService: any;

// Mock the GoogleGenAI and its dependencies
let mockGenerateContent: any;
let mockGoogleGenAI: any;

const mockApiKey = "test-api-key";

describe("geminiService", () => {
  beforeEach(async () => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Set up fresh mocks for each test
    mockGenerateContent = vi.fn();

    // Create a mock model object with generateContent
    const mockModel = {
      generateContent: mockGenerateContent,
    };

    // Create a mock getGenerativeModel function
    const mockGetGenerativeModel = vi.fn().mockReturnValue(mockModel);

    // Create a mock GoogleGenAI instance
    mockGoogleGenAI = vi.fn().mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    }));

    // Use doMock to avoid hoisting issues
    vi.doMock("@google/genai", () => ({
      GoogleGenAI: mockGoogleGenAI,
      GenerateContentResponse: class {
        response: { text: () => string };
        constructor(text: string) {
          this.response = { text: () => text };
        }
      },
      Part: {},
    }));

    // Reset modules to clear any cached instances
    vi.resetModules();

    // Reset the singleton instance before each test
    const module = await import("../geminiService");
    module.__test.reset();

    // Re-import after resetting the singleton
    vi.resetModules();
    const freshModule = await import("../geminiService");
    geminiService = freshModule;
    getExplanationForImageRegion = freshModule.getExplanationForImageRegion;
    getGeminiClient = freshModule.getGeminiClient;
  });

  afterEach(() => {
    // Clean up
    vi.restoreAllMocks();
  });

  it("should throw an error when API key is not configured", async () => {
    await expect(
      getExplanationForImageRegion("data:image/png;base64,test", "")
    ).rejects.toThrow("Gemini API key is not configured.");
  });

  it("should throw an error for invalid image data format", async () => {
    await expect(
      getExplanationForImageRegion("invalid-data", mockApiKey)
    ).rejects.toThrow("Invalid image data format.");
  });

  it("should call the Gemini API with correct parameters", async () => {
    // Mock the response structure that matches the GoogleGenAI SDK
    const mockResponse = {
      text: () => "Test explanation",
    };

    // Mock the generateContent to return a promise that resolves to our mock response
    mockGenerateContent.mockResolvedValueOnce({
      response: mockResponse,
    });

    const base64Image = "data:image/png;base64,test123";
    await getExplanationForImageRegion(base64Image, mockApiKey);

    // Verify GoogleGenAI was instantiated with the correct API key
    expect(mockGoogleGenAI).toHaveBeenCalledWith({
      apiKey: mockApiKey,
    });

    // Verify the API was called with the correct parameters
    expect(mockGenerateContent).toHaveBeenCalledWith({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "image/png",
                data: "test123",
              },
            },
            {
              text: expect.stringContaining(
                "You are an expert at analyzing images"
              ),
            },
          ],
        },
      ],
    });

    // Verify getGenerativeModel was called with the correct model name
    const mockInstance = mockGoogleGenAI.mock.results[0].value;
    expect(mockInstance.getGenerativeModel).toHaveBeenCalledWith({
      model: "gemini-2.5-flash-preview-04-17",
    });
  });

  it("should return the explanation from the API response", async () => {
    const expectedExplanation = "Test explanation";

    // Mock the response structure that matches the GoogleGenAI SDK
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => expectedExplanation,
      },
    });

    const result = await getExplanationForImageRegion(
      "data:image/png;base64,test",
      mockApiKey
    );
    expect(result).toBe(expectedExplanation);
  });

  it("should handle API key validation error", async () => {
    const error = new Error("API key not valid");
    mockGenerateContent.mockRejectedValueOnce(error);

    await expect(
      getExplanationForImageRegion("data:image/png;base64,test", "invalid-key")
    ).rejects.toThrow("Invalid API Key. Please check your configuration.");
  });

  it("should handle empty response from API", async () => {
    // Mock an empty response
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => "",
      },
    });

    await expect(
      getExplanationForImageRegion("data:image/png;base64,test", mockApiKey)
    ).rejects.toThrow("No explanation received from the API.");
  });

  it("should handle other API errors", async () => {
    const error = new Error("API request failed");
    mockGenerateContent.mockRejectedValueOnce(error);

    await expect(
      getExplanationForImageRegion("data:image/png;base64,test", mockApiKey)
    ).rejects.toThrow("Gemini API request failed: API request failed");
  });

  it("should handle unknown errors", async () => {
    // Mock a non-Error rejection
    mockGenerateContent.mockRejectedValueOnce("Unknown error");

    await expect(
      getExplanationForImageRegion("data:image/png;base64,test", mockApiKey)
    ).rejects.toThrow(
      "An unknown error occurred while communicating with the Gemini API."
    );
  });
});
