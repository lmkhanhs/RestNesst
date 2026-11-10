---
name: design-system
description: Define design tokens, theme scales, and component states for consistent interfaces. Use for shared color, typography, spacing, light/dark themes, and component specifications across the frontend.
license: MIT
metadata:
  author: claudekit
  version: "1.0.0"
---

# Design System

Use this skill when a change spans shared tokens, theme scales, or component specifications. For visual direction use `frontend-design`; for interaction, accessibility, or responsive guidance use `ui-ux-pro-max`.

## Project Context

RestNesst uses React with MUI and Emotion. Read `frontend/AGENTS.md` and inspect the existing theme before proposing token changes. Extend that theme and its component overrides; installing a new UI framework is outside this skill's scope.

## Token Architecture

Use primitive → semantic → component layers when they make the existing theme easier to maintain:

- Primitives: raw colors, spacing, font sizes, and weights.
- Semantic tokens: purpose-based names such as primary action, surface, and muted text.
- Component tokens: specific states and variants derived from semantic tokens.

Prefer existing tokens over new names. For light/dark themes, preserve the semantic purpose while changing the underlying values. Keep a token's purpose documented alongside its definition.

Read only the references needed for the change:

| Concern | Reference |
| --- | --- |
| Layering and naming | `references/token-architecture.md` |
| Raw values and scales | `references/primitive-tokens.md` |
| Purpose-based aliases | `references/semantic-tokens.md` |
| Component-level tokens | `references/component-tokens.md` |
| Component specifications | `references/component-specs.md` |
| States and variants | `references/states-and-variants.md` |

`references/tailwind-integration.md` is available for an explicitly requested Tailwind task; it is not the project's default styling workflow.

## Component Specifications

For the affected component, identify applicable default, hover, focus-visible, active, disabled, loading, and error states. Define their colors, typography, spacing, borders, and motion using the existing theme. Include keyboard behavior and reduced-motion behavior when relevant.

Keep changes scoped to the requested component or shared theme concern. Do not restyle unrelated screens simply to eliminate every literal value.

## Optional Local Helpers

The bundled helpers generate standalone CSS variables or audit literal values. Use them only when that output fits the task; generated CSS does not replace MUI theme integration. Resolve script paths relative to this skill's directory.

| Resource | Purpose |
| --- | --- |
| `scripts/generate-tokens.cjs` | Generate CSS from a JSON token configuration |
| `scripts/validate-tokens.cjs` | Identify hardcoded values for review |
| `templates/design-tokens-starter.json` | Reference structure for three token layers |

The historical slide-related data and scripts remain supporting resources, but presentation generation is outside this skill's active scope. No other skill is required to use the token and component guidance above.

## Verification

Check affected theme variants, contrast, focus visibility, and responsive states. Follow the frontend's existing verification commands for any application code changes, and report checks actually performed.
