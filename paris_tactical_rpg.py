#!/usr/bin/env python3
"""
Paris Tactical RPG - Rioters vs Riot Police
A turn-based tactical game inspired by XCOM mechanics
"""

import pygame
import sys
import random
import math
from enum import Enum
from typing import List, Tuple, Optional, Dict
from dataclasses import dataclass

# Initialize Pygame
pygame.init()

# Constants
WINDOW_WIDTH = 1200
WINDOW_HEIGHT = 800
GRID_SIZE = 32
MAP_WIDTH = 20
MAP_HEIGHT = 15
FPS = 60

# Colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
RED = (200, 50, 50)
BLUE = (50, 100, 200)
GREEN = (50, 200, 50)
YELLOW = (255, 255, 100)
GRAY = (128, 128, 128)
DARK_GRAY = (64, 64, 64)
LIGHT_GRAY = (192, 192, 192)
ORANGE = (255, 140, 0)
PURPLE = (128, 0, 128)
BROWN = (139, 69, 19)
DARK_RED = (150, 0, 0)
DARK_BLUE = (0, 0, 150)
GOLD = (255, 215, 0)
SILVER = (192, 192, 192)
CRIMSON = (220, 20, 60)
NAVY = (0, 0, 128)

class TileType(Enum):
    EMPTY = 0
    WALL = 1
    FULL_COVER = 2
    HALF_COVER = 3
    FIRE = 4
    SMOKE = 5

class UnitType(Enum):
    RIOTER_BRAWLER = 0
    RIOTER_MOLOTOV = 1
    RIOTER_LEADER = 2
    RIOTER_MEDIC = 3
    RIOTER_HACKER = 4
    RIOTER_SHIELD = 5
    POLICE_OFFICER = 6
    POLICE_SHIELD = 7
    POLICE_SNIPER = 8
    POLICE_TEARGAS = 9
    POLICE_DRONE = 10

class Faction(Enum):
    RIOTER = 0
    POLICE = 1

@dataclass
class Position:
    x: int
    y: int
    
    def __eq__(self, other):
        return self.x == other.x and self.y == other.y
    
    def distance_to(self, other):
        return abs(self.x - other.x) + abs(self.y - other.y)

class Tile:
    def __init__(self, tile_type: TileType = TileType.EMPTY):
        self.type = tile_type
        self.unit = None
        
    def is_passable(self):
        return self.type in [TileType.EMPTY, TileType.HALF_COVER, TileType.FIRE, TileType.SMOKE] and self.unit is None
    
    def provides_cover(self):
        if self.type == TileType.FULL_COVER:
            return 0.5  # 50% damage reduction
        elif self.type == TileType.HALF_COVER:
            return 0.25  # 25% damage reduction
        return 0.0

