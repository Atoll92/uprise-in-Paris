# Paris Tactical RPG - Rioters vs Riot Police

A turn-based tactical RPG inspired by XCOM mechanics, set in the streets of Paris where players control a squad of rioters against riot police.

## Features

- **Turn-based tactical combat** with 2 action points per unit
- **Cover system** with full and half cover providing damage reduction
- **Line of sight mechanics** for realistic combat
- **5 different rioter unit types** with unique abilities and stats
- **5 different police unit types** with AI-controlled behavior
- **Parisian street environment** with thematic elements like barricades, café terraces, and metro entrances
- **Grid-based movement** on a 20x15 tactical map

## Unit Types

### Rioters (Player Controlled)
- **Brawler**: High HP melee fighter with charge ability
- **Molotov Thrower**: Ranged area-of-effect damage dealer
- **Leader**: Inspirational unit with moderate combat ability
- **Medic**: Support unit for healing allies
- **Hacker**: Specialist for disabling police equipment

### Riot Police (AI Controlled)
- **Officer**: Standard police unit with balanced stats
- **Shield Officer**: Heavy armor, reduced front damage
- **Sniper**: Long-range, high-damage specialist
- **Teargas Launcher**: Area-of-effect crowd control
- **Drone Operator**: Reconnaissance and light combat

## Installation & Requirements

### Prerequisites
- Python 3.6 or higher
- pygame library

### Installation
```bash
pip install pygame
```

### Running the Game
```bash
python paris_tactical_rpg.py
```

## How to Play

### Controls
- **Left Click**: Select friendly units or move selected unit
- **E Key**: Attack nearest enemy in range (when unit is selected)
- **Q Key**: Use unit's special ability (when unit is selected)
- **H Key**: Show unit help information
- **Space**: End your turn
- **ESC**: Quit the game

### Gameplay
1. Select a rioter unit by left-clicking on it
2. Move the unit by left-clicking on an empty, passable tile
3. Attack enemies by right-clicking on them (if in range)
4. Each unit has 2 action points per turn
5. Use cover strategically to reduce incoming damage
6. End your turn with Space to let the AI move

### Winning
- **Victory**: Eliminate all police units
- **Defeat**: All rioter units are eliminated

## Game Mechanics

### Cover System
- **Full Cover** (brown tiles): 50% damage reduction
- **Half Cover** (light gray tiles): 25% damage reduction
- Position units behind cover to survive longer

### Action Points
- Each unit gets 2 action points per turn
- Moving costs 1 AP
- Attacking costs 1 AP
- Some abilities may cost different amounts

### Line of Sight
- Units can only attack enemies they can see
- Walls and full cover block line of sight
- Strategic positioning is key

## Map Elements

The procedurally placed Parisian street elements include:
- **Barricades** (full cover)
- **Café tables** (half cover)
- **Overturned cars** (full cover)
- **Bus stops** (half cover)
- **Metro entrances** (full cover)
- **Fountains and lampposts** (half cover)

## Design Choices & Limitations

### Design Choices
- **Simplified graphics**: Focus on gameplay clarity over visuals
- **Grid-based movement**: Ensures tactical precision
- **Two-faction system**: Clear distinction between player and AI
- **Fixed map size**: Optimized for tactical gameplay

### Current Limitations
- No save/load functionality
- Single map layout
- Basic AI behavior
- No unit progression/leveling
- No special abilities implementation yet

### Future Enhancements
- Multiple mission types and objectives
- Unit ability system
- Environmental effects (fire, smoke)
- More sophisticated AI
- Multiple map layouts
- Sound effects and music

## Technical Details

The game is built using:
- **Python 3** with pygame for graphics and input
- **Object-oriented design** with clear separation of game logic
- **Grid-based coordinate system** for tactical positioning
- **Simple AI** using pathfinding and target prioritization

## License

This is a demonstration project created for educational purposes.