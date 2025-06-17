# Paris Tactical RPG 3D

A 3D isometric tactical RPG set in the streets of Paris, featuring rioters vs police in strategic combat.

## 🎮 Game Features

- **3D Isometric Graphics** with authentic Parisian cobblestone streets
- **Turn-based Tactical Combat** between rioters and police
- **Unit Abilities** - Each unit type has unique special abilities
- **Cover System** - Use environmental cover for tactical advantage
- **Audio Effects** - Sound feedback for all game actions
- **Zoom Controls** - Get closer to the action or see the bigger picture

## 🚀 Quick Start

### Option 1: Run the Python Server (Recommended)
```bash
python3 start_server.py
```
This will:
- Start a server on port 8000
- Automatically open the game in your browser
- Enable all texture features

### Option 2: Manual Server
```bash
python3 -m http.server 8000
```
Then open: http://localhost:8000

## 🎯 Controls

| Control | Action |
|---------|--------|
| **Mouse** | Select and move units |
| **E** | Enter attack mode |
| **Q** | Use unit ability |
| **H** | Show unit help |
| **Space** | End turn |
| **ESC** | Cancel targeting |
| **Arrow Keys** | Move camera |
| **+ / -** | Zoom in/out |
| **🔍 Buttons** | UI zoom controls |

## 🎨 Visual Features

- **Authentic Textures**: Parisian cobblestone street textures
- **Dynamic Lighting**: Realistic shadows and lighting effects
- **Particle Effects**: Fire, smoke, and damage indicators
- **Health Bars**: Real-time unit health visualization

## 🎵 Audio

- **Sound Effects**: Combat, movement, and UI sounds
- **Toggle**: Use the 🔊 button to enable/disable audio
- **Web Audio**: Modern browser audio support

## 🏗️ Technical Notes

- Built with **Three.js** for 3D graphics
- Uses **Web Audio API** for sound effects
- Requires **HTTP server** for texture loading (CORS security)
- Optimized for modern browsers

## 🎭 Unit Types

### Rioters
- **Brawler**: High damage melee fighter
- **Molotov**: Area-of-effect fire attacks
- **Leader**: Inspires allies (+1 AP)
- **Medic**: Heals nearby allies
- **Hacker**: Creates smoke screens
- **Shield**: Deploys temporary cover

### Police
- **Officer**: Standard ranged unit
- **Shield**: Armored close combat
- **Sniper**: Long-range precision
- **Teargas**: Area denial
- **Drone**: Fast reconnaissance

## 🎲 Game Mechanics

- **Action Points (AP)**: Each unit has 2 AP per turn
- **Line of Sight**: Tactical positioning matters
- **Cover System**: 25% and 50% damage reduction
- **Range**: Each unit has different attack ranges
- **Special Abilities**: Unique powers for each unit type

Enjoy the tactical combat in the streets of Paris! 🇫🇷