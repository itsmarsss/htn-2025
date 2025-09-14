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
            name: "addObject",
            description: "Add a primitive to the scene",
            parameters: {
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
                        ],
                    },
                    params: { type: "object", additionalProperties: true },
                },
                required: ["kind"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "selectObject",
            description: "Select an object by id or name",
            parameters: {
                type: "object",
                properties: { target: { type: "string" } },
                required: ["target"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "updateTransform",
            description:
                "Update position, rotation (radians), or scale. Use deltas when requested to move/rotate/scale by amounts.",
            parameters: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    position: {
                        type: "object",
                        properties: {
                            x: { type: "number" },
                            y: { type: "number" },
                            z: { type: "number" },
                        },
                    },
                    rotation: {
                        type: "object",
                        properties: {
                            x: { type: "number" },
                            y: { type: "number" },
                            z: { type: "number" },
                        },
                    },
                    scale: {
                        type: "object",
                        properties: {
                            x: { type: "number" },
                            y: { type: "number" },
                            z: { type: "number" },
                        },
                    },
                    isDelta: {
                        type: "boolean",
                        description:
                            "If true, apply values as deltas (additive). Otherwise set absolute.",
                    },
                },
                required: ["id"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "updateTransformMany",
            description:
                "Batch update transforms for multiple objects. Use isDelta true for relative moves.",
            parameters: {
                type: "object",
                properties: {
                    items: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                id: { type: "string" },
                                target: { type: "string" },
                                position: {
                                    type: "object",
                                    properties: {
                                        x: { type: "number" },
                                        y: { type: "number" },
                                        z: { type: "number" },
                                    },
                                },
                                rotation: {
                                    type: "object",
                                    properties: {
                                        x: { type: "number" },
                                        y: { type: "number" },
                                        z: { type: "number" },
                                    },
                                },
                                scale: {
                                    type: "object",
                                    properties: {
                                        x: { type: "number" },
                                        y: { type: "number" },
                                        z: { type: "number" },
                                    },
                                },
                                isDelta: { type: "boolean" },
                            },
                        },
                    },
                },
                required: ["items"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "updateMaterial",
            description:
                "Set material color (hex), metalness, roughness, opacity",
            parameters: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    color: { type: "string" },
                    metalness: { type: "number" },
                    roughness: { type: "number" },
                    opacity: { type: "number" },
                    transparent: { type: "boolean" },
                },
                required: ["id"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "updateMaterialMany",
            description: "Batch update materials for multiple objects.",
            parameters: {
                type: "object",
                properties: {
                    items: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                id: { type: "string" },
                                target: { type: "string" },
                                color: { type: "string" },
                                metalness: { type: "number" },
                                roughness: { type: "number" },
                                opacity: { type: "number" },
                                transparent: { type: "boolean" },
                            },
                        },
                    },
                },
                required: ["items"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "updateGeometry",
            description: "Change geometry kind and optional params",
            parameters: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    kind: {
                        type: "string",
                        enum: [
                            "box",
                            "sphere",
                            "cylinder",
                            "cone",
                            "torus",
                            "plane",
                        ],
                    },
                    params: { type: "object", additionalProperties: true },
                },
                required: ["id", "kind"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "duplicateSelected",
            parameters: { type: "object", properties: {} },
        },
    },
    {
        type: "function",
        function: {
            name: "deleteSelected",
            parameters: { type: "object", properties: {} },
        },
    },
    {
        type: "function",
        function: {
            name: "booleanOp",
            description: "Run boolean operation between two objects A and B",
            parameters: {
                type: "object",
                properties: {
                    op: {
                        type: "string",
                        enum: ["union", "subtract", "intersect"],
                    },
                    a: { type: "string" },
                    b: { type: "string" },
                },
                required: ["op", "a", "b"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "undo",
            parameters: { type: "object", properties: {} },
        },
    },
    {
        type: "function",
        function: {
            name: "redo",
            parameters: { type: "object", properties: {} },
        },
    },
    {
        type: "function",
        function: {
            name: "toggleSnap",
            parameters: {
                type: "object",
                properties: { enabled: { type: "boolean" } },
                required: ["enabled"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "setSnap",
            parameters: {
                type: "object",
                properties: {
                    translateSnap: { type: "number" },
                    rotateSnap: { type: "number" },
                    scaleSnap: { type: "number" },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "setMode",
            parameters: {
                type: "object",
                properties: {
                    mode: {
                        type: "string",
                        enum: ["translate", "rotate", "scale"],
                    },
                },
                required: ["mode"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "generateModelRodin",
            description:
                "Generate a 3D model via Fal Rodin and return a GLB URL. Provide either imageUrl(s) or prompt.",
            parameters: {
                type: "object",
                properties: {
                    imageUrl: { type: "string" },
                    prompt: { type: "string" },
                    quality: {
                        type: "string",
                        enum: ["high", "medium", "low", "extra-low"],
                    },
                    material: { type: "string", enum: ["PBR", "Shaded"] },
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "addRepeatedObjects",
            description:
                "Add N primitives in a line with proper spacing. Use for creating objects in a row/column pattern.",
            parameters: {
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
                        ],
                    },
                    count: { type: "integer", minimum: 1 },
                    params: { type: "object", additionalProperties: true },
                    spacingX: { type: "number" },
                    spacingY: { type: "number" },
                    spacingZ: { type: "number" },
                    startX: { type: "number" },
                    startY: { type: "number" },
                    startZ: { type: "number" },
                },
                required: ["kind", "count"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "scatterObjects",
            description:
                "Scatter N objects randomly within a 3D area. Use for creating objects spread out in space.",
            parameters: {
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
                        ],
                    },
                    count: { type: "integer", minimum: 1 },
                    params: { type: "object", additionalProperties: true },
                    areaWidth: {
                        type: "number",
                        description: "Width of the scatter area",
                    },
                    areaHeight: {
                        type: "number",
                        description: "Height of the scatter area",
                    },
                    areaDepth: {
                        type: "number",
                        description: "Depth of the scatter area",
                    },
                    centerX: {
                        type: "number",
                        description: "X center of scatter area",
                    },
                    centerY: {
                        type: "number",
                        description: "Y center of scatter area",
                    },
                    centerZ: {
                        type: "number",
                        description: "Z center of scatter area",
                    },
                },
                required: ["kind", "count"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "updateName",
            description: "Rename an object by id or exact name",
            parameters: {
                type: "object",
                properties: {
                    id: { type: "string" },
                    target: { type: "string" },
                    name: { type: "string" },
                },
                required: ["name"],
            },
        },
    },
    {
        type: "function",
        function: {
            name: "updateNamesBulk",
            description:
                "Rename multiple objects at once. Provide arrays of names and targetIds.",
            parameters: {
                type: "object",
                properties: {
                    names: { type: "array", items: { type: "string" } },
                    targetIds: { type: "array", items: { type: "string" } },
                },
                required: ["names"],
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

🔧 TOOL SELECTION FOR SPATIAL PATTERNS:
- "scatter X objects in Y×Z×W area" → Use scatterObjects with exact area dimensions
- "add X objects in a line/row" → Use addRepeatedObjects with proper spacing
- "arrange X objects in a grid" → Use addRepeatedObjects with 2D spacing
- "place X objects randomly" → Use scatterObjects with reasonable area size
- "add X objects spaced apart" → Use addRepeatedObjects with calculated spacing

📐 SPATIAL CALCULATIONS:
- When user specifies "10x10x10 area", use areaWidth: 10, areaHeight: 10, areaDepth: 10
- For spacing, consider object dimensions: spacing should be at least 1.2x the largest object dimension
- For scattered objects, ensure the area is large enough to avoid clustering
- Pay attention to scene bounds and existing object positions in the context

🛠️ TOOL USAGE RULES:
- Prefer tool calls over text responses whenever possible
- Units: position/scale in editor units. Rotation is in radians; convert degrees to radians
- For "move/rotate/scale by" amounts, use isDelta: true
- For multiple object operations, use batch functions (updateTransformMany, updateMaterialMany)
- For renaming multiple objects, use updateNamesBulk
- Always choose the tool that best matches the spatial pattern requested

Only produce natural language when no tool call is appropriate.`;

app.get("/api/health", (req, res) => {
    const llm = getLlms();
    res.json({
        ok: !!llm,
        provider: llm?.provider ?? null,
        baseUrl: llm?.baseUrl ?? null,
        model: llm?.model ?? null,
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

    const { user, sceneSummary, focusContext } = req.body || {};
    if (!user || typeof user !== "string")
        return res.status(400).json({ error: "Missing user prompt" });

    const messages = [
        { role: "system", content: systemPrompt },
        focusContext
            ? { role: "system", content: `Focus: ${focusContext}` }
            : null,
        sceneSummary
            ? { role: "system", content: `Scene: ${sceneSummary}` }
            : null,
        { role: "user", content: user },
    ].filter(Boolean);

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
                temperature: isClaude ? 0.2 : 0.15, // Slightly higher for spatial creativity
                messages,
                tools,
                tool_choice: "auto",
                // Additional parameters for better spatial reasoning
                ...(isGPT4o && {
                    top_p: 0.9,
                    frequency_penalty: 0.1,
                    presence_penalty: 0.1,
                }),
                ...(isClaude && {
                    top_p: 0.9,
                    max_tokens: 4000,
                }),
            }),
        });
        const data = await r.json();
        if (!r.ok) {
            console.error("Upstream error", data);
            return res
                .status(500)
                .json({ error: "Upstream error", details: data });
        }
        return res.json(data);
    } catch (err) {
        console.error("Request failed", err);
        return res
            .status(500)
            .json({ error: "Request failed", details: String(err) });
    }
});

console.log(`[FAL] configured=${!!process.env.FAL_KEY}`);

const detected = getLlms();
console.log(
    `[LLM] provider=${detected?.provider ?? "none"} base=${
        detected?.baseUrl ?? "n/a"
    } model=${detected?.model ?? "n/a"} hasKey=${!!detected?.apiKey}`
);

app.listen(PORT, () => {
    console.log(`LLM server listening on http://localhost:${PORT}`);
});
