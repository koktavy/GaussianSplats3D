# Radiance Portfolio

A 3D Gaussian Splatting portfolio powered by [Spark](https://sparkjs.dev) and Three.js. View photogrammetry captures as interactive 3D scenes directly in your browser.

## Features

- **🚀 Spark-Powered**: Uses the advanced [Spark](https://github.com/sparkjsdev/spark) renderer by World Labs
- **⚡ GPU-Accelerated**: WASM + GPU-based sorting eliminates visual artifacts
- **🎨 Three.js Native**: Standard Three.js integration for maximum flexibility
- **☁️ Cloud-Hosted**: Assets served from DigitalOcean Spaces
- **📱 Responsive**: Works on desktop and mobile devices
- **🎯 Easy Navigation**: Sidebar UI for quick scene switching

## Technology Stack

- [Spark](https://sparkjs.dev) v0.1.10 - Advanced 3D Gaussian Splatting renderer
- [Three.js](https://threejs.org) v0.178.0 - WebGL rendering engine
- DigitalOcean Spaces - Asset storage and delivery
- Vanilla JavaScript - No framework dependencies

## Getting Started

### Prerequisites

- Node.js (v18+)
- DigitalOcean Spaces account (for asset hosting)

### Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd radiance-portfolio
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with your DigitalOcean credentials:
```env
DO_SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
DO_SPACES_KEY=your_access_key
DO_SPACES_SECRET=your_secret_key
DO_SPACES_BUCKET=radiance-pipeline
```

4. Start the development server:
```bash
npm start
```

5. Open your browser to `http://localhost:3000`

## Project Structure

```
radiance-portfolio/
├── demo/
│   ├── index.html      # Main portfolio viewer
│   ├── assets/         # Static assets (favicons, etc.)
│   └── js/             # Utility scripts
├── util/
│   ├── server.js       # Development server
│   └── spaces-list.js  # DigitalOcean Spaces integration
├── .env                # Environment variables (not in repo)
└── package.json        # Project dependencies
```

## Usage

The portfolio automatically loads `.ply` files from your DigitalOcean Spaces bucket. Simply upload your Gaussian Splat files and they'll appear in the sidebar.

### Controls

**Mouse:**
- Left click + drag: Orbit camera around the scene
- Right click + drag: Pan the camera
- Scroll wheel: Zoom in/out

**Keyboard:**
- Click scene names in the sidebar to switch between scenes

### Adding New Scenes

1. Upload `.ply` files to your DigitalOcean Spaces bucket
2. Refresh the portfolio page
3. New scenes will automatically appear in the sidebar

## File Format Support

Spark supports multiple 3D Gaussian Splatting formats:
- `.ply` - Standard Gaussian Splatting format
- `.splat` - Compressed splat format
- `.spz` - Highly optimized format
- `.ksplat` - Legacy format from GaussianSplats3D
- `.sog` - PlayCanvas format

## Development

The server includes CORS headers required for SharedArrayBuffer (used by Spark's WASM worker):
```javascript
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

The `/list` endpoint proxies requests to DigitalOcean Spaces to retrieve the list of available scenes.

## Migration from GaussianSplats3D

This project was migrated from `@mkkellogg/gaussian-splats-3d` to Spark in March 2026. The migration provides:

- **Better performance**: GPU-accelerated sorting vs CPU-based
- **No visual artifacts**: Eliminates "popping" when rotating
- **Active development**: Spark is maintained by World Labs
- **Modern architecture**: Native Three.js integration
- **Future-ready**: Easy upgrade path to Spark 2.0 with LoD streaming

## Credits

- Gaussian Splatting technique: [INRIA](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/)
- Spark renderer: [World Labs](https://github.com/sparkjsdev/spark)
- Original viewer: [Mark Kellogg](https://github.com/mkkellogg/GaussianSplats3D)

## License

MIT

