import express from "express";
import dotenv from "dotenv";
import { fal } from "@fal-ai/client";

dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8787;

app.use(express.json({ limit: "20mb" }));
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
});

fal.config({ credentials: process.env.FAL_KEY });

function getLlms() {
    const martianKey =
        process.env.MARTIAN_API_KEY || process.env.VITE_MARTIAN_API_KEY;
    const martianBase =
        process.env.MARTIAN_BASE_URL || "https://api.withmartian.com/v1";

    if (martianKey) {
        // Prioritize the best spatial reasoning models
        const preferredModels = [
            "openai/gpt-4o", // Best overall reasoning
            "openai/gpt-4o-2024-08-06", // Latest GPT-4o
            "openai/gpt-4-turbo", // Excellent reasoning
            "anthropic/claude-3-5-sonnet-20241022", // Great spatial reasoning
            "anthropic/claude-3-5-sonnet", // Claude 3.5 Sonnet
            "openai/gpt-4o-mini", // Fallback
        ];

        const requestedModel =
            process.env.MARTIAN_MODEL || process.env.LLM_MODEL;
        const model = requestedModel || "openai/gpt-4o";

        return {
            provider: "martian",
            baseUrl: martianBase,
            apiKey: martianKey,
            model: model,
        };
    }
    return null;
}

const tools = [
    {
        type: "function",
        function: {
            name: "createObjects",
            description:
                "Create one or more 3D objects with flexible positioning and properties. Handles single objects, multiple objects with spacing, scattered arrangements, and custom positioning.",
            parameters: {
                type: "object",
                properties: {
                    objects: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                kind: {
                                    type: "string",
                                    enum: [
                                        "box",
                                        "sphere",
                                        "cylinder",
                                        "cone",
                                        "torus",
                                        "plane",
                                        "custom",
                                    ],
                                    description: "Type of geometry",
                                },
                                name: {
                                    type: "string",
                                    description: "Object name",
                                },
                                position: {
                                    type: "object",
                                    properties: {
                                        x: { type: "number" },
                                        y: { type: "number" },
                                        z: { type: "number" },
                                    },
                                    description: "Position in 3D space",
                                },
                                rotation: {
                                    type: "object",
                                    properties: {
                                        x: { type: "number" },
                                        y: { type: "number" },
                                        z: { type: "number" },
                                    },
                                    description: "Rotation in radians",
                                },
                                scale: {
                                    type: "object",
                                    properties: {
                                        x: { type: "number" },
                                        y: { type: "number" },
                                        z: { type: "number" },
                                    },
                                    description: "Scale factors",
                                },
                                color: {
                                    type: "string",
                                    description: "Color name or hex",
                                },
                                params: {
                                    type: "object",
                                    description: "Geometry-specific parameters",
                                },
                            },
                            required: ["kind"],
                        },
                        description: "Array of objects to create",
                    },
                    arrangement: {
                        type: "object",
                        properties: {
                            type: {
                                type: "string",
                                enum: [
                                    "single",
                                    "line",
                                    "grid",
                                    "scatter",
                                    "custom",
                                ],
                                description: "How to arrange multiple objects",
                            },
                            spacing: {
                                type: "object",
                                properties: {
                                    x: { type: "number" },
                                    y: { type: "number" },
                                    z: { type: "number" },
                                },
                                description: "Spacing between objects",
                            },
                            area: {
                                type: "object",
                                properties: {
                                    width: { type: "number" },
                                    height: { type: "number" },
                                    depth: { type: "number" },
                                },
                                description:
                                    "Area dimensions for scatter arrangement",
                            },
                            center: {
                                type: "object",
                                properties: {
                                    x: { type: "number" },
                                    y: { type: "number" },
                                    z: { type: "number" },
                                },
                                description: "Center point for arrangement",
                            },
                        },
                        description: "How to arrange multiple objects",
                    },
                },
                required: ["objects"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "modifyObjects",
            description:
                "Modify existing objects' properties, transforms, materials, or perform operations like duplicate/delete/select",
            parameters: {
                type: "object",
                properties: {
                    targets: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                id: {
                                    type: "string",
                                    description: "Object ID or name",
                                },
                                position: {
                                    type: "object",
                                    properties: {
                                        x: { type: "number" },
                                        y: { type: "number" },
                                        z: { type: "number" },
                                    },
                                    description: "New position",
                                },
                                rotation: {
                                    type: "object",
                                    properties: {
                                        x: { type: "number" },
                                        y: { type: "number" },
                                        z: { type: "number" },
                                    },
                                    description: "New rotation in radians",
                                },
                                scale: {
                                    type: "object",
                                    properties: {
                                        x: { type: "number" },
                                        y: { type: "number" },
                                        z: { type: "number" },
                                    },
                                    description: "New scale",
                                },
                                color: {
                                    type: "string",
                                    description: "New color",
                                },
                                name: {
                                    type: "string",
                                    description: "New name",
                                },
                                params: {
                                    type: "object",
                                    description: "New geometry parameters",
                                },
                            },
                            required: ["id"],
                        },
                        description:
                            "Objects to modify and their new properties",
                    },
                    operation: {
                        type: "string",
                        enum: ["update", "duplicate", "delete", "select"],
                        description: "Type of operation to perform",
                    },
                    isDelta: {
                        type: "boolean",
                        description:
                            "If true, transform values are relative to current values",
                    },
                },
                required: ["targets", "operation"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "performBoolean",
            description:
                "Perform boolean operations between objects (union, subtract, intersect)",
            parameters: {
                type: "object",
                properties: {
                    operation: {
                        type: "string",
                        enum: ["union", "subtract", "intersect"],
                        description: "Boolean operation type",
                    },
                    objectA: {
                        type: "string",
                        description: "First object ID or name",
                    },
                    objectB: {
                        type: "string",
                        description: "Second object ID or name",
                    },
                },
                required: ["operation", "objectA", "objectB"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "generateModel",
            description: "Generate a 3D model using AI",
            parameters: {
                type: "object",
                properties: {
                    prompt: {
                        type: "string",
                        description: "Description of the model to generate",
                    },
                    quality: {
                        type: "string",
                        enum: ["low", "medium", "high"],
                        description: "Generation quality",
                    },
                    material: {
                        type: "string",
                        enum: ["PBR", "Unlit", "Vertex Color"],
                        description: "Material type",
                    },
                },
                required: ["prompt"],
            },
        },
    },
];