class Unit:
    def __init__(self, unit_type: UnitType, position: Position, faction: Faction):
        self.type = unit_type
        self.position = position
        self.faction = faction
        self.max_hp = self._get_max_hp()
        self.hp = self.max_hp
        self.max_ap = 2
        self.ap = self.max_ap
        self.damage = self._get_damage()
        self.range = self._get_range()
        self.move_range = self._get_move_range()
        self.abilities = self._get_abilities()
        self.alive = True
        
    def _get_max_hp(self):
        hp_map = {
            UnitType.RIOTER_BRAWLER: 120,
            UnitType.RIOTER_MOLOTOV: 80,
            UnitType.RIOTER_LEADER: 100,
            UnitType.RIOTER_MEDIC: 70,
            UnitType.RIOTER_HACKER: 75,
            UnitType.RIOTER_SHIELD: 130,
            UnitType.POLICE_OFFICER: 100,
            UnitType.POLICE_SHIELD: 140,
            UnitType.POLICE_SNIPER: 80,
            UnitType.POLICE_TEARGAS: 90,
            UnitType.POLICE_DRONE: 60,
        }
        return hp_map.get(self.type, 100)
    
    def _get_damage(self):
        damage_map = {
            UnitType.RIOTER_BRAWLER: 45,
            UnitType.RIOTER_MOLOTOV: 60,
            UnitType.RIOTER_LEADER: 35,
            UnitType.RIOTER_MEDIC: 25,
            UnitType.RIOTER_HACKER: 30,
            UnitType.RIOTER_SHIELD: 40,
            UnitType.POLICE_OFFICER: 50,
            UnitType.POLICE_SHIELD: 35,
            UnitType.POLICE_SNIPER: 80,
            UnitType.POLICE_TEARGAS: 40,
            UnitType.POLICE_DRONE: 25,
        }
        return damage_map.get(self.type, 40)
    
    def _get_range(self):
        range_map = {
            UnitType.RIOTER_BRAWLER: 1,
            UnitType.RIOTER_MOLOTOV: 4,
            UnitType.RIOTER_LEADER: 3,
            UnitType.RIOTER_MEDIC: 2,
            UnitType.RIOTER_HACKER: 2,
            UnitType.RIOTER_SHIELD: 1,
            UnitType.POLICE_OFFICER: 4,
            UnitType.POLICE_SHIELD: 1,
            UnitType.POLICE_SNIPER: 8,
            UnitType.POLICE_TEARGAS: 5,
            UnitType.POLICE_DRONE: 3,
        }
        return range_map.get(self.type, 3)
    
    def _get_move_range(self):
        return 4 if self.type == UnitType.RIOTER_BRAWLER else 3
    
    def _get_abilities(self):
        return []
    
    def take_damage(self, damage: int):
        self.hp -= damage
        if self.hp <= 0:
            self.hp = 0
            self.alive = False
    
    def reset_ap(self):
        self.ap = self.max_ap
    
    def can_attack(self, target_pos: Position, game_map):
        if self.ap < 1:
            return False
        distance = self.position.distance_to(target_pos)
        return distance <= self.range and self._has_line_of_sight(target_pos, game_map)
    
    def _has_line_of_sight(self, target_pos: Position, game_map):
        # Simple line of sight - check if there's a wall blocking
        dx = target_pos.x - self.position.x
        dy = target_pos.y - self.position.y
        
        if dx == 0 and dy == 0:
            return False
        
        steps = max(abs(dx), abs(dy))
        if steps == 0:
            return True
            
        step_x = dx / steps
        step_y = dy / steps
        
        for i in range(1, steps):
            check_x = int(self.position.x + step_x * i)
            check_y = int(self.position.y + step_y * i)
            
            if (0 <= check_x < MAP_WIDTH and 0 <= check_y < MAP_HEIGHT and
                game_map.tiles[check_y][check_x].type == TileType.WALL):
                return False
        
        return True
    
    def get_name(self):
        name_map = {
            UnitType.RIOTER_BRAWLER: "Brawler",
            UnitType.RIOTER_MOLOTOV: "Molotov",
            UnitType.RIOTER_LEADER: "Leader",
            UnitType.RIOTER_MEDIC: "Medic",
            UnitType.RIOTER_HACKER: "Hacker",
            UnitType.RIOTER_SHIELD: "Shield",
            UnitType.POLICE_OFFICER: "Officer",
            UnitType.POLICE_SHIELD: "Shield Police",
            UnitType.POLICE_SNIPER: "Sniper",
            UnitType.POLICE_TEARGAS: "Teargas",
            UnitType.POLICE_DRONE: "Drone Op",
        }
        return name_map.get(self.type, "Unit")
    
    def get_color(self):
        if self.faction == Faction.RIOTER:
            color_map = {
                UnitType.RIOTER_BRAWLER: CRIMSON,
                UnitType.RIOTER_MOLOTOV: ORANGE,
                UnitType.RIOTER_LEADER: GOLD,
                UnitType.RIOTER_MEDIC: GREEN,
                UnitType.RIOTER_HACKER: PURPLE,
                UnitType.RIOTER_SHIELD: SILVER,
            }
            return color_map.get(self.type, RED)
        else:
            color_map = {
                UnitType.POLICE_OFFICER: NAVY,
                UnitType.POLICE_SHIELD: DARK_BLUE,
                UnitType.POLICE_SNIPER: BLUE,
                UnitType.POLICE_TEARGAS: GRAY,
                UnitType.POLICE_DRONE: LIGHT_GRAY,
            }
            return color_map.get(self.type, BLUE)

class GameMap:
    def __init__(self):
        self.tiles = [[Tile() for _ in range(MAP_WIDTH)] for _ in range(MAP_HEIGHT)]
        self.units = []
        self._generate_parisian_street()
    
    def _generate_parisian_street(self):
        # Create a simple Parisian street layout
        # Add some buildings (walls)
        for y in range(MAP_HEIGHT):
            for x in range(MAP_WIDTH):
                if x == 0 or x == MAP_WIDTH - 1 or y == 0 or y == MAP_HEIGHT - 1:
                    self.tiles[y][x] = Tile(TileType.WALL)
        
        # Add some cover elements
        cover_positions = [
            (3, 3, TileType.FULL_COVER),  # Barricade
            (7, 5, TileType.HALF_COVER),  # Cafe table
            (12, 8, TileType.FULL_COVER), # Overturned car
            (15, 4, TileType.HALF_COVER), # Bus stop
            (5, 10, TileType.FULL_COVER), # Metro entrance
            (10, 12, TileType.HALF_COVER), # Fountain
            (8, 8, TileType.HALF_COVER),   # Lamppost
        ]
        
        for x, y, tile_type in cover_positions:
            if 0 <= x < MAP_WIDTH and 0 <= y < MAP_HEIGHT:
                self.tiles[y][x] = Tile(tile_type)
    
    def is_valid_position(self, pos: Position):
        return 0 <= pos.x < MAP_WIDTH and 0 <= pos.y < MAP_HEIGHT
    
    def get_tile(self, pos: Position):
        if self.is_valid_position(pos):
            return self.tiles[pos.y][pos.x]
        return None
    
    def can_move_to(self, pos: Position):
        tile = self.get_tile(pos)
        return tile and tile.is_passable()
    
    def add_unit(self, unit: Unit):
        if self.can_move_to(unit.position):
            self.units.append(unit)
            self.tiles[unit.position.y][unit.position.x].unit = unit
    
    def move_unit(self, unit: Unit, new_pos: Position):
        if self.can_move_to(new_pos):
            # Clear old position
            self.tiles[unit.position.y][unit.position.x].unit = None
            # Set new position
            unit.position = new_pos
            self.tiles[new_pos.y][new_pos.x].unit = unit
            return True
        return False
    
    def remove_unit(self, unit: Unit):
        if unit in self.units:
            self.units.remove(unit)
            self.tiles[unit.position.y][unit.position.x].unit = None

