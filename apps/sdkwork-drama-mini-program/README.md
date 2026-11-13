# sdkwork-drama-mini-program

WeChat mini-program surface root for `sdkwork-drama`.

- Architecture: `MINI_PROGRAM_APP_ARCHITECTURE_SPEC.md`
- UI standard: `APP_MINI_PROGRAM_UI_SPEC.md`
- Platform: WeChat mini program
- Source root: `src/`

## Structure

```text
apps/sdkwork-drama-mini-program/
  src/
    app.ts
    app.json
    app.wxss
    pages/index/
    composition/components.ts
  types/miniprogram.d.ts
  config/components/
  specs/component.spec.json
  project.config.json
  tsconfig.json
```

`src/` is authored TypeScript. The root uses a custom fixed bottom tab bar with `Overview / Surfaces / Components / Me` and respect for the device safe-area inset. Platform JavaScript is a projection if a build step is added. Business pages belong in source packages projected into pages/subpackages, not directly in the shell.

## Commands

```bash
pnpm --dir apps/sdkwork-drama-mini-program typecheck
```

Open the root in WeChat DevTools with `miniprogramRoot = src/`.

## Boundaries

- No login/session implementation outside the appbase/iam wrapper.
- Do not import React, Flutter, Swift, Kotlin, or ArkTS UI.
- Generated SDK packages are resolved through the selected component contract; do not copy dependency routes or DTOs.
- Keep platform APIs behind typed host adapters.
