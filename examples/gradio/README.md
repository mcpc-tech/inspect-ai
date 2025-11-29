# Gradio Client Example

This example demonstrates how to use the Gradio JavaScript Client with the `@mcpc-tech/unplugin-dev-inspector-mcp` plugin.

## Features

- 🔌 Connect to any Gradio Space on Hugging Face
- 🎯 Make predictions through Gradio APIs
- 📊 View API information for any space
- 🐛 Debug UI elements with DevInspector MCP integration
- 💡 Quick example buttons for common use cases

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open your browser to the displayed URL (typically `http://localhost:5173`).

## Usage

### Basic Flow

1. **Enter a Gradio Space name** (e.g., `abidlabs/en2fr`)
2. **Specify the endpoint** (usually `/predict`)
3. **Provide input data** as a JSON array (e.g., `["Hello world"]`)
4. **Click "Connect & Predict"** to see results

### Example Spaces to Try

- **abidlabs/en2fr** - English to French translator
  - Input: `["Hello, how are you?"]`
  
- **gradio/calculator** - Simple calculator
  - Input: `[4, "add", 5]`
  
- **abidlabs/whisper** - Audio transcription
  - Input: `["https://audio-url.mp3"]` (requires audio file URL)

### View API Information

Click **"View API Info"** to see available endpoints and their parameters for any Gradio space.

## Using with MCP Inspector

The DevInspector plugin is integrated, allowing you to:

1. Click any UI element to inspect its properties
2. Send context to AI assistants (Claude Code, Goose, etc.)
3. Debug styling and layout issues
4. Analyze network requests to Gradio APIs

## Learn More

- [Gradio JS Client Documentation](https://www.gradio.app/guides/getting-started-with-the-js-client)
- [DevInspector MCP Plugin](../../README.md)
- [Hugging Face Spaces](https://huggingface.co/spaces)