const systemPrompt = `You are an expert 3D modeling copilot with exceptional spatial reasoning capabilities. You excel at understanding 3D space, object relationships, and spatial patterns.

🎯 SPATIAL REASONING EXPERTISE:
- You have deep understanding of 3D coordinate systems, object dimensions, and spatial relationships
- You can visualize how objects will look and interact in 3D space
- You understand the difference between scattered, linear, grid, and clustered arrangements
- You consider object sizes, spacing, and scene boundaries when placing objects
- You can interpret spatial language like "scatter", "arrange in a line", "spread out", "cluster together"

🔧 COMPREHENSIVE TOOL USAGE:
- Use createObjects for all object creation - single objects, multiple objects, scattered arrangements
- Use modifyObjects for all object modifications - transforms, materials, names, operations
- Use performBoolean for boolean operations between objects
- Use generateModel for AI-generated 3D models

📐 SPATIAL CALCULATIONS:
- When user specifies "10x10x10 area", use area: {width: 10, height: 10, depth: 10}
- For spacing, consider object dimensions: spacing should be at least 1.2x the largest object dimension
- For scattered objects, ensure the area is large enough to avoid clustering
- Pay attention to scene bounds and existing object positions in the context

🛠️ TOOL USAGE RULES:
- Prefer tool calls over text responses whenever possible
- Units: position/scale in editor units. Rotation is in radians; convert degrees to radians
- For "move/rotate/scale by" amounts, use isDelta: true
- Always choose the tool that best matches the spatial pattern requested
- Use createObjects with arrangement.type="scatter" for scattered arrangements
- Use createObjects with arrangement.type="line" for linear arrangements
- Use createObjects with arrangement.type="grid" for grid arrangements

💬 CONVERSATION CONTEXT:
- You have access to the full conversation history
- Use pinned context to focus on specific objects when mentioned
- Reference previous actions and objects in your responses
- Understand pronouns like "it", "them", "that" based on context

🎨 MATERIALS & APPEARANCE:
- Common colors: red, green, blue, yellow, orange, purple, pink, white, black, gray
- Use color names or hex codes
- Consider material properties like metalness and roughness for realistic materials

Remember: You are a spatial reasoning expert. Use your understanding of 3D space to create meaningful, well-arranged scenes that match the user's intent.`;

app.get("/api/health", (req, res) => {
    const llm = getLlms();
    res.json({
        ok: true,
        provider: llm?.provider || "none",
        baseUrl: llm?.baseUrl || "none",
        model: llm?.model || "none",
        hasKey: !!llm?.apiKey,
        falConfigured: !!process.env.FAL_KEY,
    });
});

