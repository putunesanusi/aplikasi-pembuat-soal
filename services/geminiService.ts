import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Models for Text Generation with Fallback Priority
// Urutan: High Intelligence -> High Speed/New Gen -> Standard -> Lightweight
const TEXT_MODELS = [
  'gemini-3-pro-preview',       // 1. Paling cerdas, penalaran mendalam
  'gemini-3-flash-preview',     // 2. Cepat & cerdas (Generasi 3)
  'gemini-flash-latest',        // 3. Standar industri (Gemini 2.5 Flash)
  'gemini-flash-lite-latest'    // 4. Paling ringan & hemat
];

// Models for Image Generation with Fallback Priority
// Urutan: Imagen 4 (Best) -> Gemini 3 Pro (High Quality) -> Gemini 2.5 (Fast/Light)
const IMAGE_MODELS = [
  'imagen-4.0-generate-001',      // 1. Imagen 4 (Best Quality - Photorealistic/Artistic)
  'gemini-3-pro-image-preview',   // 2. Gemini 3 Pro Image (Multimodal High Res)
  'gemini-2.5-flash-image'        // 3. Nano Banana (Lightweight & Fast)
];

export const GeminiService = {
  /**
   * Generates text content (JSON) for questions using a fallback mechanism.
   * It tries models in order defined in TEXT_MODELS.
   */
  generateText: async (prompt: string): Promise<string> => {
    let lastError: any = null;

    // Loop through each model in priority order
    for (const modelName of TEXT_MODELS) {
      try {
        // console.log(`Attempting generation with model: ${modelName}`); 

        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: "application/json", // Encourages JSON output
          }
        });

        if (response.text) {
          console.log(`Success generating text with: ${modelName}`);
          return response.text;
        }
        
        // If response is empty but no error thrown, manually throw to trigger catch block
        throw new Error(`No text returned from ${modelName}`);

      } catch (error: any) {
        console.warn(`Text Model ${modelName} failed, switching to backup...`, error.message);
        lastError = error;
        // Continue to the next model in the loop
      }
    }

    // If loop finishes and no model succeeded
    console.error("All text models failed.");
    throw new Error(lastError?.message || "Failed to generate text with all available models");
  },

  /**
   * Generates an image using a fallback mechanism (Imagen 4 -> Gemini 3 Pro -> Gemini 2.5).
   * Returns a data URL string: "data:image/png;base64,..."
   */
  generateImage: async (prompt: string): Promise<string | null> => {
    const enhancedPrompt = `High quality educational illustration, clear vector style, white background: ${prompt}`;
    let lastError: any = null;

    for (const modelName of IMAGE_MODELS) {
      try {
        // CASE 1: IMAGEN MODELS (use generateImages)
        if (modelName.startsWith('imagen')) {
          const response = await ai.models.generateImages({
            model: modelName,
            prompt: enhancedPrompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '3:4', 
            }
          });

          const base64String = response.generatedImages?.[0]?.image?.imageBytes;
          
          if (base64String) {
            console.log(`Success generating image with: ${modelName}`);
            return `data:image/png;base64,${base64String}`;
          }
          throw new Error(`No image data returned from ${modelName}`);
        } 
        
        // CASE 2: GEMINI MODELS (use generateContent)
        else {
          // Konfigurasi khusus per model
          const imageConfig: any = { aspectRatio: "3:4" };
          
          // Gemini 3 Pro supports imageSize, Gemini 2.5 does not
          if (modelName === 'gemini-3-pro-image-preview') {
            imageConfig.imageSize = "1K";
          }

          const response = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [{ text: enhancedPrompt }]
            },
            config: {
              imageConfig: imageConfig
            }
          });

          // Iterate parts to find the image
          const parts = response.candidates?.[0]?.content?.parts;
          if (parts) {
            for (const part of parts) {
              if (part.inlineData && part.inlineData.data) {
                console.log(`Success generating image with: ${modelName}`);
                const mimeType = part.inlineData.mimeType || 'image/png';
                return `data:${mimeType};base64,${part.inlineData.data}`;
              }
            }
          }
          throw new Error(`No inline image part found in response from ${modelName}`);
        }

      } catch (error: any) {
        console.warn(`Image Model ${modelName} failed, switching to backup...`, error.message);
        lastError = error;
        // Continue to next model
      }
    }

    console.error("All image models failed.");
    return null;
  }
};