interface MCPServerConfig {
  endpoint: string;
  apiKey?: string;
  timeout?: number;
}

interface MCPRequest {
  method: string;
  params?: any;
  id?: string;
}

interface MCPResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id?: string;
}

export interface VoiceCommand {
  intent: string;
  entities?: Record<string, any>;
  confidence: number;
  query: string;
}

export interface ProductRecommendation {
  productId: string;
  score: number;
  reason: string;
}

export interface ShoppingAssistantResponse {
  text: string;
  action?: 'search' | 'add_to_cart' | 'navigate' | 'show_products' | 'none';
  data?: any;
  suggestions?: string[];
}

class MCPService {
  private config: MCPServerConfig;
  private requestId = 0;

  constructor(config: MCPServerConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  private generateRequestId(): string {
    return `req_${++this.requestId}_${Date.now()}`;
  }

  private async makeRequest(request: MCPRequest): Promise<MCPResponse> {
    const requestWithId = {
      ...request,
      id: request.id || this.generateRequestId(),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify(requestWithId),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: MCPResponse = await response.json();
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  // Voice processing methods
  async processVoiceCommand(audioData: string): Promise<VoiceCommand> {
    const response = await this.makeRequest({
      method: 'voice.transcribe',
      params: {
        audio: audioData,
        language: 'en-US',
        enableIntentRecognition: true,
      },
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.result;
  }

  async getShoppingAssistantResponse(query: string, context?: any): Promise<ShoppingAssistantResponse> {
    const response = await this.makeRequest({
      method: 'assistant.query',
      params: {
        query,
        context: {
          domain: 'shopping',
          userPreferences: context?.userPreferences,
          currentCart: context?.currentCart,
          previousInteractions: context?.previousInteractions,
        },
      },
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.result;
  }

  // Product discovery and recommendations
  async getPersonalizedRecommendations(
    userId: string,
    preferences?: any,
    limit: number = 10
  ): Promise<ProductRecommendation[]> {
    const response = await this.makeRequest({
      method: 'recommendations.personalized',
      params: {
        userId,
        preferences,
        limit,
        includeReasons: true,
      },
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.result.recommendations || [];
  }

  async searchProductsWithAI(
    query: string,
    filters?: any,
    userContext?: any
  ): Promise<{ products: string[]; explanation: string }> {
    const response = await this.makeRequest({
      method: 'search.intelligent',
      params: {
        query,
        filters,
        context: userContext,
        enhanceResults: true,
      },
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.result;
  }

  // Price and deal analysis
  async analyzePriceHistory(productId: string): Promise<{
    currentPrice: number;
    averagePrice: number;
    recommendation: 'buy' | 'wait' | 'neutral';
    reasoning: string;
  }> {
    const response = await this.makeRequest({
      method: 'pricing.analyze',
      params: {
        productId,
        includeTrends: true,
        includeRecommendation: true,
      },
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.result;
  }

  async findSimilarProducts(
    productId: string,
    criteria?: string[],
    limit: number = 5
  ): Promise<{ productId: string; similarity: number; reason: string }[]> {
    const response = await this.makeRequest({
      method: 'products.findSimilar',
      params: {
        productId,
        criteria: criteria || ['category', 'price', 'features'],
        limit,
      },
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.result.similar || [];
  }

  // Shopping assistance
  async getShoppingAdvice(
    query: string,
    products?: string[],
    budget?: number
  ): Promise<{
    advice: string;
    recommendations: string[];
    alternatives?: string[];
  }> {
    const response = await this.makeRequest({
      method: 'advice.shopping',
      params: {
        query,
        products,
        budget,
        includeBudgetAdvice: !!budget,
      },
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.result;
  }

  async compareProducts(productIds: string[]): Promise<{
    comparison: Record<string, any>;
    recommendation: string;
    pros: Record<string, string[]>;
    cons: Record<string, string[]>;
  }> {
    const response = await this.makeRequest({
      method: 'products.compare',
      params: {
        productIds,
        includeRecommendation: true,
        includeProsCons: true,
      },
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.result;
  }

  // Analytics and insights
  async getShoppingInsights(userId: string): Promise<{
    spendingPatterns: any;
    preferredCategories: string[];
    suggestedBudget: number;
    seasonalTrends: any;
  }> {
    const response = await this.makeRequest({
      method: 'analytics.insights',
      params: {
        userId,
        includeSpendingPatterns: true,
        includePreferences: true,
        includeBudgetSuggestions: true,
      },
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.result;
  }

  // Utility methods
  async healthCheck(): Promise<{ status: string; version: string; capabilities: string[] }> {
    const response = await this.makeRequest({
      method: 'system.health',
    });

    if (response.error) {
      throw new Error(response.error.message);
    }

    return response.result;
  }

  updateConfig(newConfig: Partial<MCPServerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance with default configuration
export const mcpService = new MCPService({
  endpoint: process.env.EXPO_PUBLIC_MCP_ENDPOINT || 'http://localhost:3001/mcp',
  apiKey: process.env.EXPO_PUBLIC_MCP_API_KEY,
  timeout: 30000,
});

export default MCPService;