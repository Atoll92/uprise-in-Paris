# Paris Tactical RPG 3D - Rioters vs Riot Police

A 3D isometric tactical RPG built with Three.js, featuring rioters battling riot police in the streets of Paris.

## 🎮 How to Play

### Running the Game
1. Open `index.html` in a modern web browser
2. No installation required - runs directly in browser
3. Ensure JavaScript is enabled

### Controls
- **Mouse Click**: Select and move units
- **E Key**: Attack nearest enemy in range
- **Q Key**: Use unit's special ability
- **H Key**: Show unit help information
- **Space**: End turn
- **WASD**: Move camera around the battlefield
- **Mouse Wheel**: Zoom in/out

### Game Objective
Eliminate all enemy units to achieve victory!

## ✨ 3D Features

### Isometric View
- Classic tactical RPG perspective
- Smooth camera controls with WASD movement
- Zoom functionality for tactical overview

### 3D Graphics
- **Units**: Distinctive 3D models for each unit type
  - Cones for standard units
  - Boxes for shield units
  - Spheres for drones
- **Environment**: 3D Parisian street elements
  - Walls, barricades, café tables
  - Metro entrances, fountains, lampposts
- **Effects**: Real-time 3D particle effects
  - Floating damage numbers
  - Heal animations
  - Fire and smoke effects

### Advanced Lighting
- Directional sunlight with realistic shadows
- Ambient lighting for atmosphere
- Point lights for dramatic effects
- Dynamic fire glow effects

## 🏗️ Architecture

### Technology Stack
- **Three.js**: 3D graphics engine
- **WebGL**: Hardware-accelerated rendering
- **HTML5 Canvas**: Rendering surface
- **Modern JavaScript**: ES6+ features

### Performance Features
- Efficient 3D rendering with culling
- Optimized geometry for mobile devices
- Shadow mapping for realistic lighting
- Level-of-detail system for complex scenes

## 🎯 Unit Types & Abilities

### Rioters (Player Controlled)
1. **Brawler** (Red Cone)
   - High HP melee fighter
   - Extended movement range
   - Strong close combat

2. **Molotov Thrower** (Orange Cone)
   - **Q Ability**: Create 3x3 fire area
   - Ranged area-of-effect damage
   - Fire damages units each turn

3. **Leader** (Gold Cone)
   - **Q Ability**: Inspire nearby allies (+1 AP)
   - Moderate combat effectiveness
   - Force multiplier for team

4. **Medic** (Green Cone)
   - **Q Ability**: Heal nearby allies (+30 HP)
   - Essential support unit
   - Keep protected behind cover

5. **Hacker** (Purple Cone)
   - **Q Ability**: Deploy smoke screen
   - Provides concealment
   - Disrupts enemy line of sight

6. **Shield Bearer** (Silver Box)
   - **Q Ability**: Deploy temporary cover
   - High HP tank unit
   - Creates tactical advantages

### Police (AI Controlled)
1. **Officer** (Navy Cone) - Standard unit
2. **Shield Police** (Dark Blue Box) - Heavy armor
3. **Sniper** (Blue Cone) - Long-range specialist
4. **Teargas** (Gray Cone) - Area control
5. **Drone Operator** (Light Gray Sphere) - Reconnaissance

## 🏙️ Parisian Street Environment

### Cover System
- **Full Cover** (Brown blocks): 50% damage reduction
- **Half Cover** (Gray blocks): 25% damage reduction
- **Strategic positioning** is crucial for survival

### Environmental Elements
- **Barricades**: Makeshift defenses
- **Café Tables**: Parisian street furniture
- **Overturned Cars**: Heavy cover
- **Bus Stops**: Urban shelter
- **Metro Entrances**: Underground access
- **Fountains**: Central landmarks
- **Lampposts**: Light cover

## 🧠 AI System

### Intelligent Police Behavior
- **Target Prioritization**: Threats assessed by unit type and health
- **Tactical Movement**: AI seeks cover and optimal positions
- **Unit-Specific Logic**: Snipers maintain distance, others close in
- **Cover Utilization**: AI units use environmental protection
- **Flanking**: AI attempts to bypass player cover

### Dynamic Difficulty
- AI adapts to player strategies
- Realistic combat decision-making
- Challenging but fair opponent behavior

## 🎨 Visual Effects

### 3D Animations
- **Unit Movement**: Smooth interpolated movement
- **Combat Effects**: Floating damage/heal numbers
- **Environmental**: Animated fire and smoke
- **UI Elements**: 3D health bars above units

### Lighting Effects
- **Dynamic Shadows**: Real-time shadow casting
- **Fire Glow**: Emissive materials for fire tiles
- **Atmospheric Lighting**: Dramatic directional lighting
- **UI Glow**: Glowing selection highlights

## 🔧 Technical Details

### Browser Compatibility
- **Chrome**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile**: Optimized for touch devices

### Performance
- **60 FPS**: Smooth gameplay on modern devices
- **WebGL 2.0**: Advanced graphics features
- **Efficient Rendering**: Optimized for web browsers
- **Memory Management**: Automatic cleanup of 3D objects

## 🎯 Game Mechanics

### Turn-Based Combat
- **Action Points**: 2 AP per unit per turn
- **Movement**: Costs 1 AP
- **Attacks**: Cost 1 AP
- **Abilities**: Cost 1 AP

### Line of Sight
- **3D Visibility**: True 3D line of sight calculations
- **Cover Blocking**: Walls and full cover block vision
- **Strategic Positioning**: Flanking provides advantages

### Victory Conditions
- **Rioter Victory**: Eliminate all police units
- **Police Victory**: Eliminate all rioter units
- **Tactical Depth**: Multiple paths to victory

## 📱 Mobile Support

### Touch Controls
- **Tap**: Select and move units
- **Touch & Hold**: Access context menu
- **Pinch**: Zoom in/out
- **Drag**: Pan camera

### Responsive Design
- **Adaptive UI**: Scales to screen size
- **Touch-Friendly**: Large tap targets
- **Mobile Optimized**: Efficient rendering

## 🎵 Future Enhancements

### Planned Features
- **3D Sound**: Positional audio effects
- **More Maps**: Additional Parisian locations
- **Campaign Mode**: Multi-battle progression
- **Multiplayer**: Online tactical battles
- **VR Support**: Immersive virtual reality mode

### Performance Improvements
- **Level of Detail**: Distance-based quality scaling
- **Occlusion Culling**: Hide non-visible objects
- **Texture Streaming**: Dynamic quality adjustment
- **Mobile Optimization**: Enhanced mobile performance

## 🚀 Getting Started

1. **Download**: Clone or download the project files
2. **Open**: Open `index.html` in your web browser
3. **Play**: Start tactical combat immediately
4. **Learn**: Use H key for in-game help

**No server required** - this is a client-side web application that runs entirely in your browser!

---

*Experience tactical combat in stunning 3D as rioters clash with police in the streets of Paris. Every decision matters in this chess-like battle of wits and strategy.*