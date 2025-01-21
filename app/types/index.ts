// Reddit Post interface
export interface RedditPost {
    title: string;
    subreddit: string;
    upvotes: number;
    comments: number;
    body: string;
}

// Analysis Result interface
export interface AnalysisResult {
    success: boolean;
    data?: {
        analysis: string;
        rawPosts: RedditPost[];
        timestamp: string;
    };
    error?: string;
}

// Groq API interfaces
export interface GroqMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface GroqRequest {
    model: string;
    messages: GroqMessage[];
    temperature: number;
    max_tokens: number;
}

export interface GroqChoice {
    message: {
        content: string;
        role: string;
    };
    finish_reason: string;
    index: number;
}

export interface GroqResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: GroqChoice[];
}