# 🧠 Model Configuration for Better Spatial Reasoning

## 🚀 **Upgraded Models**

The system now defaults to **GPT-4o** (the best available model) instead of the smaller GPT-4o-mini. Here are the recommended models for spatial reasoning:

### **🥇 Best Models (Recommended)**

1. **`openai/gpt-4o`** - Default, best overall reasoning and spatial understanding
2. **`openai/gpt-4o-2024-08-06`** - Latest GPT-4o with improvements
3. **`anthropic/claude-3-5-sonnet-20241022`** - Excellent spatial reasoning
4. **`anthropic/claude-3-5-sonnet`** - Claude 3.5 Sonnet, great for complex tasks

### **🥈 Good Models (Fallback)**

5. **`openai/gpt-4-turbo`** - Excellent reasoning, slightly older
6. **`openai/gpt-4o-mini`** - Fast and cheap, good for simple tasks

## 🔧 **How to Configure**

### **Option 1: Environment Variable (Recommended)**

```bash
# Set in your .env.local file
MARTIAN_MODEL=openai/gpt-4o
```

### **Option 2: Direct Model Selection**

The system will automatically use the best available model, but you can override it by setting the `MARTIAN_MODEL` environment variable.

## 🎯 **What's Improved**

### **Enhanced Spatial Reasoning**

-   **Better 3D Understanding**: The model now has much better grasp of 3D space
-   **Smarter Tool Selection**: Automatically chooses the right tool for spatial patterns
-   **Improved Calculations**: Better at calculating spacing, areas, and object placement

### **Optimized Parameters**

-   **Temperature**: 0.15-0.2 (increased for spatial creativity)
-   **Top-p**: 0.9 (better response diversity)
-   **Frequency/Presence Penalty**: 0.1 (reduces repetition)

### **Enhanced System Prompt**

-   **Spatial Expertise**: Emphasizes 3D modeling capabilities
-   **Pattern Recognition**: Better at understanding spatial language
-   **Tool Guidance**: Clear rules for when to use which tools

## 🧪 **Testing the Improvements**

Try these commands to test the enhanced spatial reasoning:

```
"scatter 10 boxes in a 20x20x20 area"
"add 5 spheres in a line with 2 unit spacing"
"arrange 9 cubes in a 3x3 grid"
"place 15 cylinders randomly in a 15x15x15 space"
```

The model should now:

-   ✅ Use the correct tools for each pattern
-   ✅ Calculate appropriate spacing and areas
-   ✅ Distribute objects properly in 3D space
-   ✅ Understand spatial relationships better

## 💰 **Cost Considerations**

-   **GPT-4o**: Most capable, higher cost
-   **Claude 3.5 Sonnet**: Great balance of capability and cost
-   **GPT-4o-mini**: Cheapest, good for simple tasks

Choose based on your needs and budget!
