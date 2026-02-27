# Gemini 3.1 Pro Preview Model Upgrade

## Overview
This document describes the upgrade to use Google's `gemini-3.1-pro-preview` model for AI website generation, along with enhanced training to prevent code generation during the planning phase.

## Changes Made

### 1. Model Configuration Updates

#### Planning Model (`app/api/ai/generate-plan/route.ts`)
- **Changed**: `PLAN_MODEL` from `"gemini-1.5-pro-002"` to `"gemini-3.1-pro-preview"`
- **Purpose**: Use the latest preview model for better planning capabilities

#### Code Generation Model (`app/api/ai/generate-website/route.ts`)
- **Added**: `"gemini-3.1-pro-preview"` to `MODEL_CONFIGS` with cache support enabled
- **Configuration**:
  ```typescript
  "gemini-3.1-pro-preview": { 
    url: GOOGLE_API_URL, 
    envVar: "GOOGLE_AI_API", 
    provider: "Google", 
    useCache: true 
  }
  ```

#### Cache Model (`lib/gemini-cache.ts`)
- **Changed**: `CACHE_MODEL` from `"gemini-1.5-pro-002"` to `"gemini-3.1-pro-preview"`
- **Purpose**: Align cached content with the new model for consistency

#### Frontend Model Selection (`components/ai-website-builder.tsx`)
- **Added**: "Gemini 3.1 Pro Preview" as the first (default) option in the models dropdown
- **Display**: Shows as "Gemini 3.1 Pro Preview" with provider "Google"

### 2. Enhanced Planning Prompt (No Code Generation)

The `DEFAULT_BUILDER_PLAN` prompt in `lib/ai-prompts.ts` has been significantly enhanced to prevent code generation during the planning phase:

#### New Header Section
```
**IMPORTANT: THIS IS THE PLANNING PHASE ONLY - DO NOT GENERATE ANY CODE**
**YOUR ROLE**: Create a detailed file list and architecture plan. Another AI will generate the actual code later.
**DO NOT**: Write any code, implementation details, or code examples in this phase.
**OUTPUT**: Only the numbered file list with descriptions as specified in OUTPUT FORMAT below.
```

#### Added "WHAT NOT TO INCLUDE" Section
Clear list of items that should NOT be in the planning output:
- ❌ No code snippets or examples
- ❌ No implementation details or function signatures
- ❌ No package.json content or configuration file contents
- ❌ No HTML structure or CSS classes
- ❌ No TypeScript interfaces or type definitions
- ❌ No file contents - just list them

#### Added "WHAT TO INCLUDE" Section
Clear list of items that SHOULD be in the planning output:
- ✓ ONLY the numbered file list: [0], [1], [2], etc.
- ✓ ONLY file names and paths
- ✓ ONLY brief descriptions in [usedfor]...[usedfor] format
- ✓ Summary statement at [0] position
- ✓ Nothing else - no explanations, no code, no examples

#### Example Output Format
Added a clear example showing the correct planning output:
```
[0] The user wants to create a portfolio website. I will generate a MULTI-PAGE website using Vite + TypeScript with Hero UI components. Files are ordered so dependencies come first.

[1] package.json : [usedfor]npm dependencies and build scripts[usedfor]
[2] tsconfig.json : [usedfor]TypeScript configuration[usedfor]
[3] vite.config.ts : [usedfor]Vite build configuration with multi-page setup[usedfor]
...and so on (NO CODE, just the list)
```

#### New Critical Rules
Added rules 8-10 specifically about preventing code generation:
- Rule 8: **DO NOT GENERATE ANY CODE** - Only output the file list
- Rule 9: **NO CODE EXAMPLES** - No TypeScript, HTML, CSS, or JSON code blocks
- Rule 10: **NO IMPLEMENTATION DETAILS** - Only file names and brief descriptions

### 3. Configuration Simplification

Removed explicit code examples from the prompt that might encourage code generation:
- Removed TypeScript code block showing `vite.config.ts` structure
- Simplified configuration requirements to descriptions only
- Kept architectural requirements but removed implementation examples

## Why These Changes?

### 1. Model Upgrade Benefits
- **gemini-3.1-pro-preview** is Google's latest experimental model with improved:
  - Planning and architectural reasoning
  - Instruction following capabilities
  - Context understanding
  - Multi-step task decomposition

### 2. Clear Phase Separation
The enhanced prompt ensures:
- **Planning Phase**: Only generates file lists and architecture
- **Code Generation Phase**: Handles actual code implementation
- **No Confusion**: Clear role boundaries prevent the AI from mixing concerns

### 3. Better User Experience
- Faster planning phase (no unnecessary code generation)
- Cleaner plan output (just the file structure)
- More focused code generation phase
- Better resource utilization

## Testing Recommendations

### Test Plan Generation
1. Create a new project with the AI builder
2. Verify the plan output contains:
   - ✓ Numbered file list in [N] format
   - ✓ File names and paths
   - ✓ [usedfor] descriptions
   - ✗ NO code snippets
   - ✗ NO implementation details
   - ✗ NO configuration contents

### Test Code Generation
1. After planning completes, verify code generation:
   - ✓ Uses gemini-3.1-pro-preview model
   - ✓ Generates proper multi-page structure
   - ✓ Includes Hero UI components
   - ✓ Follows dependency order

### Test Cache Compatibility
1. Create multiple projects with the same user
2. Verify cache reuse works correctly
3. Check that cached content uses new model

## Backward Compatibility

All existing functionality remains intact:
- Other models (gemini-2.0-flash, gemini-1.5-pro, deepseek) still available
- Existing projects continue to work
- Cache system automatically adapts to new model
- No breaking changes to API or frontend

## Model Information

**Model Name**: `gemini-3.1-pro-preview`
**Documentation**: https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview
**Provider**: Google AI
**Status**: Preview (experimental)
**Features**:
- Advanced reasoning capabilities
- Improved instruction following
- Better context understanding
- Enhanced planning abilities

## Future Considerations

1. **Model Stability**: As this is a preview model, monitor for:
   - API changes from Google
   - Rate limits or availability issues
   - Performance characteristics

2. **Prompt Refinement**: Continue to refine the "no code" instructions based on:
   - User feedback
   - Observed AI behavior
   - Edge cases discovered

3. **Model Selection**: Consider adding model-specific configurations for:
   - Different use cases
   - User preferences
   - Performance vs. cost tradeoffs

## Rollback Plan

If issues arise with the new model:

1. **Revert Model Configuration**:
   ```typescript
   const PLAN_MODEL = "gemini-1.5-pro-002"
   export const CACHE_MODEL = "gemini-1.5-pro-002"
   ```

2. **Keep Prompt Enhancements**: The "no code" instructions are beneficial regardless of model

3. **Frontend**: Users can still select older models manually

## Summary

✅ **Upgraded** to gemini-3.1-pro-preview for planning and code generation
✅ **Enhanced** planning prompt to prevent code generation  
✅ **Maintained** multi-page architecture enforcement
✅ **Preserved** Hero UI component requirements
✅ **Ensured** backward compatibility with existing features
✅ **Documented** changes and testing procedures

The upgrade improves the AI generation experience while maintaining all existing functionality and architectural requirements.
