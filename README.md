# Chronoshift

A minimalist web application displaying current time across various historical and alternative timekeeping systems.

**[Live Demo](https://ticktockbent.github.io/chronoshift/)**

## Features

- **Multiple time systems**: Switch between different ways humanity has measured time
- **Live updates**: Each system updates at its natural interval
- **Learn more links**: Discover the history behind each system
- **Persistent selection**: Your preferred system is remembered
- **Zero dependencies**: Pure TypeScript, no runtime libraries

## Available Time Systems

| System | Description |
|--------|-------------|
| **Standard Time** | Gregorian calendar with 24-hour time |
| **Unix Epoch** | Seconds since January 1, 1970 UTC |
| **Kiloseconds** | SI-prefix metric time (ks into the day) |
| **Swatch Internet Time** | 1000 .beats per day, no time zones |
| **French Republican** | Revolutionary calendar with decimal time |
| **Holocene Era** | Human Era calendar (+10,000 years) |

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Adding New Time Systems

See [CONTRIBUTING.md](CONTRIBUTING.md) for a guide on adding new time systems. It's designed to be simple—just create one file and register it.

## Tech Stack

- **TypeScript** - Type-safe time calculations
- **Vite** - Fast builds and HMR
- **Vanilla CSS** - No framework needed for a minimalist UI

## Deployment

The project deploys automatically to GitHub Pages via GitHub Actions on push to `main`.

## License

[MIT](LICENSE)
