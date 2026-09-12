---
name: mobile-ui-audit
description: Audits mobile views across Expo, SwiftUI, and Jetpack Compose against Apple HIG, Material Design 3, and accessibility guidelines. Trigger when reviewing UI code or adding design tokens.
version: 1.0.0
---

# Mobile UI & Accessibility Audit Playbook

## Context & Objectives
This playbook audits mobile layout code to ensure components adapt across device form factors, dynamic themes, and system accessibility configurations.

## Inspection Checklist
### 1. Interactive Tap Boundaries
- **iOS / Swift**: Every control must have an effective hit frame of at least 44x44 pt. Check for `.frame(minWidth: 44, minHeight: 44)` or `.contentShape(Rectangle())`.
- **Android / Compose**: Interactive components must use `Modifier.minimumInteractiveComponentSize()` or measure at least 48x48 dp.
- **Expo / React Native**: Confirm `Pressable` or `TouchableOpacity` controls define `hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}` or meet minimum 44x44 dimensions.

### 2. Safe Boundaries and Window Insets
Verify that views do not clip under hardware cameras, status bars, or gesture navigation areas.
- **SwiftUI**: Ensure `.ignoresSafeArea()` is restricted to background decorative fills, never applied to text, forms, or controls.
- **Jetpack Compose**: Verify top-level containers consume `WindowInsets.safeDrawing` or apply inner padding from `Scaffold`.
- **React Native**: Confirm root containers use `SafeAreaView` from `react-native-safe-area-context` or `useSafeAreaInsets()`.

### 3. Semantic Design Tokens
- Flag hardcoded color hex values (such as `#FFFFFF`, `#1E1E1E`) in layout code.
- Enforce dynamic semantic tokens:
  - **SwiftUI**: `Color(.label)`, `Color(.secondarySystemBackground)`, or asset catalog dynamic colors.
  - **Jetpack Compose**: `MaterialTheme.colorScheme.surface`, `onSurface`, `primary`.
  - **React Native / NativeWind**: Semantic utility classes (`bg-background dark:bg-background-dark`, `text-foreground dark:text-foreground-dark`).

### 4. Typography Scaling
- **SwiftUI**: Flag static numeric points lacking Dynamic Type scaling (`@ScaledMetric`). Standard text must use semantic styles (`.font(.body)`, `.font(.headline)`).
- **Jetpack Compose**: Disallow raw integers or pixel dimensions; all font sizes must use Scalable Pixels (`sp`).
- **React Native**: Ensure `allowFontScaling={false}` is absent on `<Text>` components unless explicitly approved.

## Output Format
Generate an audit report formatted as a Markdown table:
| File & Line | Platform | Category | Defect Description | Remediation Diff |
