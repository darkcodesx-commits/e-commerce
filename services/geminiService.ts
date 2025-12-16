import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Product, Recommendation } from "../types";

// Initialize Gemini
// NOTE: In a production app, never expose API keys on the client.
// This is for demonstration purposes within the specified environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = "gemini-2.5-flash";

// --- CRM Tool Definitions ---

export const crmTools: FunctionDeclaration[] = [
  {
    name: 'checkOrderStatus',
    description: 'Check the current status and delivery details of a customer order using the order ID.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        orderId: { 
          type: Type.STRING, 
          description: 'The unique order identifier (e.g., ORD-12345). Ask the user for this if not provided.' 
        }
      },
      required: ['orderId']
    }
  },
  {
    name: 'createSupportTicket',
    description: 'Create a new customer support ticket for issues that cannot be resolved immediately.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        issue: { type: Type.STRING, description: 'A brief description of the problem.' },
        priority: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH'], description: 'The priority level of the ticket.' }
      },
      required: ['issue', 'priority']
    }
  }
];

// --- Mock CRM Database & Execution Logic ---

const MOCK_ORDERS: Record<string, any> = {
  'ORD-123': { status: 'Shipped', deliveryDate: '2023-11-20', items: 'Quantum X1 Headphones' },
  'ORD-456': { status: 'Processing', deliveryDate: 'TBD', items: 'AeroBook Pro' },
  'ORD-789': { status: 'Delivered', deliveryDate: '2023-10-15', items: 'Titan Smartwatch' },
};

export const executeCRMTool = async (name: string, args: any): Promise<any> => {
  console.log(`Executing tool: ${name} with args:`, args);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  if (name === 'checkOrderStatus') {
    const order = MOCK_ORDERS[args.orderId];
    if (order) {
      return { 
        exists: true, 
        status: order.status, 
        estimatedDelivery: order.deliveryDate,
        items: order.items 
      };
    } else {
      return { exists: false, error: 'Order ID not found.' };
    }
  }

  if (name === 'createSupportTicket') {
    const ticketId = 'TKT-' + Math.floor(Math.random() * 10000);
    return { ticketId: ticketId, status: 'Created', message: 'Support team will contact you within 24 hours.' };
  }

  return { error: 'Unknown tool' };
};

/**
 * Chatbot Logic
 */
export const createChatSession = (products: Product[]) => {
  const catalogContext = products.map(p => 
    `ID: ${p.id} | ${p.name} (${p.category}) - $${p.price}: ${p.description} [Features: ${p.features.join(', ')}]`
  ).join('\n');

  const systemInstruction = `
    You are 'Nova', the elite AI customer experience manager for TechNova.
    
    CAPABILITIES:
    1. Product Advice: Guide users to products in our catalog:
       ${catalogContext}
    2. CRM & Orders: You can check order status and create support tickets using your tools.
    
    RULES:
    - If a user asks about an order, ALWAYS ask for the Order ID first if they haven't provided it.
    - If you use a tool, summarize the tool's result in a friendly, helpful way for the user.
    - If an order is not found, ask them to double-check the ID.
    - Be professional, empathetic, and efficient.
    - For product recommendations, focus on value and features.
    
    TONE:
    - Professional but warm.
    - Use formatting (bolding key info) to make responses readable.
  `;

  return ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: systemInstruction,
      tools: [{ functionDeclarations: crmTools }],
    },
  });
};

/**
 * Recommendation Logic
 */
export const getRecommendations = async (
  cartItems: Product[],
  allProducts: Product[]
): Promise<Recommendation[]> => {
  if (cartItems.length === 0) return [];

  const cartNames = cartItems.map((p) => p.name).join(", ");
  const catalogNames = allProducts.map((p) => `ID: ${p.id}, Name: ${p.name} (${p.category})`).join("; ");

  const prompt = `
    The user has the following items in their shopping cart (or is viewing): ${cartNames}.
    Based on the available catalog below, recommend exactly 3 other products that complement these items.
    Do not recommend items already in the list above.
    
    Catalog:
    ${catalogNames}
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              productId: { type: Type.STRING },
              reason: { type: Type.STRING, description: "Short marketing reason why this fits." },
            },
            required: ["productId", "reason"],
            propertyOrdering: ["productId", "reason"]
          },
        },
      },
    });

    const text = response.text;
    if (!text) return [];
    
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr) as Recommendation[];
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return [];
  }
};