class Game:
    def __init__(self):
        self.screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
        pygame.display.set_caption("Paris Tactical RPG - Rioters vs Police")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.Font(None, 24)
        self.small_font = pygame.font.Font(None, 18)
        
        self.game_map = GameMap()
        self.selected_unit = None
        self.current_faction = Faction.RIOTER
        self.turn_number = 1
        self.game_state = "playing"  # "playing", "victory", "defeat"
        
        # Animation and feedback systems
        self.animations = []
        self.combat_log = []
        self.damage_numbers = []
        
        self._setup_units()
    
    def _setup_units(self):
        # Add rioter units
        rioter_positions = [(2, 2), (2, 4), (4, 2), (4, 4), (6, 3)]
        rioter_types = [
            UnitType.RIOTER_BRAWLER,
            UnitType.RIOTER_MOLOTOV,
            UnitType.RIOTER_LEADER,
            UnitType.RIOTER_MEDIC,
            UnitType.RIOTER_HACKER
        ]
        
        for i, (x, y) in enumerate(rioter_positions):
            unit = Unit(rioter_types[i], Position(x, y), Faction.RIOTER)
            self.game_map.add_unit(unit)
        
        # Add police units
        police_positions = [(16, 10), (16, 12), (14, 11), (18, 11), (17, 9)]
        police_types = [
            UnitType.POLICE_OFFICER,
            UnitType.POLICE_OFFICER,
            UnitType.POLICE_SHIELD,
            UnitType.POLICE_SNIPER,
            UnitType.POLICE_TEARGAS
        ]
        
        for i, (x, y) in enumerate(police_positions):
            unit = Unit(police_types[i], Position(x, y), Faction.POLICE)
            self.game_map.add_unit(unit)
    
    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                return False
            
            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    return False
                elif event.key == pygame.K_SPACE:
                    self._end_turn()
                elif event.key == pygame.K_e and self.current_faction == Faction.RIOTER:
                    self._handle_attack_key()
                elif event.key == pygame.K_q and self.current_faction == Faction.RIOTER:
                    self._handle_ability_key()
                elif event.key == pygame.K_h and self.selected_unit:
                    self._show_unit_help()
            
            if event.type == pygame.MOUSEBUTTONDOWN and self.current_faction == Faction.RIOTER:
                if event.button == 1:  # Left click
                    self._handle_left_click(event.pos)
        
        return True
    
    def _handle_left_click(self, mouse_pos):
        grid_x = mouse_pos[0] // GRID_SIZE
        grid_y = mouse_pos[1] // GRID_SIZE
        
        if not (0 <= grid_x < MAP_WIDTH and 0 <= grid_y < MAP_HEIGHT):
            return
        
        clicked_pos = Position(grid_x, grid_y)
        clicked_tile = self.game_map.get_tile(clicked_pos)
        
        if clicked_tile and clicked_tile.unit:
            if clicked_tile.unit.faction == self.current_faction:
                self.selected_unit = clicked_tile.unit
        else:
            if self.selected_unit and self.selected_unit.ap >= 1:
                self._try_move_unit(clicked_pos)
    
    def _handle_attack_key(self):
        if not self.selected_unit:
            return
        
        # Find attackable enemies in range
        attackable_enemies = []
        for unit in self.game_map.units:
            if (unit.faction != self.current_faction and unit.alive and 
                self.selected_unit.can_attack(unit.position, self.game_map)):
                attackable_enemies.append(unit)
        
        if attackable_enemies:
            # Attack the nearest enemy
            nearest_enemy = min(attackable_enemies, 
                              key=lambda e: self.selected_unit.position.distance_to(e.position))
            self._try_attack(nearest_enemy)
    
    def _handle_ability_key(self):
        if not self.selected_unit or self.selected_unit.ap < 1:
            return
        
        # Use unit's special ability based on type
        if self.selected_unit.type == UnitType.RIOTER_MOLOTOV:
            self._use_molotov_ability()
        elif self.selected_unit.type == UnitType.RIOTER_MEDIC:
            self._use_heal_ability()
        elif self.selected_unit.type == UnitType.RIOTER_HACKER:
            self._use_hack_ability()
        elif self.selected_unit.type == UnitType.RIOTER_SHIELD:
            self._use_shield_ability()
        elif self.selected_unit.type == UnitType.RIOTER_LEADER:
            self._use_inspire_ability()
    
    def _use_molotov_ability(self):
        # Create fire in a 3x3 area around the molotov thrower
        if self.selected_unit.ap < 1:
            return
        
        center_x, center_y = self.selected_unit.position.x, self.selected_unit.position.y
        
        for dx in [-1, 0, 1]:
            for dy in [-1, 0, 1]:
                fire_x, fire_y = center_x + dx, center_y + dy
                if (0 <= fire_x < MAP_WIDTH and 0 <= fire_y < MAP_HEIGHT):
                    tile = self.game_map.tiles[fire_y][fire_x]
                    if tile.type == TileType.EMPTY or tile.type == TileType.HALF_COVER:
                        tile.type = TileType.FIRE
                        # Damage any unit in fire
                        if tile.unit:
                            tile.unit.take_damage(20)
                            if not tile.unit.alive:
                                self.game_map.remove_unit(tile.unit)
        
        self.selected_unit.ap -= 1
    
    def _use_heal_ability(self):
        if self.selected_unit.ap < 1:
            return
        
        # Heal nearby allies
        center_x, center_y = self.selected_unit.position.x, self.selected_unit.position.y
        
        for unit in self.game_map.units:
            if (unit.faction == self.current_faction and unit != self.selected_unit and
                unit.position.distance_to(self.selected_unit.position) <= 2):
                unit.hp = min(unit.max_hp, unit.hp + 30)
        
        self.selected_unit.ap -= 1
    
    def _use_hack_ability(self):
        if self.selected_unit.ap < 1:
            return
        
        # Create smoke around hacker to provide concealment
        center_x, center_y = self.selected_unit.position.x, self.selected_unit.position.y
        
        for dx in [-1, 0, 1]:
            for dy in [-1, 0, 1]:
                smoke_x, smoke_y = center_x + dx, center_y + dy
                if (0 <= smoke_x < MAP_WIDTH and 0 <= smoke_y < MAP_HEIGHT):
                    tile = self.game_map.tiles[smoke_y][smoke_x]
                    if tile.type == TileType.EMPTY:
                        tile.type = TileType.SMOKE
        
        self.selected_unit.ap -= 1
    
    def _use_shield_ability(self):
        if self.selected_unit.ap < 1:
            return
        
        # Create temporary cover in front of the shield bearer
        directions = [(0, -1), (1, 0), (0, 1), (-1, 0)]  # Up, Right, Down, Left
        
        for dx, dy in directions:
            shield_x = self.selected_unit.position.x + dx
            shield_y = self.selected_unit.position.y + dy
            
            if (0 <= shield_x < MAP_WIDTH and 0 <= shield_y < MAP_HEIGHT):
                tile = self.game_map.tiles[shield_y][shield_x]
                if tile.type == TileType.EMPTY and not tile.unit:
                    tile.type = TileType.HALF_COVER
                    break  # Only create one shield
        
        self.selected_unit.ap -= 1
    
    def _use_inspire_ability(self):
        if self.selected_unit.ap < 1:
            return
        
        # Give nearby allies extra AP
        for unit in self.game_map.units:
            if (unit.faction == self.current_faction and unit != self.selected_unit and
                unit.position.distance_to(self.selected_unit.position) <= 3):
                unit.ap = min(unit.max_ap, unit.ap + 1)
        
        self.selected_unit.ap -= 1
    
    def _show_unit_help(self):
        if not self.selected_unit:
            return
        
        # Print unit abilities to console for now
        abilities = {
            UnitType.RIOTER_BRAWLER: "Charge: High damage melee fighter",
            UnitType.RIOTER_MOLOTOV: "Q: Create fire area (3x3)",
            UnitType.RIOTER_LEADER: "Q: Inspire nearby allies (+1 AP)",
            UnitType.RIOTER_MEDIC: "Q: Heal nearby allies (+30 HP)",
            UnitType.RIOTER_HACKER: "Q: Create smoke for concealment",
            UnitType.RIOTER_SHIELD: "Q: Deploy temporary cover",
        }
        
        ability_text = abilities.get(self.selected_unit.type, "No special ability")
        print(f"{self.selected_unit.get_name()}: {ability_text}")
    
    def _try_move_unit(self, target_pos):
        if not self.selected_unit or self.selected_unit.ap < 1:
            return
        
        distance = self.selected_unit.position.distance_to(target_pos)
        
        if distance <= self.selected_unit.move_range and self.game_map.can_move_to(target_pos):
            self.game_map.move_unit(self.selected_unit, target_pos)
            self.selected_unit.ap -= 1
    
    def _try_attack(self, target):
        if not self.selected_unit or self.selected_unit.ap < 1:
            return
        
        if self.selected_unit.can_attack(target.position, self.game_map):
            damage = self.selected_unit.damage
            
            # Apply cover reduction
            target_tile = self.game_map.get_tile(target.position)
            cover_reduction = target_tile.provides_cover()
            damage = int(damage * (1 - cover_reduction))
            
            # Add some randomness
            damage = random.randint(int(damage * 0.8), int(damage * 1.2))
            
            # Create damage number animation
            self._add_damage_number(target.position, damage)
            
            # Add to combat log
            cover_text = f" (through {int(cover_reduction*100)}% cover)" if cover_reduction > 0 else ""
            log_message = f"{self.selected_unit.get_name()} deals {damage} damage to {target.get_name()}{cover_text}"
            self._add_combat_log(log_message)
            
            target.take_damage(damage)
            self.selected_unit.ap -= 1
            
            if not target.alive:
                self.game_map.remove_unit(target)
                self._add_combat_log(f"{target.get_name()} is eliminated!")
                if target == self.selected_unit:
                    self.selected_unit = None
    
    def _end_turn(self):
        # Reset AP for current faction
        for unit in self.game_map.units:
            if unit.faction == self.current_faction:
                unit.reset_ap()
        
        # Switch faction
        if self.current_faction == Faction.RIOTER:
            self.current_faction = Faction.POLICE
            self._ai_turn()
        else:
            self.current_faction = Faction.RIOTER
            self.turn_number += 1
        
        self.selected_unit = None
        self._check_win_conditions()
    
    def _ai_turn(self):
        police_units = [u for u in self.game_map.units if u.faction == Faction.POLICE and u.alive]
        
        for unit in police_units:
            while unit.ap > 0:
                # AI decision making based on unit type and situation
                if not self._ai_make_decision(unit):
                    break
    
    def _ai_make_decision(self, unit):
        # Find all enemies
        enemies = [u for u in self.game_map.units if u.faction == Faction.RIOTER and u.alive]
        if not enemies:
            return False
        
        # Prioritize targets based on threat level
        priority_targets = self._ai_prioritize_targets(unit, enemies)
        
        if not priority_targets:
            return False
        
        target = priority_targets[0]
        
        # Check if we can attack
        if unit.can_attack(target.position, self.game_map):
            self._ai_attack(unit, target)
            return True
        
        # Try to move to cover or better position
        if not self._ai_move_tactically(unit, target):
            # Fallback: move towards target
            self._ai_move_towards(unit, target.position)
        
        return True
    
    def _ai_prioritize_targets(self, unit, enemies):
        # Score each enemy based on threat and accessibility
        scored_enemies = []
        
        for enemy in enemies:
            score = 0
            distance = unit.position.distance_to(enemy.position)
            
            # Prioritize by unit type threat level
            threat_scores = {
                UnitType.RIOTER_MOLOTOV: 100,  # High threat
                UnitType.RIOTER_LEADER: 80,
                UnitType.RIOTER_MEDIC: 70,
                UnitType.RIOTER_BRAWLER: 60,
                UnitType.RIOTER_HACKER: 50,
                UnitType.RIOTER_SHIELD: 40,
            }
            score += threat_scores.get(enemy.type, 50)
            
            # Prioritize wounded enemies (easier kills)
            if enemy.hp < enemy.max_hp * 0.5:
                score += 30
            
            # Prioritize closer enemies
            score += max(0, 50 - distance * 5)
            
            # Prioritize enemies not in cover
            target_tile = self.game_map.get_tile(enemy.position)
            if target_tile.provides_cover() == 0:
                score += 20
            
            scored_enemies.append((enemy, score))
        
        # Sort by score (highest first)
        scored_enemies.sort(key=lambda x: x[1], reverse=True)
        return [enemy for enemy, score in scored_enemies]
    
    def _ai_attack(self, unit, target):
        damage = unit.damage
        target_tile = self.game_map.get_tile(target.position)
        cover_reduction = target_tile.provides_cover()
        damage = int(damage * (1 - cover_reduction))
        damage = random.randint(int(damage * 0.8), int(damage * 1.2))
        
        # Create damage number animation
        self._add_damage_number(target.position, damage)
        
        # Add to combat log
        cover_text = f" (through {int(cover_reduction*100)}% cover)" if cover_reduction > 0 else ""
        log_message = f"{unit.get_name()} deals {damage} damage to {target.get_name()}{cover_text}"
        self._add_combat_log(log_message)
        
        target.take_damage(damage)
        unit.ap -= 1
        
        if not target.alive:
            self.game_map.remove_unit(target)
            self._add_combat_log(f"{target.get_name()} is eliminated!")
    
    def _ai_move_tactically(self, unit, target):
        best_pos = None
        best_score = -1000
        
        # Check all positions within movement range
        for dx in range(-unit.move_range, unit.move_range + 1):
            for dy in range(-unit.move_range, unit.move_range + 1):
                if abs(dx) + abs(dy) > unit.move_range:
                    continue
                
                new_pos = Position(unit.position.x + dx, unit.position.y + dy)
                
                if not (self.game_map.is_valid_position(new_pos) and 
                        self.game_map.can_move_to(new_pos)):
                    continue
                
                score = self._ai_evaluate_position(unit, new_pos, target)
                
                if score > best_score:
                    best_score = score
                    best_pos = new_pos
        
        if best_pos and best_pos != unit.position:
            self.game_map.move_unit(unit, best_pos)
            unit.ap -= 1
            return True
        
        return False
    
    def _ai_evaluate_position(self, unit, pos, target):
        score = 0
        
        # Distance to target (closer is better for most units, farther for snipers)
        distance = pos.distance_to(target.position)
        
        if unit.type == UnitType.POLICE_SNIPER:
            # Snipers prefer medium distance
            ideal_distance = unit.range // 2
            score -= abs(distance - ideal_distance) * 5
        else:
            # Other units prefer to be closer
            score -= distance * 3
        
        # Check if position provides cover
        tile = self.game_map.get_tile(pos)
        if tile.provides_cover() > 0:
            score += 20
        
        # Check if position allows attack on target
        temp_unit = Unit(unit.type, pos, unit.faction)
        if temp_unit.can_attack(target.position, self.game_map):
            score += 50
        
        # Avoid positions too close to multiple enemies
        enemy_proximity = 0
        for enemy in self.game_map.units:
            if enemy.faction == Faction.RIOTER and enemy.alive:
                enemy_distance = pos.distance_to(enemy.position)
                if enemy_distance <= 2:
                    enemy_proximity += 1
        
        score -= enemy_proximity * 15
        
        return score
    
    def _find_nearest_enemy(self, unit):
        enemy_faction = Faction.RIOTER if unit.faction == Faction.POLICE else Faction.POLICE
        enemies = [u for u in self.game_map.units if u.faction == enemy_faction and u.alive]
        
        if not enemies:
            return None
        
        nearest = min(enemies, key=lambda e: unit.position.distance_to(e.position))
        return nearest
    
    def _ai_move_towards(self, unit, target_pos):
        if unit.ap < 1:
            return
        
        best_pos = None
        best_distance = float('inf')
        
        # Check all adjacent positions
        for dx in [-1, 0, 1]:
            for dy in [-1, 0, 1]:
                if dx == 0 and dy == 0:
                    continue
                
                new_pos = Position(unit.position.x + dx, unit.position.y + dy)
                
                if (self.game_map.is_valid_position(new_pos) and 
                    self.game_map.can_move_to(new_pos)):
                    
                    distance = new_pos.distance_to(target_pos)
                    if distance < best_distance:
                        best_distance = distance
                        best_pos = new_pos
        
        if best_pos:
            self.game_map.move_unit(unit, best_pos)
            unit.ap -= 1
    
    def _check_win_conditions(self):
        rioters_alive = any(u.faction == Faction.RIOTER and u.alive for u in self.game_map.units)
        police_alive = any(u.faction == Faction.POLICE and u.alive for u in self.game_map.units)
        
        if not rioters_alive:
            self.game_state = "defeat"
        elif not police_alive:
            self.game_state = "victory"
    
    def render(self):
        self.screen.fill(BLACK)
        
        # Draw grid and tiles
        for y in range(MAP_HEIGHT):
            for x in range(MAP_WIDTH):
                rect = pygame.Rect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE)
                tile = self.game_map.tiles[y][x]
                
                # Draw tile background with improved graphics
                if tile.type == TileType.WALL:
                    pygame.draw.rect(self.screen, DARK_GRAY, rect)
                    # Add brick pattern
                    if (x + y) % 2 == 0:
                        pygame.draw.rect(self.screen, BLACK, rect, 1)
                elif tile.type == TileType.FULL_COVER:
                    pygame.draw.rect(self.screen, BROWN, rect)
                    # Add texture lines
                    pygame.draw.line(self.screen, BLACK, (rect.left, rect.top), (rect.right, rect.bottom), 1)
                    pygame.draw.line(self.screen, BLACK, (rect.right, rect.top), (rect.left, rect.bottom), 1)
                elif tile.type == TileType.HALF_COVER:
                    pygame.draw.rect(self.screen, LIGHT_GRAY, rect)
                    # Add diagonal pattern
                    pygame.draw.line(self.screen, GRAY, (rect.left, rect.top), (rect.right, rect.bottom), 1)
                elif tile.type == TileType.FIRE:
                    # Animated fire effect
                    colors = [ORANGE, RED, YELLOW]
                    color = colors[(x + y + pygame.time.get_ticks() // 200) % 3]
                    pygame.draw.rect(self.screen, color, rect)
                    # Add flame shapes
                    for i in range(3):
                        flame_x = rect.centerx + random.randint(-8, 8)
                        flame_y = rect.centery + random.randint(-8, 8)
                        pygame.draw.circle(self.screen, YELLOW, (flame_x, flame_y), 3)
                elif tile.type == TileType.SMOKE:
                    # Animated smoke effect
                    alpha = 100 + 50 * math.sin((pygame.time.get_ticks() + x * 100 + y * 100) / 500)
                    smoke_surface = pygame.Surface((GRID_SIZE, GRID_SIZE))
                    smoke_surface.set_alpha(int(alpha))
                    smoke_surface.fill(GRAY)
                    self.screen.blit(smoke_surface, rect)
                else:
                    # Pavement texture
                    pygame.draw.rect(self.screen, WHITE, rect)
                    if (x + y) % 4 == 0:
                        pygame.draw.rect(self.screen, LIGHT_GRAY, rect, 1)
                
                # Draw grid lines
                pygame.draw.rect(self.screen, BLACK, rect, 1)
                
                # Draw unit
                if tile.unit:
                    unit_color = tile.unit.get_color()
                    center = (x * GRID_SIZE + GRID_SIZE // 2, y * GRID_SIZE + GRID_SIZE // 2)
                    radius = GRID_SIZE // 3
                    
                    # Draw unit with better graphics
                    pygame.draw.circle(self.screen, unit_color, center, radius)
                    pygame.draw.circle(self.screen, BLACK, center, radius, 2)
                    
                    # Draw unit type indicator
                    if tile.unit.type == UnitType.RIOTER_MOLOTOV:
                        pygame.draw.circle(self.screen, ORANGE, center, radius // 2)
                    elif tile.unit.type == UnitType.RIOTER_MEDIC:
                        pygame.draw.circle(self.screen, WHITE, center, radius // 2)
                    elif tile.unit.type == UnitType.RIOTER_SHIELD:
                        pygame.draw.rect(self.screen, SILVER, (center[0] - radius//2, center[1] - radius//2, radius, radius))
                    elif tile.unit.type == UnitType.POLICE_SNIPER:
                        pygame.draw.circle(self.screen, GOLD, center, radius // 2)
                    elif tile.unit.type == UnitType.POLICE_SHIELD:
                        pygame.draw.rect(self.screen, SILVER, (center[0] - radius//2, center[1] - radius//2, radius, radius))
                    
                    # Draw HP bar
                    if tile.unit.hp < tile.unit.max_hp:
                        bar_width = GRID_SIZE - 4
                        bar_height = 4
                        bar_x = x * GRID_SIZE + 2
                        bar_y = y * GRID_SIZE + 2
                        
                        # Background
                        pygame.draw.rect(self.screen, DARK_RED, (bar_x, bar_y, bar_width, bar_height))
                        # Health
                        health_width = int(bar_width * (tile.unit.hp / tile.unit.max_hp))
                        pygame.draw.rect(self.screen, GREEN, (bar_x, bar_y, health_width, bar_height))
                    
                    # Draw AP indicators
                    if tile.unit.faction == self.current_faction:
                        for i in range(tile.unit.ap):
                            ap_x = x * GRID_SIZE + 2 + i * 4
                            ap_y = y * GRID_SIZE + GRID_SIZE - 8
                            pygame.draw.circle(self.screen, YELLOW, (ap_x, ap_y), 2)
        
        # Highlight selected unit and show movement/attack range
        if self.selected_unit:
            # Highlight selected unit
            rect = pygame.Rect(
                self.selected_unit.position.x * GRID_SIZE,
                self.selected_unit.position.y * GRID_SIZE,
                GRID_SIZE, GRID_SIZE
            )
            pygame.draw.rect(self.screen, YELLOW, rect, 3)
            
            # Show movement range
            if self.selected_unit.ap > 0:
                for y in range(MAP_HEIGHT):
                    for x in range(MAP_WIDTH):
                        pos = Position(x, y)
                        distance = self.selected_unit.position.distance_to(pos)
                        
                        if distance <= self.selected_unit.move_range and self.game_map.can_move_to(pos):
                            move_rect = pygame.Rect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE)
                            pygame.draw.rect(self.screen, GREEN, move_rect, 1)
                        
                        # Show attack range for enemies
                        tile = self.game_map.get_tile(pos)
                        if (tile and tile.unit and tile.unit.faction != self.current_faction and
                            self.selected_unit.can_attack(pos, self.game_map)):
                            attack_rect = pygame.Rect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE, GRID_SIZE)
                            pygame.draw.rect(self.screen, RED, attack_rect, 2)
        
        # Draw UI
        self._draw_ui()
        
        # Draw game over screen
        if self.game_state != "playing":
            self._draw_game_over()
        
        # Update animations
        self._update_animations()
        
        # Draw damage numbers
        self._draw_damage_numbers()
        
        # Draw combat log
        self._draw_combat_log()
        
        pygame.display.flip()
    
    def _draw_ui(self):
        # Current turn info
        turn_text = f"Turn {self.turn_number} - {self.current_faction.name}"
        text_surface = self.font.render(turn_text, True, WHITE)
        self.screen.blit(text_surface, (MAP_WIDTH * GRID_SIZE + 10, 10))
        
        # Selected unit info
        if self.selected_unit:
            unit_info = [
                f"Unit: {self.selected_unit.get_name()}",
                f"HP: {self.selected_unit.hp}/{self.selected_unit.max_hp}",
                f"AP: {self.selected_unit.ap}/{self.selected_unit.max_ap}",
                f"Damage: {self.selected_unit.damage}",
                f"Range: {self.selected_unit.range}",
                f"Move: {self.selected_unit.move_range}",
            ]
            
            # Add ability info
            ability_info = self._get_ability_info(self.selected_unit.type)
            if ability_info:
                unit_info.append(f"Ability: {ability_info}")
            
            for i, info in enumerate(unit_info):
                text_surface = self.small_font.render(info, True, WHITE)
                self.screen.blit(text_surface, (MAP_WIDTH * GRID_SIZE + 10, 50 + i * 20))
        
        # Controls
        controls = [
            "Controls:",
            "Click: Select/Move",
            "E: Attack",
            "Q: Ability",
            "H: Help",
            "Space: End Turn"
        ]
        
        for i, control in enumerate(controls):
            text_surface = self.small_font.render(control, True, WHITE)
            self.screen.blit(text_surface, (MAP_WIDTH * GRID_SIZE + 10, 170 + i * 18))
    
    def _get_ability_info(self, unit_type):
        abilities = {
            UnitType.RIOTER_MOLOTOV: "Fire Area (Q)",
            UnitType.RIOTER_LEADER: "Inspire (Q)",
            UnitType.RIOTER_MEDIC: "Heal (Q)",
            UnitType.RIOTER_HACKER: "Smoke (Q)",
            UnitType.RIOTER_SHIELD: "Deploy Cover (Q)",
        }
        return abilities.get(unit_type, None)
    
    def _add_damage_number(self, position, damage):
        self.damage_numbers.append({
            'position': position,
            'damage': damage,
            'timer': 60,  # frames to display
            'y_offset': 0
        })
    
    def _add_combat_log(self, message):
        self.combat_log.append(message)
        if len(self.combat_log) > 8:  # Keep only last 8 messages
            self.combat_log.pop(0)
        print(message)  # Also print to console
    
    def _update_animations(self):
        # Update damage numbers
        for damage_num in self.damage_numbers[:]:
            damage_num['timer'] -= 1
            damage_num['y_offset'] -= 1  # Float upward
            if damage_num['timer'] <= 0:
                self.damage_numbers.remove(damage_num)
    
    def _draw_damage_numbers(self):
        for damage_num in self.damage_numbers:
            pos = damage_num['position']
            x = pos.x * GRID_SIZE + GRID_SIZE // 2
            y = pos.y * GRID_SIZE + GRID_SIZE // 2 + damage_num['y_offset']
            
            # Create semi-transparent damage text
            alpha = int(255 * (damage_num['timer'] / 60))
            damage_text = str(damage_num['damage'])
            text_surface = self.font.render(damage_text, True, RED)
            text_surface.set_alpha(alpha)
            
            text_rect = text_surface.get_rect(center=(x, y))
            self.screen.blit(text_surface, text_rect)
    
    def _draw_combat_log(self):
        log_x = MAP_WIDTH * GRID_SIZE + 10
        log_y = 300
        
        # Title
        title_surface = self.font.render("Combat Log:", True, WHITE)
        self.screen.blit(title_surface, (log_x, log_y))
        
        # Log messages
        for i, message in enumerate(self.combat_log):
            text_surface = self.small_font.render(message, True, WHITE)
            self.screen.blit(text_surface, (log_x, log_y + 25 + i * 18))
    
    def _draw_game_over(self):
        overlay = pygame.Surface((WINDOW_WIDTH, WINDOW_HEIGHT))
        overlay.set_alpha(128)
        overlay.fill(BLACK)
        self.screen.blit(overlay, (0, 0))
        
        if self.game_state == "victory":
            text = "VICTORY! Rioters Win!"
            color = GREEN
        else:
            text = "DEFEAT! Police Win!"
            color = RED
        
        text_surface = self.font.render(text, True, color)
        text_rect = text_surface.get_rect(center=(WINDOW_WIDTH // 2, WINDOW_HEIGHT // 2))
        self.screen.blit(text_surface, text_rect)
        
        restart_text = self.small_font.render("Press ESC to quit", True, WHITE)
        restart_rect = restart_text.get_rect(center=(WINDOW_WIDTH // 2, WINDOW_HEIGHT // 2 + 40))
        self.screen.blit(restart_text, restart_rect)
    
    def run(self):
        running = True
        while running:
            running = self.handle_events()
            self.render()
            self.clock.tick(FPS)
        
        pygame.quit()
        sys.exit()

def main():
    """
    Main function to run the Paris Tactical RPG game.
    
    Requirements:
    - Python 3.6+
    - pygame library (install with: pip install pygame)
    
    How to play:
    - Left click to select rioter units and move them
    - Press E to attack nearest enemy in range
    - Press Q to use unit's special ability
    - Press H for unit help information
    - Use cover strategically to reduce damage
    - Press Space to end your turn
    - Eliminate all enemies to win
    
    Game Features:
    - Turn-based tactical combat with 2 action points per unit
    - Cover system with full and half cover
    - Line of sight mechanics
    - Different unit types with unique stats
    - AI-controlled police units
    - Parisian street environment with thematic elements
    """
    print("Starting Paris Tactical RPG...")
    print("Controls: Left click: Select/Move | E: Attack | Q: Use Ability | H: Help | Space: End Turn | ESC: Quit")
    
    game = Game()
    game.run()

if __name__ == "__main__":
    main()