app.get("/api/models", (req, res) => {
    const llm = getLlms();
    if (!llm) {
        return res.status(500).json({ error: "No LLM configured" });
    }

    const availableModels = [
        {
            id: "openai/gpt-4o",
            name: "GPT-4o",
            description: "Best overall reasoning",
        },
        {
            id: "openai/gpt-4o-2024-08-06",
            name: "GPT-4o (Latest)",
            description: "Latest GPT-4o with improvements",
        },
        {
            id: "openai/gpt-4-turbo",
            name: "GPT-4 Turbo",
            description: "Excellent reasoning",
        },
        {
            id: "anthropic/claude-3-5-sonnet-20241022",
            name: "Claude 3.5 Sonnet (Latest)",
            description: "Great spatial reasoning",
        },
        {
            id: "anthropic/claude-3-5-sonnet",
            name: "Claude 3.5 Sonnet",
            description: "Claude 3.5 Sonnet",
        },
        {
            id: "openai/gpt-4o-mini",
            name: "GPT-4o Mini",
            description: "Fast and cheap fallback",
        },
    ];

    res.json({
        current: llm.model,
        available: availableModels,
    });
});

app.post("/api/models/switch", (req, res) => {
    const { model } = req.body || {};
    if (!model || typeof model !== "string") {
        return res.status(400).json({ error: "Missing or invalid model" });
    }

    // For now, we'll just return success since the model is determined by environment variables
    // In a production system, you might want to store this in a database or config file
    res.json({
        success: true,
        message: `Model switch requested to ${model}. Note: This requires setting MARTIAN_MODEL=${model} environment variable and restarting the server.`,
        current: model,
    });
});

app.post("/api/rodin", async (req, res) => {
    try {
        const {
            imageUrl,
            prompt,
            quality = "medium",
            material = "PBR",
        } = req.body || {};
        if (!imageUrl && !prompt)
            return res
                .status(400)
                .json({ error: "Provide imageUrl or prompt" });

        const result = await fal.subscribe("fal-ai/hyper3d/rodin", {
            input: {
                ...(imageUrl ? { input_image_urls: imageUrl } : { prompt }),
                geometry_file_format: "glb",
                material,
                quality,
            },
        });
        const glbUrl = result?.data?.model_mesh?.url;
        if (!glbUrl)
            return res
                .status(502)
                .json({ error: "No model URL from Rodin", details: result });
        res.json({ glbUrl });
    } catch (e) {
        res.status(500).json({
            error: "Rodin call failed",
            details: String(e),
        });
    }
});

app.post("/api/chat", async (req, res) => {
    const llm = getLlms();
    if (!llm)
        return res.status(500).json({
            error: "No LLM API key configured. Set MARTIAN_API_KEY (+ optional MARTIAN_BASE_URL) or OPENAI_API_KEY.",
        });

    const {
        user,
        messages: chatHistory,
        sceneSummary,
        focusContext,
    } = req.body || {};

    if (!user || typeof user !== "string")
        return res.status(400).json({ error: "Missing user prompt" });

    // Build messages array with chat history
    const messages = [
        { role: "system", content: systemPrompt },
        focusContext
            ? { role: "system", content: `Focus: ${focusContext}` }
            : null,
        sceneSummary
            ? { role: "system", content: `Scene: ${sceneSummary}` }
            : null,
    ].filter(Boolean);

    // Add chat history if provided
    if (chatHistory && Array.isArray(chatHistory)) {
        // Convert frontend message format to API format
        chatHistory.forEach((msg) => {
            if (msg.role && msg.text) {
                messages.push({ role: msg.role, content: msg.text });
            }
        });
    } else {
        // Fallback to just the current user message
        messages.push({ role: "user", content: user });
    }

    const url = `${llm.baseUrl.replace(/\/$/, "")}/chat/completions`;

    try {
        // Optimize parameters for spatial reasoning
        const isClaude = llm.model.includes("claude");
        const isGPT4o = llm.model.includes("gpt-4o");

        const r = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${llm.apiKey}`,
            },
            body: JSON.stringify({
                model: llm.model,
                messages,
                tools: tools.map((t) => ({
                    type: "function",
                    function: t.function,
                })),
                tool_choice: "auto",
                temperature: isClaude ? 0.2 : 0.15,
                ...(isGPT4o && {
                    top_p: 0.9,
                    frequency_penalty: 0.1,
                    presence_penalty: 0.1,
                    max_tokens: 4000,
                }),
                ...(isClaude && {
                    max_tokens: 4000,
                }),
            }),
        });

        if (!r.ok) {
            const errorText = await r.text();
            console.error("LLM API error:", r.status, errorText);
            return res.status(502).json({
                error: "LLM API error",
                details: errorText,
            });
        }

        const data = await r.json();
        res.json(data);
    } catch (e) {
        console.error("LLM call failed:", e);
        res.status(500).json({
            error: "LLM call failed",
            details: String(e),
        });
    }
});

app.listen(PORT, () => {
    console.log(`LLM server listening on http://localhost:${PORT}`);
});
