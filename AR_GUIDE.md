# Shreya & Shravan — WebAR Wedding Invitation

A browser wedding invitation. Guests open the link, see the 3D **mantapa** with the
couple, spin it around, and tap **"View in Your Room (AR)"** to place a life-size /
miniature mantapa on their floor — the same engine Google's AR animals use
(**Scene Viewer** on Android, **AR Quick Look** on iPhone). No app install, no camera
permission needed for the 3D view.

## How it works

| Layer | Tech |
|---|---|
| 3D + AR | [`<model-viewer>`](https://modelviewer.dev) → Scene Viewer (Android) / Quick Look (iOS) |
| Scene asset | `public/models/scene.glb` (Android/web) + `public/models/scene.usdz` (iOS) |
| Scene source | `src/environment/Mantapa.js` + `src/avatar/Avatar.js`, assembled by `src/buildScene.js` |
| UI flow | `index.html` + `src/main.js` (splash → 3D viewer → invitation card) |

The `.glb`/`.usdz` are **generated** from the Three.js scene — you don't hand-edit them.

## Regenerating the AR model (`scene.glb` + `scene.usdz`)

Run this whenever you change the mantapa, avatars, or swap in Ready Player Me models:

1. `npm run dev`
2. Open **http://localhost:5173/export.html** in a browser (Chrome).
3. In the DevTools console run:  `await window.__exportAll()`
4. It writes `public/models/scene.glb` and `public/models/scene.usdz` to disk.
5. `npm run build` to bundle for deploy.

## Avatar faces (current setup)

The bride & groom avatars use **real face photos** mapped onto a flat, feathered
"face plate" on each head (so the photo stays undistorted and recognizable).

- Source crops live in `public/faces/bride_face.jpg` and `public/faces/groom_face.jpg`
  — square, tightly cropped to the face.
- They're baked into `scene.glb` / `scene.usdz` at export time, so the live site
  doesn't load them at runtime.
- To use different photos: replace those two square face crops (keep them tight to
  the face), then regenerate the model (see below). Fine-tune framing with the
  `scale` / `dy` values in `src/buildScene.js`.

The couple also has a baked **"Welcome" wave animation** (right arm waves, left arm
opens, slight bow) that auto-plays on Android/web. iOS Quick Look shows a static
welcoming pose.

## Swapping in realistic Ready Player Me avatars

1. Go to **https://readyplayer.me** → create a **full-body** avatar for Shreya and one
   for Shravan (you can build from a selfie). Choose Indian wedding attire if available.
2. Download each as **GLB**, and drop them in `public/models/` named exactly:
   - `bride-rpm.glb`
   - `groom-rpm.glb`
3. Regenerate the model (steps above). The exporter auto-detects the two files and uses
   them instead of the procedural avatars — see `loadAvatarGLBs()` in `src/export.js`.
4. If positioning needs tweaking, adjust the avatar `position`/`rotation` in
   `src/buildScene.js`.

> Tip: For bow/wave motion you can rig the RPM avatars with Mixamo animations and bake the
> clip into the GLB — model-viewer plays glTF animations via `animation-name` + `play()`.

## Deploying (free HTTPS — required for AR on phones)

- Run `npm run build` → outputs `dist/` (includes `dist/models/`).
- Drag the **`dist/`** folder onto **https://app.netlify.com/drop** (or use Vercel).
- Share the resulting `https://…` link. AR needs HTTPS; `localhost` works for testing only.

## Editing wedding details

All text (date, venue, families, hashtag) is plain HTML in `index.html` under
`#invitation-card`.
