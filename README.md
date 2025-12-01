# Polychrome 🎵

A modern, responsive music player and discovery application built with React and TypeScript.

## Features

- 🎧 **Music Player** - Full-featured audio player with queue management
- 🔍 **Search** - Discover music by tracks, albums, and artists
- 📚 **Library** - Manage your personal music library and playlists
- 🎨 **Explore** - Browse curated music content and recommendations
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🎼 **Album & Artist Pages** - Detailed views of albums, artists, and playlists
- 🔔 **Toast Notifications** - User-friendly feedback system
- ⚡ **Fast Performance** - Built with Vite for lightning-fast builds

## Tech Stack

- **Frontend Framework**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 6.2.0
- **Routing**: React Router 7.9.6
- **Icons**: Lucide React 0.555.0
- **Styling**: Modern CSS with responsive design

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout wrapper
│   ├── Player.tsx      # Music player component
│   ├── QueueSidebar.tsx # Queue management
│   ├── AddToPlaylistModal.tsx # Playlist modal
│   └── ...
├── pages/              # Page components
│   ├── Home.tsx        # Home page
│   ├── Search.tsx      # Search results
│   ├── Library.tsx     # User library
│   ├── Explore.tsx     # Music discovery
│   ├── ArtistDetails.tsx
│   ├── AlbumDetails.tsx
│   └── PlaylistDetails.tsx
├── context/            # React Context providers
│   ├── PlayerContext.tsx   # Player state management
│   ├── LibraryContext.tsx  # Library state management
│   └── ToastContext.tsx    # Toast notifications
├── services/           # API & utility services
│   ├── api.ts         # API client
│   ├── cache.ts       # Caching utilities
│   └── utils.ts       # Helper functions
├── types.ts           # TypeScript type definitions
├── App.tsx            # Root component
└── index.tsx          # Entry point
```

## Data Types

### Track
- `id`, `title`, `duration`, `trackNumber`, `volumeNumber`
- `artist`, `artists`, `album`
- `audioQuality`, `isrc`, `url`

### Album
- `id`, `title`, `cover`
- `releaseDate`, `artist`, `artists`
- `numberOfTracks`

### Artist
- `id`, `name`, `picture`, `type`

### Playlist
- `uuid`, `title`, `numberOfTracks`
- `image`, `creator`

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/simonfruehauf/Polychrome.git
cd Polychrome

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Build

```bash
# Build for production
npm run build
```

### Preview

```bash
# Preview production build locally
npm run preview
```

## Deployment

### Deploy to GitHub Pages

```bash
npm run deploy
```

This command will:
1. Build the project for production
2. Stage the `dist` folder in git
3. Create a deployment commit
4. Push to your repository

The site will be deployed to: `https://simonfruehauf.github.io/Polychrome/`

**Note**: Ensure your GitHub repository settings have GitHub Pages enabled on the `main` branch.

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

This is used for AI-powered features if integrated.

## Available Routes

- `/` - Redirects to `/explore`
- `/explore` - Music discovery and recommendations
- `/library` - Your personal music library
- `/search` - Search for music
- `/artist/:id` - Artist details page
- `/album/:id` - Album details page
- `/playlist/:id` - Playlist details page

## State Management

The application uses React Context for state management:

- **PlayerContext** - Manages currently playing track, queue, and playback state
- **LibraryContext** - Manages user's library, playlists, and favorites
- **ToastContext** - Manages toast notifications

## Components

