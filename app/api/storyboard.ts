interface GroqApiResponse {
    choices: Array<{
      message: {
        content: string;
      };
    }>;
  }
  
  interface SegmindApiResponse {
    image: string;
  }
  
  interface ImageGenerationResult {
    url?: string;
    error?: boolean;
    prompt: string;
  }
  
  export async function generateAdConcepts(query: string): Promise<string[]> {
    const promptResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.lNEXT_PUBLIC_GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "system",
            content: "You are an advertising expert. Create 4 clear, detailed image prompts for SDXL image generation."
          },
          {
            role: "user",
            content: `Generate 4 different advertising image prompts for ${query}. Each prompt should be self-contained and focus on different aspects: lifestyle, product showcase, emotional appeal, and brand story.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });
  
    if (!promptResponse.ok) {
      throw new Error(`Groq API error: ${promptResponse.status}`);
    }
  
    const promptData: GroqApiResponse = await promptResponse.json();
    const responseText = promptData.choices[0].message.content;
    
    return responseText
      .split('\n')
      .filter((line: string) => line.trim().length > 0)
      .slice(0, 4)
      .map((line: string) => line.replace(/^\d+\.\s*/, '').trim());
  }
  
  export async function generateImages(prompts: string[]): Promise<ImageGenerationResult[]> {
    const images: ImageGenerationResult[] = [];
  
    for (const [index, prompt] of prompts.entries()) {
      try {
        const response = await fetch("https://api.segmind.com/v1/sdxl1.0-txt2img", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.lNEXT_PUBLIC_SEGMIND_API_KEY || ''
          },
          body: JSON.stringify({
            prompt: prompt,
            negative_prompt: "None",
            style: "base",
            samples: 1,
            scheduler: "UniPC",
            num_inference_steps: 25,
            guidance_scale: 7.5,
            seed: -1,
            img_width: 1024,
            img_height: 1024,
            refiner: true,
            base64: true
          })
        });
  
        if (!response.ok) {
          throw new Error(`Segmind API error: ${response.status}`);
        }
  
        const imageData: SegmindApiResponse = await response.json();
        const base64Data = imageData.image;
        const fullBase64Data = base64Data.startsWith('data:image') 
          ? base64Data 
          : `data:image/png;base64,${base64Data}`;
  
        images.push({ 
          url: fullBase64Data, 
          prompt: prompt 
        });
  
      } catch (error) {
        console.error(`Error generating image ${index + 1}:`, error);
        images.push({ 
          error: true, 
          prompt: prompt 
        });
      }
    }
  
    return images;
  }
  
  // Optional: Error handling export for more granular error management
  export class ApiError extends Error {
    constructor(
      public statusCode: number, 
      message: string
    ) {
      super(message);
      this.name = 'ApiError';
    }
  }