- **Layout** - Main layout with navigation and player
- **Player** - Audio player with controls
- **QueueSidebar** - Queue display and management
- **AddToPlaylistModal** - Modal for adding tracks to playlists

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run deploy` | Build and deploy to GitHub Pages |

## Configuration

### Vite Config (`vite.config.ts`)

- Base path set to `/Polychrome/` for GitHub Pages subdirectory
- Dev server runs on port 3000
- React plugin enabled
- Environment variables for API keys

## License

[Add your license here]

## Author

Simon Frühauf

## Support

For issues and feature requests, please visit the [GitHub Issues](https://github.com/simonfruehauf/Polychrome/issues) page.
# Polychrome 🎵

A modern, responsive music player and discovery application built with React and TypeScript.

## Features

- 🎧 **Music Player** - Full-featured audio player with queue management
- 🔍 **Search** - Discover music by tracks, albums, and artists
- 📚 **Library** - Manage your personal music library and playlists
- 🎨 **Explore** - Browse curated music content and recommendations
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🎼 **Album & Artist Pages** - Detailed views of albums, artists, and playlists
- 🔔 **Toast Notifications** - User-friendly feedback system
- ⚡ **Fast Performance** - Built with Vite for lightning-fast builds

## Tech Stack

- **Frontend Framework**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 6.2.0
- **Routing**: React Router 7.9.6
- **Icons**: Lucide React 0.555.0
- **Styling**: Modern CSS with responsive design

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout wrapper
│   ├── Player.tsx      # Music player component
│   ├── QueueSidebar.tsx # Queue management
│   ├── AddToPlaylistModal.tsx # Playlist modal
│   └── ...
├── pages/              # Page components
│   ├── Home.tsx        # Home page
│   ├── Search.tsx      # Search results
│   ├── Library.tsx     # User library
│   ├── Explore.tsx     # Music discovery
│   ├── ArtistDetails.tsx
│   ├── AlbumDetails.tsx
│   └── PlaylistDetails.tsx
├── context/            # React Context providers
│   ├── PlayerContext.tsx   # Player state management
│   ├── LibraryContext.tsx  # Library state management
│   └── ToastContext.tsx    # Toast notifications
├── services/           # API & utility services
│   ├── api.ts         # API client
│   ├── cache.ts       # Caching utilities
│   └── utils.ts       # Helper functions
├── types.ts           # TypeScript type definitions
├── App.tsx            # Root component
└── index.tsx          # Entry point
```

## Data Types

### Track
- `id`, `title`, `duration`, `trackNumber`, `volumeNumber`
- `artist`, `artists`, `album`
- `audioQuality`, `isrc`, `url`

### Album
- `id`, `title`, `cover`
- `releaseDate`, `artist`, `artists`
- `numberOfTracks`

### Artist
- `id`, `name`, `picture`, `type`

### Playlist
- `uuid`, `title`, `numberOfTracks`
- `image`, `creator`

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/simonfruehauf/Polychrome.git
cd Polychrome

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Build

```bash
# Build for production
npm run build
```

### Preview

```bash
# Preview production build locally
npm run preview
```

## Deployment

### Deploy to GitHub Pages

```bash
npm run deploy
```

This command will:
1. Build the project for production
2. Stage the `dist` folder in git
3. Create a deployment commit
4. Push to your repository

The site will be deployed to: `https://simonfruehauf.github.io/Polychrome/`

**Note**: Ensure your GitHub repository settings have GitHub Pages enabled on the `main` branch.

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

This is used for AI-powered features if integrated.

## Available Routes

- `/` - Redirects to `/explore`
- `/explore` - Music discovery and recommendations
- `/library` - Your personal music library
- `/search` - Search for music
- `/artist/:id` - Artist details page
- `/album/:id` - Album details page
- `/playlist/:id` - Playlist details page

## State Management

The application uses React Context for state management:

- **PlayerContext** - Manages currently playing track, queue, and playback state
- **LibraryContext** - Manages user's library, playlists, and favorites
- **ToastContext** - Manages toast notifications

## Components

- **Layout** - Main layout with navigation and player
- **Player** - Audio player with controls
- **QueueSidebar** - Queue display and management
- **AddToPlaylistModal** - Modal for adding tracks to playlists

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run deploy` | Build and deploy to GitHub Pages |

## Configuration

### Vite Config (`vite.config.ts`)

- Base path set to `/Polychrome/` for GitHub Pages subdirectory
- Dev server runs on port 3000
- React plugin enabled
- Environment variables for API keys

## License

[Add your license here]

## Author

Simon Frühauf

## Support

For issues and feature requests, please visit the [GitHub Issues](https://github.com/simonfruehauf/Polychrome/issues) page.
