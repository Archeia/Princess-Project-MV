#==============================================================================
# 
# GaryCXJk - Free Movement v0.87
# * Last Updated: 2013.10.28
# * Level: Medium
# * Requires: N/A
# * Optional: CXJ - AnimEx v1.01+
#             CollisionMaps.dll
# 
# Aditional credits:
# * Tsukihime (When using the Collision Maps features)
#
#==============================================================================

$imported = {} if $imported.nil?
$imported["CXJ-FreeMovement"] = true

#==============================================================================
#
# Changelog:
#
#------------------------------------------------------------------------------
# 2013.10.28 - v0.87
#
# * Added: Tsukihime's Collision Maps implementation
#
#------------------------------------------------------------------------------
# 2013.08.02 - v0.86
#
# * Added: Follow types
# * Fixed: Jumping not going in the right direction
#
#------------------------------------------------------------------------------
# 2013.07.06 - v0.85
#
# * Fixed: Touch events get triggered when moving after transfers
#
#------------------------------------------------------------------------------
# 2013.06.09 - v0.84
#
# * Added: Capabilities to disable Free Movement per map
#
#------------------------------------------------------------------------------
# 2013.01.12 - v0.83
#
# * Added: Option to only let the closest event get triggered
# * Added: Event comment tags for event collision boxes
#
#------------------------------------------------------------------------------
# 2013.01.12 - v0.82
#
# * Added: Map notetags for event collision boxes
# * Fixed: In case the initializor of Game_CharacterBase gets overridden, the
#          script would fail on a certain check
#
#------------------------------------------------------------------------------
# 2013.01.11 - v0.81
#
# * Fixed: Vehicles could be boarded even if not on the map
#
#------------------------------------------------------------------------------
# 2013.01.11 - v0.80
#
# * Initial release
#
#==============================================================================
#
# RPG Maker VX Ace is mainly constrained to the grid. Luckily there are quite
# some scripts that add off-the-grid movement, mainly called "pixel movement".
# As that's kind of a BS term for something like that (it implies you can only
# travel per pixel, and most of the time it skips a few pixels anyway), I just
# give it a more general term.
#
# Free Movement gives you freedom of movement in eight directions. I'd love to
# implement free movement in three dimensions, but the engine isn't built on
# 3D. Yet.
#
#==============================================================================
#
# Installation:
#
# Make sure to put this below Materials, but above Main Process.
#
# This script overrides several methods. If you are sure no method that is
# used by other scripts get overridden, you can place it anywhere, otherwise,
# make sure this script is loaded first. Do know that there is a possibility
# that this script will stop working due to that.
#
# This script adds aliases for several methods. If you are sure no method that
# is used by other scripts get overridden, you can place it anywhere,
# otherwise, make sure this script is loaded after any other script overriding
# these methods, otherwise this script stops working.
#
# This script has additional functionality and / or compatibility with other
# scripts. In order to benefit the most out of it, it is advised to place this
# script after the others.
#
#------------------------------------------------------------------------------
# Overridden functions:
#
# * class Game_Player
#   - move_by_input
#
#------------------------------------------------------------------------------
# Aliased methods:
#
# * class Game_Map
#   - setup(map_id)
#   - check_passage(x, y, bit)
#   - refresh setup_events
#   - round_x_with_direction(x, d)
#   - round_y_with_direction(y, d)
# * class Game_CharacterBase
#   - initialize
#   - update
#   - check_event_trigger_touch_front
#   - passable?(x, y, d)
#   - diagonal_passable?(x, y, horz, vert)
#   - set_direction(d)
#   - move_straight(d, turn_ok = true)
#   - move_diagonal(horz, vert)
#   - collide_with_events?(x, y)
#   - collide_with_vehicles?(x, y)
#   - update_jump
#   - jump_height
# * class Game_Character
#   - process_move_command(command)
#   - move_random
#   - move_toward_character(character)
#   - move_away_from_character(character)
#   - move_forward
#   - move_backward
#   - jump(x_plus, y_plus)
# * class Game_Player
#   - initialize
#   - refresh
#   - perform_transfer
#   - make_encounter_count
#   - update_nonmoving(last_moving)
#   - start_map_event(x, y, triggers, normal, rect = collision_rect)
#   - check_event_trigger_there(triggers)
#   - get_on_vehicle
#   - get_off_vehicle
#   - map_passable_rect?(x, y, d, rect)
#   - move_diagonal(horz, vert)
#   - collide_with_vehicles?(x, y)
# * class Game_Event
#   - init_public_members
#   - update
#   - refresh
#   - collide_with_player_characters?(x, y)
#   - check_event_trigger_touch(x, y)
# * class Game_Followers
#   - move
# * class Game_Follower
#   - initialize(member_index, preceding_character)
#   - refresh
#   - chase_preceding_character
# * class Game_Vehicle
#   - land_ok?(x, y, d)
# * class Spriteset_Map (When debug is enabled)
#   - create_characters
#   - update_characters
#
#==============================================================================
#
# Usage:
#
# In essence, this script is plug-and-play, however, one can make minor to
# big tweaks to this script without having to touch the actual script. Most of
# the settings in the script are self-explanatory, however, there are two
# things that need explaining.
#
# This script uses collision boxes to determine collisions. As not every sprite
# is of the same size, and even events have different shapes, I wanted to add
# a way to allow for these differences in size. At the moment there are only
# collision boxes for characters and events.
#
# There are two kinds of collision boxes, the regular collision boxes and the
# interaction boxes, the latter being reserved for active player characters.
#
# Collision boxes are for the regular collisions, like passability on terrain,
# or just regular touch events. There are four ways you can define a collsion
# box.
#
# The first is using this script, and by either altering the default settings
# or creating a new collision list. This same collision list is used for the
# vehicles. To actually be able to use this list, you'll need to call it by
# using the following notetag on the actor:
#
# <collisionbox: string>
#
# You can also directly set the collision box on the actor:
#
# <collisionbox: x, y, width, height>
#
# Finally, since events don't use notetags, you can set the collisions using
# either a script, notetags placed on the map itself or comment tags on the
# event itself. For the script method I've added a method to the interpreter,
# so you can just run it directly from the event without having to find the
# event itself. There are  two ways you can use the method.
#
# set_collision_rect(string)
# set_collision_rect(x, y, width, height)
#
# The first way calls the collision box from the collision list. The second
# directly sets the collision. Do note that collision boxes set this way aren't
# persistent, so when the map is reloaded, the script must be run again.
#
# You can also use notetags on the map to define the collision box of the
# event. You'll also need to supply the event name so that it can identify
# which event should get the new collision box.
#
# <collisionbox eventname: string>
# <collisionbox eventname: x, y, width, height>
#
# To make it even more easy to implement collision boxes, you can use the
# following comment tags on the comment blocks in the event itself:
#
# <collisionbox: string>
# <collisionbox: x, y, width, height>
#
# You can use this in two ways. When placed on the first page, it acts as the
# default collision box. This can still be overridden by the map notetag or
# a script, but it's used as the default. However, when placed on a different
# page, it will use that comment page whenever that page is available. That
# means that you can actually use switches or variables to dynamically set
# the collision box without having to use scripts.
#
# There are two ways to set an interaction box. One is by using the interaction
# list, just like how you set a collision list. Do note that each interaction
# entry contains eight values, each representing a direction. Note that the
# collisions are relative to the origin position plus 32 in the direction the
# interaction box is set, so you don't have to correct for that. To use a
# certain list, you can use the following notetag on the actor:
#
# <interactionbox: string>
#
# You can also directly set the collision box on the actor:
#
# <interactionbox d: x, y, width, height>
#
# Note that d is a number, representing a direction.
#
# As it is sometimes hard to see if the collisions work as expected, you can
# enable debugging, which actually shows the collision boxes. Green boxes
# represent collision boxes, while the red box represents the interaction box.
#
# Finally, there might be reasons to disable this script on certain maps. You
# can do so by changing the settings for auto-enable to false, or by using the
# following notetag in the map:
#
# <free-movement-enabled true|false>
#
# This setting has precedence over the global settings.
#------------------------------------------------------------------------------
# Collision Maps
#
# A great script that handles collision maps is Tsukihime's  Collision Maps
# script. Unfortunately, it doesn't work with this script, which is why I
# basically had to work from scratch to make an implementation that would also
# work with my project. I did add compatibility for the aforementioned script
# though, so if you still want to use that script on maps that don't use the
# free movement, then you can still do so. Do make sure you place Tsukihime's
# script before this one.
#
# Needless to say, you do need the DLL in order for it to work. You don't need
# to place it in any particular directory, though, as long as it isn't a
# modified DLL it will find it. However, if the DLL isn't found, any
# functionality surrounding Collision Maps will just be disabled.
#
# http://himeworks.wordpress.com/2013/09/06/collision-maps/
#
# In order to use collision maps, you can choose to use the following note tag
# in your maps:
#
# <collision map>
# <collision map: collision_file>
#
# When the former is used, it will use the map ID as the collision file, which
# defaults to Graphics/CollisionMaps/mapXXX, where XXX is a three digit number
# representing the map ID. Otherwise, it uses the name that's been given to
# the file.
#
# You can also set the precision when loading the collision file, which
# normally is set to 1. The lower the value, the more precise it is. Note
# that this is mostly for optimization reasons, meaning if your collision map
# doesn't require pixel precision, you can increase it up to 32 pixels (which
# is the default for the original script).
#
# <collision map precision: precision>
#
# One final note, however. Using this can cause lag, especially with diagonal
# movement. I've tried to reduce this lag as much as possible, but as this
# requires quite some calculations, there might still be lag.
#
#==============================================================================
#
# License:
#
# Creative Commons Attribution 3.0 Unported
#
# The complete license can be read here:
# http://creativecommons.org/licenses/by/3.0/legalcode
#
# The license as it is described below can be read here:
# http://creativecommons.org/licenses/by/3.0/deed
#
# You are free:
#
# to Share — to copy, distribute and transmit the work
# to Remix — to adapt the work
# to make commercial use of the work
#
# Under the following conditions:
#
# Attribution — You must attribute the work in the manner specified by the
# author or licensor (but not in any way that suggests that they endorse you or
# your use of the work).
#
# With the understanding that:
#
# Waiver — Any of the above conditions can be waived if you get permission from
# the copyright holder.
#
# Public Domain — Where the work or any of its elements is in the public domain
# under applicable law, that status is in no way affected by the license.
#
# Other Rights — In no way are any of the following rights affected by the
# license:
#
# * Your fair dealing or fair use rights, or other applicable copyright
#   exceptions and limitations;
# * The author's moral rights;
# * Rights other persons may have either in the work itself or in how the work
#   is used, such as publicity or privacy rights.
#
# Notice — For any reuse or distribution, you must make clear to others the
# license terms of this work. The best way to do this is with a link to this
# web page.
#
#------------------------------------------------------------------------------
# Extra notes:
#
# Despite what the license tells you, I will not hunt down anybody who doesn't
# follow the license in regards to giving credits. However, as it is common
# courtesy to actually do give credits, it is recommended that you do.
#
# As I picked this license, you are free to share this script through any
# means, which includes hosting it on your own website, selling it on eBay and
# hang it in the bathroom as toilet paper. Well, not selling it on eBay, that's
# a dick move, but you are still free to redistribute the work.
#
# Yes, this license means that you can use it for both non-commercial as well
# as commercial software.
#
# You are free to pick the following names when you give credit:
#
# * GaryCXJk
# * Gary A.M. Kertopermono
# * G.A.M. Kertopermono
# * GARYCXJK
#
# Personally, when used in commercial games, I prefer you would use the second
# option. Not only will it actually give me more name recognition in real
# life, which also works well for my portfolio, it will also look more
# professional. Also, do note that I actually care about capitalization if you
# decide to use my username, meaning, capital C, capital X, capital J, lower
# case k. Yes, it might seem stupid, but it's one thing I absolutely care
# about.
#
# Finally, if you want my endorsement for your product, if it's good enough
# and I have the game in my posession, I might endorse it. Do note that if you
# give me the game for free, it will not affect my opinion of the game. It
# would be nice, but if I really did care for the game I'd actually purchase
# it. Remember, the best way to get any satisfaction is if you get people to
# purchase the game, so in a way, I prefer it if you don't actually give me
# a free copy.
#
# This script was originally hosted on:
# http://area91.multiverseworks.com
#
# Don't forget to also credit:
# * Tsukihime (When using the Collision Maps features)
#
#==============================================================================
#
# The code below defines the settings of this script, and are there to be
# modified.
#
#==============================================================================

module CXJ
  module FREE_MOVEMENT
    
    # Auto-enable Free Movement
    AUTO_ENABLE = true
    
    # Enables diagonal movement.
    ENABLE_DIAGONAL = true
    
    #------------------------------------------------------------------------
    # The collision box for actors and vehicles.
    # The key defines the name of the list. The values themselves represent
    # the x and y of the starting position, and the width and height of the
    # box.
    #------------------------------------------------------------------------
    COLLISION = {}
    COLLISION["DEFAULT"] = [8, 12, 16, 20]
    COLLISION["BOAT"] = [4, 4, 24, 24]
    COLLISION["SHIP"] = [2, 2, 28, 28]
    COLLISION["AIRSHIP"] = [4, 4, 24, 24]
    
    #------------------------------------------------------------------------
    # The interaction boxes for player characters.
    # The key defines the name of the list. Each list contains eight values,
    # each being separate key-value pairs, where the key is a direction and
    # the values the x and y of the starting position, and the width and
    # height of the box.
    #------------------------------------------------------------------------
    INTERACTION = {}
    INTERACTION["DEFAULT"] = {
    1 => [24, -8, 24, 24],
    2 => [4, 0, 24, 24],
    3 => [-16, -8, 24, 24],
    4 => [16, 10, 24, 24],
    6 => [-8, 10, 24, 24],
    7 => [24, 28, 24, 24],
    8 => [4, 20, 24, 24],
    9 => [-16, 28, 24, 24],
    }
    
    #------------------------------------------------------------------------
    # Collision Map support.
    # This part defines the settings for Collision Map. You can find the
    # original script here:
    #
    # http://himeworks.wordpress.com/2013/09/06/collision-maps/
    #
    # I've made this script from scratch mostly for compatibility reasons.
    # Do note that using this isn't really recommended due to it eating more
    # resources. I did try to make it a little less heavy, but since it will
    # use a per-pixel check, you'll have to be careful with it. Also, this
    # might cause memory issues when using big bitmaps.
    #
    # Make sure to also download the DLL from that site.
    #------------------------------------------------------------------------
    
    # Base collision map path
    COLLISION_MAP_BASE_PATH = "Graphics/CollisionMaps/%s"
    
    # Collision map path when using the map id as identifier
    COLLISION_MAP_ID_PATH = "Graphics/CollisionMaps/map%03d"
    
    # Default precision (higher = faster, lower = more precise)
    COLLISION_MAP_DEFAULT_PRECISION = 32

    #------------------------------------------------------------------------
    # Miscellaneous settings.
    #------------------------------------------------------------------------
    
    # The amount of pixels per step the character can move.
    PIXELS_PER_STEP = 2
    
    # The distance between followers.
    FOLLOWERS_DISTANCE = 32
    
    # The margin between which followers try to correct their distance.
    FOLLOWERS_DISTANCE_MARGIN = 2

    # The speed of the jump animation, in relationship to the original jump
    # speed.
    JUMP_SPEED = 0.5
    
    # Jump height. Set to 0 to let the jump height be dependent on the jump
    # length. In pixels.
    MAX_JUMP_HEIGHT = 32

    # Determines if only the closest event is triggered.
    ONLY_TRIGGER_CLOSEST = true

    # Allows you to enable or disable follower collision.
    FOLLOWER_THROUGH = false
    
    # The way followers follow. Set to nil or a non-existent type to make
    # followers use the shortest distance.
    # :trace    - Followers always retrace your steps
    FOLLOW_TYPE = :trace
    
    # Debug variables.
    SHOW_COLLISION_BOXES = false
  end
end
#==============================================================================
#
# The code below should not be altered unless you know what you're doing.
#
#==============================================================================


module CXJ
  module FREE_MOVEMENT
    module COLLISION_MAPS
      # A list of checksums that are valid for the Collision Maps DLL.
      VALID_CHECKSUMS = [
      0xf48f232a
      ]

      MAKE_COLLISION_TABLE = Proc.new {}

      @@collision_maps_dll = nil
      
      def self.collision_maps_dll
        return @@collision_maps_dll unless @@collision_maps_dll.nil?
        return nil if @@collision_maps_dll == ""
        file_list = Dir.glob("**/CollisionMaps.dll")
        if file_list.empty?
          @@collision_maps_dll = ""
          return nil
        end
        file_list.each do |file|
          crc32 = File.open(file) { |f| Zlib.crc32 f.read }
          if VALID_CHECKSUMS.include?(crc32)
            @@collision_maps_dll = file
            return file
          end
        end
        @@collision_maps_dll = ""
        return nil
      end
      
      unless collision_maps_dll.nil?
        MAKE_COLLISION_TABLE = Win32API.new(collision_maps_dll, "makeCollisionTable", ["L", "L", "L", "L"], "")
      end
      
      #----------------------------------------------------------------------
      # * New: Checks if the CollisionMaps.dll is present
      #----------------------------------------------------------------------
      def self.is_enabled?
        return !collision_maps_dll.nil?
      end
      
      #----------------------------------------------------------------------
      # * New: Makes a collision table
      #----------------------------------------------------------------------
      def self.make_collision_table(bmp, precision = CXJ::FREE_MOVEMENT::COLLISION_MAP_DEFAULT_PRECISION)
        table = Table.new(bmp.width, bmp.height, 1)
        MAKE_COLLISION_TABLE.call(bmp.__id__, table.__id__, precision, precision)
        return table
      end
    end
  end
end

#==============================================================================
# ** Cache
#------------------------------------------------------------------------------
#  This module loads graphics, creates bitmap objects, and retains them.
# To speed up load times and conserve memory, this module holds the
# created bitmap object in the internal hash, allowing the program to
# return preexisting objects when the same bitmap is requested again.
#==============================================================================

module Cache
  def self.load_collision_map(map_id, mapname, precision = CXJ::FREE_MOVEMENT::COLLISION_MAP_DEFAULT_PRECISION)
    @fm_collision_map_cache||= {}
    return @fm_collision_map_cache[map_id] if @fm_collision_map_cache[map_id]
    bmp = Bitmap.new(mapname)
    @fm_collision_map_cache[map_id] = CXJ::FREE_MOVEMENT::COLLISION_MAPS.make_collision_table(bmp, precision)
    bmp.dispose
    return @fm_collision_map_cache[map_id]
  end
end

#==============================================================================
# ** Game_Map
#------------------------------------------------------------------------------
#  This class handles maps. It includes scrolling and passage determination
# functions. The instance of this class is referenced by $game_map.
#==============================================================================

class Game_Map
  #--------------------------------------------------------------------------
  # * Override: Setup
  #--------------------------------------------------------------------------
  alias game_map_setup_fm setup
  def setup(map_id)
    game_map_setup_fm(map_id)
    fm_enabled = 0
    @collision_map_name = ""
    @collision_map_precision = CXJ::FREE_MOVEMENT::COLLISION_MAP_DEFAULT_PRECISION
    @map.note.split(/[\r\n]+/).each { |line|
      if line =~ /\s*<free[ -]movement[ -]enabled (true|false)>\s*/i
        fm_enabled = ($1 == "true" ? 1 : -1);
      else
        if CXJ::FREE_MOVEMENT::COLLISION_MAPS.is_enabled?
          if line =~ /\s*<collision[-_ ]map>\s*/i
            @collision_map_name = sprintf(CXJ::FREE_MOVEMENT::COLLISION_MAP_ID_PATH, map_id)
          elsif line =~ /\s*<collision[-_ ]map:\s+(.+?)>\s*/i
            @collision_map_name = sprintf(CXJ::FREE_MOVEMENT::COLLISION_MAP_BASE_PATH, $1)
          elsif line =~ /\s*<collision[-_ ]map[-_ ]precision:\s+(\d+)>\s*/i
            @collision_map_precision = $1.to_i
          end
        end
      end
    }
    if(fm_enabled == 0)
      @free_movement_enabled = CXJ::FREE_MOVEMENT::AUTO_ENABLE
    else
      @free_movement_enabled = (fm_enabled > 0 ? true : false)
    end
  end
  
  #--------------------------------------------------------------------------
  # * New: Check if it's the Free Movement map class
  #--------------------------------------------------------------------------
  def free_movement_enabled?
    return @free_movement_enabled
  end
  
  #--------------------------------------------------------------------------
  # * New: Get the bitmap name of the collision map
  #--------------------------------------------------------------------------
  def collision_map_name
    return @collision_map_name
  end
  
  #--------------------------------------------------------------------------
  # * New: Get the precision of the collision map
  #--------------------------------------------------------------------------
  def collision_map_precision
    return @collision_map_precision
  end
  
  #--------------------------------------------------------------------------
  # * New: Checks if the collision map
  #--------------------------------------------------------------------------
  def collision_map_enabled?
    return !collision_map_name.empty?
  end
  
  #--------------------------------------------------------------------------
  # * New: Get the collision map
  #--------------------------------------------------------------------------
  def collision_map
    return nil if collision_map_name.empty?
    begin
      table = Cache.load_collision_map(@map_id, collision_map_name, collision_map_precision)
    rescue
      p [$!, @collision_map_name]
      @collision_map_name = ""
      return nil
    end
    return table
  end
  
  def collision_map_passable?(x, y)
    colmap = collision_map
    return true if colmap.nil?
    return collision_map[x, y, 0] == 0
  end
  
  #--------------------------------------------------------------------------
  # * New: Determine Valid Coordinates
  #--------------------------------------------------------------------------
  def valid_rect?(x, y, rect)
    x2 = x + (rect.x / 32.0)
    y2 = y + (rect.y / 32.0)
    x3 = x2 + ((rect.width - 1) / 32.0)
    y3 = y2 + ((rect.height - 1) / 32.0)
    round_x(x2) >= 0 && round_x(x3) < width && round_y(y2) >= 0 && round_y(y3) < height
  end
  #--------------------------------------------------------------------------
  # * Alias: Check Passage
  #     bit:  Inhibit passage check bit
  #--------------------------------------------------------------------------
  alias game_map_check_passage_cxj_fm check_passage
  def check_passage(x, y, bit)
    if(free_movement_enabled?)
      x = round_x(x)
      y = round_y(y)
      all_tiles(x.floor, y.floor).each do |tile_id|
        flag = tileset.flags[tile_id]
        next if flag & 0x10 != 0            # [☆]: No effect on passage
        return true  if flag & bit == 0     # [○] : Passable
        return false if flag & bit == bit   # [×] : Impassable
      end
      return false                          # Impassable
    else
      if collision_map_enabled? && !$imported["TH_CollisionMapOverlay"]
        x = x * 32
        y = y * 32
        return collision_map_passable?(x, y)
      end
      return game_map_check_passage_cxj_fm(x, y, bit)
    end
  end
  #--------------------------------------------------------------------------
  # * New: Check Passage Using Collision Maps
  #--------------------------------------------------------------------------
  def check_passage_collision_maps(x, y, x2, y2)
    (y2 - y).times do |h|
      (x2 - x).times do |w|
        return false unless collision_map_passable?(x + w, y + h)
      end
    end
    return true
  end
  
  #--------------------------------------------------------------------------
  # * New: Determine Passability of Normal Character
  #     d:  direction (2,4,6,8)
  #    Determines whether the tile at the specified coordinates is passable
  #    in the specified direction.
  #--------------------------------------------------------------------------
  def passable_rect?(x, y, d, rect)
    x2 = x + (rect.x / 32.0)
    y2 = y + (rect.y / 32.0)
    x3 = x2 + ((rect.width - 1) / 32.0)
    y3 = y2 + ((rect.height - 1) / 32.0)
    x4 = (x2 + x3) / 2.0
    y4 = (y2 + y3) / 2.0
    if((x2.floor != x3.floor && [1, 3, 4, 6, 7, 9].include?(d)) || (y2.floor != y3.floor && [1, 2, 3, 7, 8, 9].include?(d)))
      return false if ([1, 2, 3].include?(d) && !check_passage(x2, y2, 1)) || ([3, 6, 9].include?(d) && !check_passage(x2, y2, 4))
      return false if ([3, 6, 9].include?(d) && !check_passage(x2, y3, 4)) || ([7, 8, 9].include?(d) && !check_passage(x2, y3, 8))
      return false if ([1, 2, 3].include?(d) && !check_passage(x3, y2, 1)) || ([1, 4, 7].include?(d) && !check_passage(x3, y2, 2))
      return false if ([1, 4, 7].include?(d) && !check_passage(x3, y3, 2)) || ([7, 8, 9].include?(d) && !check_passage(x3, y3, 8))
    end
    return true
  end
  #--------------------------------------------------------------------------
  # * New: Determine if Passable by Boat
  #--------------------------------------------------------------------------
  def boat_passable_rect?(x, y, rect)
    x2 = x + (rect.x / 32.0)
    y2 = y + (rect.y / 32.0)
    x3 = x2 + ((rect.width - 1) / 32.0)
    y3 = y2 + ((rect.height - 1) / 32.0)
    return false unless check_passage(x2, y2, 0x0200)
    return false unless check_passage(x2, y3, 0x0200)
    return false unless check_passage(x3, y2, 0x0200)
    return check_passage(x3, y3, 0x0200)
  end
  #--------------------------------------------------------------------------
  # * New: Determine if Passable by Ship
  #--------------------------------------------------------------------------
  def ship_passable_rect?(x, y, rect)
    x2 = x + (rect.x / 32.0)
    y2 = y + (rect.y / 32.0)
    x3 = x2 + ((rect.width - 1) / 32.0)
    y3 = y2 + ((rect.height - 1) / 32.0)
    return false unless check_passage(x2, y2, 0x0400)
    return false unless check_passage(x2, y3, 0x0400)
    return false unless check_passage(x3, y2, 0x0400)
    return check_passage(x3, y3, 0x0400)
  end
  #--------------------------------------------------------------------------
  # * New: Determine if Airship can Land
  #--------------------------------------------------------------------------
  def airship_land_ok_rect?(x, y, rect)
    x2 = x + (rect.x / 32.0)
    y2 = y + (rect.y / 32.0)
    x3 = x2 + ((rect.width - 1) / 32.0)
    y3 = y2 + ((rect.height - 1) / 32.0)
    return false unless check_passage(x2, y2, 0x0800) && check_passage(x2, y2, 0x0f)
    return false unless check_passage(x2, y3, 0x0800) && check_passage(x2, y3, 0x0f)
    return false unless check_passage(x3, y2, 0x0800) && check_passage(x3, y2, 0x0f)
    return check_passage(x3, y3, 0x0800) && check_passage(x3, y3, 0x0f)
  end
  
  #--------------------------------------------------------------------------
  # * Alias: Refresh
  #--------------------------------------------------------------------------
  alias game_map_refresh_cxj_fm refresh
  def refresh
    game_map_refresh_cxj_fm
    refresh_event_collision
  end
  
  #--------------------------------------------------------------------------
  # * Alias: Event Setup
  #--------------------------------------------------------------------------
  alias game_map_setup_events_cxj_fm setup_events
  def setup_events
    game_map_setup_events_cxj_fm
    refresh_event_collision
  end
  
  #--------------------------------------------------------------------------
  # * New: Refresh Event Collision
  #--------------------------------------------------------------------------
  def refresh_event_collision
    if(free_movement_enabled?)
      temp_list = {}
      @map.note.split(/[\r\n]+/).each { |line|
        collision = []
        event_name = ''
        case line
        when /<collisionbox (.+?):[ ]*(\d+),[ ]*(\d+),[ ]*(\d+),[ ]*(\d+)>/i
          collision = [$2, $3, $4, $5]
          event_name = $1
        when /<collisionbox (.+?):[ ]*(.+?)>/i
          collision = CXJ::FREE_MOVEMENT::COLLISION[$2] if !CXJ::FREE_MOVEMENT::COLLISION[$2].nil?
          event_name = $1
        end
        if !event_name.empty? && !collision.empty?
          temp_list[event_name] = collision
        end
      }
      @events.each_value {|event|
        if temp_list.has_key?(event.name)
          collision = temp_list[event.name]
          event.set_collision_rect(collision[0], collision[1], collision[2], collision[3])
        end
      }
    end
  end
  
  #--------------------------------------------------------------------------
  # * New: Get Array of Events at Designated Coordinates
  #--------------------------------------------------------------------------
  def events_xy_rect(x, y, rect)
    @events.values.select {|event| event.pos_rect?(x, y, rect) }
  end
  #--------------------------------------------------------------------------
  # * New: Get Array of Events at Designated Coordinates (Except Pass-Through)
  #--------------------------------------------------------------------------
  def events_xy_rect_nt(x, y, rect)
    @events.values.select {|event| event.pos_rect_nt?(x, y, rect) }
  end
  #--------------------------------------------------------------------------
  # * New: Get Array of Tile-Handling Events at Designated Coordinates
  #   (Except Pass-Through)
  #--------------------------------------------------------------------------
  def tile_events_xy_rect(x, y, rect)
    @tile_events.select {|event| event.pos_rect_nt?(x, y, rect) }
  end
  #--------------------------------------------------------------------------
  # * Alias: Calculate X Coordinate Shifted One Tile in Specific Direction
  #   (With Loop Adjustment)
  #--------------------------------------------------------------------------
  alias game_map_round_x_with_direction_cxj_fm round_x_with_direction
  def round_x_with_direction(x, d)
    if(free_movement_enabled?)
      round_x(x + ((d - 1) % 3 - 1))
    else
      game_map_round_x_with_direction_cxj_fm(x, d)
    end
  end
  #--------------------------------------------------------------------------
  # * Alias: Calculate Y Coordinate Shifted One Tile in Specific Direction
  #   (With Loop Adjustment)
  #--------------------------------------------------------------------------
  alias game_map_round_y_with_direction_cxj_fm round_y_with_direction
  def round_y_with_direction(y, d)
    if(free_movement_enabled?)
      round_y(y + (1 - ((d - 1) / 3)))
    else
      game_map_round_y_with_direction_cxj_fm(y, d)
    end
  end
end

#==============================================================================
# ** Game_CharacterBase
#------------------------------------------------------------------------------
#  This base class handles characters. It retains basic information, such as 
# coordinates and graphics, shared by all characters.
#==============================================================================

class Game_CharacterBase
  attr_accessor :move_poll
  #--------------------------------------------------------------------------
  # * Alias: Object Initialization
  #--------------------------------------------------------------------------
  alias game_characterbase_initialize_cxj_fm initialize
  def initialize
    game_characterbase_initialize_cxj_fm
    @old_x = @real_x
    @old_y = @real_y
    @pos_list = []
    @move_poll = []
  end
  #--------------------------------------------------------------------------
  # * Alias: Frame Update
  #
  # Added processing of movement being polled.
  #--------------------------------------------------------------------------
  alias game_characterbase_update_cxj_fm update
  def update
    @old_x = @real_x
    @old_y = @real_y
    if($game_map.free_movement_enabled?)
      interpret_move unless moving?
    end
    game_characterbase_update_cxj_fm
  end
  #--------------------------------------------------------------------------
  # * New: Get Pos List Length
  #--------------------------------------------------------------------------
  def pos_list_size
    @pos_list.size
  end
  #--------------------------------------------------------------------------
  # * New: Get Coordinates From Pos List
  #--------------------------------------------------------------------------
  def get_coords_from_pos_list
    return @pos_list.shift
  end
  #--------------------------------------------------------------------------
  # * New: Clear Pos List
  #--------------------------------------------------------------------------
  def clear_pos_list
    @pos_list.clear
  end
  #--------------------------------------------------------------------------
  # * New: Movement Interpreting
  #     Interprets the polled movement.
  #--------------------------------------------------------------------------
  def interpret_move(step_left = distance_per_frame)
    @move_poll = [] if @move_poll.nil?
    if @move_poll.size > 0
      current_move = @move_poll.shift()
      d = current_move[0]
      horz = (d - 1) % 3 - 1
      vert = 1 - ((d - 1) / 3)
      turn_ok = current_move[1]
      set_direction(d) if turn_ok
      check_event_trigger_touch_front
      processed = false
      if (d % 2 == 0 && passable?(@x, @y, d)) || (d % 2 != 0 && diagonal_passable?(@x, @y, horz, vert))
        process_move(horz, vert)
        processed = true
      elsif d % 2 != 0 && !diagonal_passable?(@x, @y, horz, vert)
        if passable?(@x, @y, horz + 5)
          set_direction(horz + 5) if turn_ok
          process_move(horz, 0)
          processed = true
        end
        if passable?(@x, @y, 5 - vert * 3)
          set_direction(5 - vert * 3) if turn_ok
          process_move(0, vert)
          processed = true
        end
      end
      if(processed)
        pixelstep = CXJ::FREE_MOVEMENT::PIXELS_PER_STEP / 32.0
        if(step_left > pixelstep && !@move_poll.empty?)
          interpret_move(step_left - pixelstep)
        elsif(jumping? && !@move_poll.empty?)
          interpret_move(0)
        end
      else
        @move_poll.clear
      end
      current_move
    end
  end

  #--------------------------------------------------------------------------
  # * New: Processes Movement
  #--------------------------------------------------------------------------
  def process_move(horz, vert)
    pixelstep = CXJ::FREE_MOVEMENT::PIXELS_PER_STEP / 32.0
    @x = @x + horz * pixelstep
    @y = @y + vert * pixelstep
    @pos_list.push({:x => @real_x, :y => @real_y})
    @pos_list.shift if @pos_list.size > CXJ::FREE_MOVEMENT::FOLLOWERS_DISTANCE * 2
    if(!jumping?)
      @x = $game_map.round_x(@x)
      @y = $game_map.round_y(@y)
      @real_x = @x - horz * pixelstep
      @real_y = @y - vert * pixelstep
      increase_steps
    end
  end
  #--------------------------------------------------------------------------
  # * Alias: Determine Triggering of Frontal Touch Event
  #--------------------------------------------------------------------------
  alias game_characterbase_check_event_trigger_touch_front_cxj_fm check_event_trigger_touch_front
  def check_event_trigger_touch_front
    if $game_map.free_movement_enabled?
      d = @direction
      horz = (d - 1) % 3 - 1
      vert = 1 - ((d - 1) / 3)
      pixelstep = CXJ::FREE_MOVEMENT::PIXELS_PER_STEP / 32.0
      x2 = $game_map.round_x(x + horz * pixelstep)
      y2 = $game_map.round_y(y + vert * pixelstep)
      check_event_trigger_touch(x2, y2)
    else
      game_characterbase_check_event_trigger_touch_front_cxj_fm
    end
  end
  #--------------------------------------------------------------------------
  # * New: Collision Rectangle
  #     Gets the collision rectangle.
  #--------------------------------------------------------------------------
  def collision_rect
    collision = CXJ::FREE_MOVEMENT::COLLISION["DEFAULT"]
    return Rect.new(collision[0], collision[1], collision[2], collision[3])
  end
  #--------------------------------------------------------------------------
  # * Alias: Determine if Passable
  #     d : Direction (2,4,6,8)
  #--------------------------------------------------------------------------
  alias game_characterbase_passable_cxj_fm? passable?
  def passable?(x, y, d)
    if $game_map.free_movement_enabled?
      horz = (d - 1) % 3 - 1
      vert = 1 - ((d - 1) / 3)
      pixelstep = CXJ::FREE_MOVEMENT::PIXELS_PER_STEP / 32.0
      x2 = $game_map.round_x(x + horz * pixelstep)
      y2 = $game_map.round_y(y + vert * pixelstep)
      return false unless $game_map.valid_rect?(x2, y2, collision_rect)
      return true if @through || debug_through?
      if $game_map.collision_map_enabled?
        return false unless map_check_passage_collision_maps(x, y, d, collision_rect)
        return false unless map_check_passage_collision_maps(x2, y2, reverse_dir(d), collision_rect)
      else
        return false unless map_passable_rect?(x, y, d, collision_rect)
        return false unless map_passable_rect?(x2, y2, reverse_dir(d), collision_rect)
      end
      return false if collide_with_characters?(x2, y2)
      return true
    else
      return game_characterbase_passable_cxj_fm?(x, y, d)
    end
  end
  #--------------------------------------------------------------------------
  # * Alias: Determine Diagonal Passability
  #     horz : Horizontal (4 or 6)
  #     vert : Vertical (2 or 8)
  #--------------------------------------------------------------------------
  alias game_characterbase_diagonal_passable_cxj_fm? diagonal_passable?
  def diagonal_passable?(x, y, horz, vert)
    if $game_map.free_movement_enabled?
      pixelstep = CXJ::FREE_MOVEMENT::PIXELS_PER_STEP / 32.0
      x2 = $game_map.round_x(x + horz * pixelstep)
      y2 = $game_map.round_y(y + vert * pixelstep)
      d = (horz == 4 ? -1 : 1) + (vert == 2 ? -3 : 3) + 5
      return passable?(x2, y2, d) && ($game_map.collision_map_enabled? || (passable?(x2, y2, horz) && passable?(x2, y2, vert)))
    else
      return game_characterbase_diagonal_passable_cxj_fm?(x, y, horz, vert)
    end
  end
  #--------------------------------------------------------------------------
  # * New: Determine if Map is Passable
  #     d : Direction (2,4,6,8)
  #--------------------------------------------------------------------------
  def map_passable_rect?(x, y, d, rect)
    $game_map.passable_rect?(x, y, d, rect)
  end
  
  #--------------------------------------------------------------------------
  # * New: Determine if Map is Passable (using Collision Maps)
  #     d : Direction (2,4,6,8)
  #--------------------------------------------------------------------------
  def map_check_passage_collision_maps(x, y, d, rect)
    horz = (d - 1) % 3 - 1
    vert = 1 - ((d - 1) / 3)
    pixelstep = CXJ::FREE_MOVEMENT::PIXELS_PER_STEP / 32.0
    x2 = $game_map.round_x(x + horz * pixelstep)
    y2 = $game_map.round_y(y + vert * pixelstep)
    if [2,4,6,8].include?(d)
      x3 = (x2 > x ? x + collision_rect.width / 32.0 : x) + collision_rect.x / 32.0
      y3 = (y2 > y ? y + collision_rect.height / 32.0 : y) + collision_rect.y / 32.0
      x4 = (x2 > x ? x2 + collision_rect.width / 32.0 : (x2 < x ? x2 : x + collision_rect.width / 32.0)) + collision_rect.x / 32.0
      y4 = (y2 > y ? y2 + collision_rect.height / 32.0 : (y2 < y ? y2 : y + collision_rect.height / 32.0)) + collision_rect.y / 32.0
    else
      x3 = x2 + collision_rect.x / 32.0
      y3 = y2 + collision_rect.y / 32.0
      x4 = x2 + collision_rect.x / 32.0 + collision_rect.width / 32.0
      y4 = y2 + collision_rect.y / 32.0 + collision_rect.height / 32.0
    end
    if x4 < x3
      x5 = x4
      x4 = x3
      x3 = x5
    end
    if y4 < y3
      y5 = y4
      y4 = y3
      y3 = y5
    end
    x3 = (x3 * 32).floor
    y3 = (y3 * 32).floor
    x4 = (x4 * 32).ceil
    y4 = (y4 * 32).ceil
    $game_map.check_passage_collision_maps(x3, y3, x4, y4)
  end
  #--------------------------------------------------------------------------
  # * Alias: Change Direction to Designated Direction
  #     d : Direction (2,4,6,8)
  #
  # Fix for diagonal movement.
  #--------------------------------------------------------------------------
  alias game_characterbase_set_direction_cxj_fm set_direction
  def set_direction(d)
    if $game_map.free_movement_enabled?
      if !@direction_fix && d != 0
        @direction = d
        if d % 2 != 0 && (!$imported["CXJ-AnimEx"] || !@has_diagonal)
          @direction+= 1
          @direction-= 2 if d > 5
          @direction = 10 - direction if d > 2 && d < 8
        end
      end
      @stop_count = 0
    else
      game_characterbase_set_direction_cxj_fm(d)
    end
  end
  #--------------------------------------------------------------------------
  # * Alias: Move Straight
  #     d:        Direction (2,4,6,8)
  #     turn_ok : Allows change of direction on the spot
  #
  # Polls the movement instead of processing them immediately.
  #--------------------------------------------------------------------------
  alias game_characterbase_move_straight_cxj_fm move_straight
  def move_straight(d, turn_ok = true)
    if $game_map.free_movement_enabled?
      pixelstep = CXJ::FREE_MOVEMENT::PIXELS_PER_STEP / 32.0
      @move_poll+= [[d, turn_ok]] * (distance_per_frame / pixelstep).ceil
    else
      game_characterbase_move_straight_cxj_fm(d, turn_ok)
    end
  end
  #--------------------------------------------------------------------------
  # * Alias: Move Diagonally
  #     horz:  Horizontal (4 or 6)
  #     vert:  Vertical (2 or 8)
  #
  # Polls the movement instead of processing them immediately.
  #--------------------------------------------------------------------------
  alias game_characterbase_move_diagonal_cxj_fm move_diagonal
  def move_diagonal(horz, vert)
    if $game_map.free_movement_enabled?
      pixelstep = CXJ::FREE_MOVEMENT::PIXELS_PER_STEP / 32.0
      @move_poll+= [[vert + (horz > 5 ? 1 : -1), true]] * (distance_per_frame / pixelstep).ceil
    else
      game_characterbase_move_diagonal_cxj_fm(horz, vert)
    end
  end
  #--------------------------------------------------------------------------
  # * New: Determine Coordinate Match
  #--------------------------------------------------------------------------
  def pos_rect?(x, y, rect)
    main_left = @x + collision_rect.x / 32.0
    main_top = @y + collision_rect.y / 32.0
    main_right = main_left + (collision_rect.width - 1) / 32.0
    main_bottom = main_top + (collision_rect.height - 1) / 32.0
    other_left = x + rect.x / 32.0
    other_top = y + rect.y / 32.0
    other_right = other_left + (rect.width - 1) / 32.0
    other_bottom = other_top + (rect.height - 1) / 32.0
    coltest = true
    coltest = false if main_right < other_left
    coltest = false if main_left > other_right
    coltest = false if main_bottom < other_top
    coltest = false if main_top > other_bottom
    if coltest == false && ($game_map.loop_horizontal? || $game_map.loop_vertical?) && x <= $game_map.width && y <= $game_map.height
      return true if $game_map.loop_horizontal? && pos_rect?(x + $game_map.width, y, rect)
      return true if $game_map.loop_vertical? && pos_rect?(x, y + $game_map.height, rect)
    end
    return coltest
  end
  #--------------------------------------------------------------------------
  # * New: Determine if Coordinates Match and Pass-Through Is Off (nt = No Through)
  #--------------------------------------------------------------------------
  def pos_rect_nt?(x, y, rect)
    pos_rect?(x, y, rect) && !@through
  end
  #--------------------------------------------------------------------------
  # * Alias: Detect Collision with Event
  #--------------------------------------------------------------------------
  alias game_characterbase_collide_with_events_cxj_fm? collide_with_events?
  def collide_with_events?(x, y)
    if $game_map.free_movement_enabled?
      $game_map.events_xy_rect_nt(x, y, collision_rect).any? do |event|
        (event.normal_priority? || self.is_a?(Game_Event)) && event != self
      end
    else
      game_characterbase_collide_with_events_cxj_fm?(x, y)
    end
  end
  #--------------------------------------------------------------------------
  # * Alias: Detect Collision with Vehicle
  #--------------------------------------------------------------------------
  alias game_characterbase_collide_with_vehicles_cxj_fm? collide_with_vehicles?
  def collide_with_vehicles?(x, y)
    if $game_map.free_movement_enabled?
      $game_map.boat.pos_rect_nt?(x, y, collision_rect) || $game_map.ship.pos_rect_nt?(x, y, collision_rect)
    else
      game_characterbase_collide_with_vehicles_cxj_fm?(x, y)
    end
  end
  #--------------------------------------------------------------------------
  # * Alias: Update While Jumping
  #--------------------------------------------------------------------------
  alias game_characterbase_update_jump_cxj_fm update_jump
  def update_jump
    if $game_map.free_movement_enabled?
      @jump_count -= 1
      diff_x = @real_x
      @real_x = (@real_x * @jump_count + @x) / (@jump_count + 1.0)
      @real_y = (@real_y * @jump_count + @y) / (@jump_count + 1.0)
      update_bush_depth
      if @jump_count == 0
        @real_x = @x = $game_map.round_x(@x)
        @real_y = @y = $game_map.round_y(@y)
      end
    else
      game_characterbase_update_jump_cxj_fm
    end
  end
  #--------------------------------------------------------------------------
  # * Alias: Calculate Jump Height
  #--------------------------------------------------------------------------
  alias game_characterbase_jump_height_cxj_fm jump_height
  def jump_height
    if $game_map.free_movement_enabled?
      ((@jump_peak * @jump_peak - (@jump_count * CXJ::FREE_MOVEMENT::JUMP_SPEED - @jump_peak).abs ** 2) / 2) * (CXJ::FREE_MOVEMENT::MAX_JUMP_HEIGHT > 0 && @jump_peak > 0 ? (CXJ::FREE_MOVEMENT::MAX_JUMP_HEIGHT * 2.0) / (@jump_peak ** 2) : 1)
    else
      game_characterbase_jump_height_cxj_fm
    end
  end
end
#==============================================================================
# ** Game_Character
#------------------------------------------------------------------------------
#  A character class with mainly movement route and other such processing
# added. It is used as a super class of Game_Player, Game_Follower,
# GameVehicle, and Game_Event.
#==============================================================================

class Game_Character < Game_CharacterBase
  #--------------------------------------------------------------------------
  # * Alias: Move at Random
  #--------------------------------------------------------------------------
  alias game_character_move_random_cxj_fm move_random
  def move_random
    if $game_map.free_movement_enabled?
      @move_poll+= [[2 + rand(4) * 2, true]] * ((24.0 + (rand(160) / 10) ) / CXJ::FREE_MOVEMENT::PIXELS_PER_STEP).ceil
    else
      game_character_move_random_cxj_fm
    end
  end
  #--------------------------------------------------------------------------
  # * Alias: Move Toward Character
  #--------------------------------------------------------------------------
  alias game_character_move_toward_character_cxj_fm move_toward_character
  def move_toward_character(character)
    if $game_map.free_movement_enabled?
      sx = distance_x_from(character.x)
      sy = distance_y_from(character.y)
      if sx.abs > sy.abs
        if passable?(@x, @y, (sx > 0 ? 4 : 6))
          @move_poll+= [[sx > 0 ? 4 : 6, true]] * (32.0 / CXJ::FREE_MOVEMENT::PIXELS_PER_STEP).ceil
        else
          @move_poll+= [[sy > 0 ? 8 : 2, true]] * (32.0 / CXJ::FREE_MOVEMENT::PIXELS_PER_STEP).ceil
        end
      elsif sy != 0
        if passable?(@x, @y, (sy > 0 ? 8 : 2))
          @move_poll+= [[sy > 0 ? 8 : 2, true]] * (32.0 / CXJ::FREE_MOVEMENT::PIXELS_PER_STEP).ceil
        else
          @move_poll+= [[sx > 0 ? 4 : 6, true]] * (32.0 / CXJ::FREE_MOVEMENT::PIXELS_PER_STEP).ceil
        end
      end
    else
      game_character_move_toward_character_cxj_fm(character)
    end
  end
  #--------------------------------------------------------------------------
  # * Alias: Move Away from Character
  #--------------------------------------------------------------------------
  alias game_character_move_away_from_character_cxj_fm move_away_from_character
  def move_away_from_character(character)
    if $game_map.free_movement_enabled?
      sx = distance_x_from(character.x)
      sy = distance_y_from(character.y)
      if sx.abs > sy.abs
        if passable?(@x, @y, (sx > 0 ? 6 : 4))
          @move_poll+= [[sx > 0 ? 6 : 4, true]] * (32.0 / CXJ::FREE_MOVEMENT::PIXELS_PER_STEP).ceil
        else
          @move_poll+= [[sy > 0 ? 2 : 8, true]] * (32.0 / CXJ::FREE_MOVEMENT::PIXELS_PER_STEP).ceil
        end
      elsif sy != 0
        if passable?(@x, @y, (sy > 0 ? 2 : 8))
          @move_poll+= [[sy > 0 ? 2 : 8, true]] * (32.0 / CXJ::FREE_MOVEMENT::PIXELS_PER_STEP).ceil
        else
          @move_poll+= [[sx > 0 ? 6 : 4, true]] * (32.0 / CXJ::FREE_MOVEMENT::PIXELS_PER_STEP).ceil
        end
      end
    else
      game_character_move_away_from_character_cxj_fm(character)
    end
  end
  #--------------------------------------------------------------------------
  # * Alias: 1 Step Forward
  #--------------------------------------------------------------------------
  alias game_character_move_forward_cxj_fm move_forward
  def move_forward
    if $game_map.free_movement_enabled?
      @move_poll+= [[@direction, true]] * (32.0 / CXJ::FREE_MOVEMENT::PIXELS_PER_STEP).ceil
    else
      game_character_move_forward_cxj_fm
    end
  end
  #--------------------------------------------------------------------------
  # * Alias: 1 Step Backward
  #--------------------------------------------------------------------------
  alias game_character_move_backward_cxj_fm move_backward
  def move_backward
    if $game_map.free_movement_enabled?
      last_direction_fix = @direction_fix
      @direction_fix = true
      @move_poll+= [[reverse_dir(@direction), false]] * (32.0 / CXJ::FREE_MOVEMENT::PIXELS_PER_STEP).ceil
      @direction_fix = last_direction_fix
    else
      game_character_move_backward_cxj_fm
    end
  end
  #--------------------------------------------------------------------------
  # * Alias: Jump
  #     x_plus : x-coordinate plus value
  #     y_plus : y-coordinate plus value
  #--------------------------------------------------------------------------
  alias game_character_jump_cxj_fm jump
  def jump(x_plus, y_plus)
    if $game_map.free_movement_enabled?
      #if x_plus.abs > y_plus.abs
      #  set_direction(x_plus < 0 ? 4 : 6) if x_plus != 0
      #else
      #  set_direction(y_plus < 0 ? 8 : 2) if y_plus != 0
      #end
      distance = Math.sqrt(x_plus * x_plus + y_plus * y_plus).round
      pollcount = distance * (32.0 / CXJ::FREE_MOVEMENT::PIXELS_PER_STEP).ceil
      #@move_poll+= [[(x_plus < 0 ? -1 : x_plus > 0 ? 1 : 0) + (y_plus < 0 ? 8 : y_plus > 0 ? 2 : 5), false]] * pollcount
      @x+= x_plus
      @y+= y_plus
      @jump_peak = 10 + distance - @move_speed
      @jump_count = @jump_peak / CXJ::FREE_MOVEMENT::JUMP_SPEED * 2
      @stop_count = 0
      straighten
    else
      game_character_jump_cxj_fm
    end
  end
  #--------------------------------------------------------------------------
  # * Alias: Process Move Command
  #--------------------------------------------------------------------------
  alias game_character_process_move_command_cxj_fm process_move_command
  def process_move_command(command)
    if $game_map.free_movement_enabled?
      case command.code
      when ROUTE_MOVE_DOWN;         @move_poll+= [[2, true]] * (32.0 / CXJ::FREE_MOVEMENT::PIXELS_PER_STEP).ceil 
      when ROUTE_MOVE_LEFT;         @move_poll+= [[4, true]] * (32.0 / CXJ::FREE_MOVEMENT::PIXELS_PER_STEP).ceil
      when ROUTE_MOVE_RIGHT;        @move_poll+= [[6, true]] * (32.0 / CXJ::FREE_MOVEMENT::PIXELS_PER_STEP).ceil
      when ROUTE_MOVE_UP;           @move_poll+= [[8, true]] * (32.0 / CXJ::FREE_MOVEMENT::PIXELS_PER_STEP).ceil
      when ROUTE_MOVE_LOWER_L;      @move_poll+= [[1, true]] * (32.0 / CXJ::FREE_MOVEMENT::PIXELS_PER_STEP).ceil
      when ROUTE_MOVE_LOWER_R;      @move_poll+= [[3, true]] * (32.0 / CXJ::FREE_MOVEMENT::PIXELS_PER_STEP).ceil
      when ROUTE_MOVE_UPPER_L;      @move_poll+= [[7, true]] * (32.0 / CXJ::FREE_MOVEMENT::PIXELS_PER_STEP).ceil
      when ROUTE_MOVE_UPPER_R;      @move_poll+= [[9, true]] * (32.0 / CXJ::FREE_MOVEMENT::PIXELS_PER_STEP).ceil
      else;                         game_character_process_move_command_cxj_fm(command)
      end
    else
      game_character_process_move_command_cxj_fm(command)
    end
  end
end
#==============================================================================
# ** Game_Player
#------------------------------------------------------------------------------
#  This class handles the player. It includes event starting determinants and
# map scrolling functions. The instance of this class is referenced by
# $game_player.
#==============================================================================

class Game_Player < Game_Character
  #--------------------------------------------------------------------------
  # * Alias: Object Initialization
  #--------------------------------------------------------------------------
  alias game_player_initialize_cxj_fm initialize
  def initialize
    @last_poll = []
    game_player_initialize_cxj_fm
    @custom_collision = nil
    @interaction = CXJ::FREE_MOVEMENT::INTERACTION["DEFAULT"]
  end
  #--------------------------------------------------------------------------
  # * Alias: Refresh
  #--------------------------------------------------------------------------
  alias game_player_refresh_cxj_fm refresh
  def refresh
    game_player_refresh_cxj_fm
    return if actor.nil? || !$game_map.free_movement_enabled?
    @custom_collision = nil
    @interaction = CXJ::FREE_MOVEMENT::INTERACTION["DEFAULT"]
    actor.actor.note.split(/[\r\n]+/).each { |line|
      case line
      when /<collisionbox:[ ]*(\d+),[ ]*(\d+),[ ]*(\d+),[ ]*(\d+)>/i
        @custom_collision = Rect.new($1, $2, $3, $4)
      when /<collisionbox:[ ]*(.+?)>/i
        collision = CXJ::FREE_MOVEMENT::COLLISION[$1] if !CXJ::FREE_MOVEMENT::COLLISION[$1].nil?
        @custom_collision = Rect.new(collision[0], collision[1], collision[2], collision[3])
      when /<interactionbox (\d+):[ ]*(\d+),[ ]*(\d+),[ ]*(\d+),[ ]*(\d+)>/i
        @interaction[$1] = [$2, $3, $4, $5] if $1 > 0 && $1 < 10
      when /<interactionbox:[ ]*(.+?)>/i
        @interaction = CXJ::FREE_MOVEMENT::INTERACTION[$1] if !CXJ::FREE_MOVEMENT::INTERACTION[$1].nil?
      end
    }
  end
  #--------------------------------------------------------------------------
  # * Alias: Execute Player Transfer
  #--------------------------------------------------------------------------
  alias game_player_perform_transfer_cxj_fm perform_transfer
  def perform_transfer
    is_transfer = transfer?
    game_player_perform_transfer_cxj_fm
    if is_transfer && $game_map.free_movement_enabled?
      @pos_list.clear
        @followers.clear_pos_list
      $game_map.events_xy_rect(x, y, collision_rect).each do |event|
        if event.trigger_in?([1,2]) && event.normal_priority? == false
          event.add_touch(self)
        end
      end
    end
  end
  #--------------------------------------------------------------------------
  # * New: Movement Interpreting
  #     Interprets the polled movement.
  #--------------------------------------------------------------------------
  def interpret_move(step_left = distance_per_frame)
    current_move = super(step_left)
    @last_poll.push(current_move) if !current_move.nil?
  end
  #--------------------------------------------------------------------------
  # * New: Collision Rectangle
  #     Gets the collision rectangle.
  #--------------------------------------------------------------------------
  def collision_rect
    key = @vehicle_type.id2name.upcase
    if @vehicle_type != :walk && !CXJ::FREE_MOVEMENT::COLLISION[key].nil?
      collision = CXJ::FREE_MOVEMENT::COLLISION[key]
      return Rect.new(collision[0], collision[1], collision[2] - 1, collision[3] - 1)
    end
    return @custom_collision if !@custom_collision.nil?
    return super
  end
  #--------------------------------------------------------------------------
  # * New: Interaction Rectangle
  #     Gets the interaction rectangle.
  #--------------------------------------------------------------------------
  def interaction_rect
    collision = @interaction[@direction]
    if collision.nil?
      return collision_rect
    end
    return Rect.new(collision[0], collision[1], collision[2], collision[3])
  end
  #--------------------------------------------------------------------------
  # * Override: Processing of Movement via Input from Directional Buttons
  #
  # Added diagonal movement.
  #--------------------------------------------------------------------------
  def move_by_input
    return if !movable? || $game_map.interpreter.running?
    if CXJ::FREE_MOVEMENT::ENABLE_DIAGONAL && Input.dir8 > 0 && Input.dir8 % 2 != 0
      d = Input.dir8
      horz = (d == 1 || d == 7 ? 4 : 6)
      vert = (d == 1 || d == 3 ? 2 : 8)
      move_diagonal(horz, vert)
    elsif Input.dir4 > 0
      move_straight(Input.dir4)
    end
  end
  #--------------------------------------------------------------------------
  # * New: Detect Collision (Including Followers)
  #--------------------------------------------------------------------------
  def collide_rect?(x, y, rect)
    !@through && (pos_rect?(x, y, rect) || followers.collide_rect?(x, y, rect))
  end
  #--------------------------------------------------------------------------
  # * Alias: Trigger Map Event
  #     triggers : Trigger array
  #     normal   : Is priority set to [Same as Characters] ?
  #--------------------------------------------------------------------------
  alias game_player_start_map_event_cxj_fm start_map_event
  def start_map_event(x, y, triggers, normal, rect = collision_rect)
    if $game_map.free_movement_enabled?
      return if $game_map.interpreter.running?
      event_list = {}
      $game_map.events_xy_rect(x, y, rect).each do |event|
        if event.trigger_in?(triggers) && event.normal_priority? == normal
          if !CXJ::FREE_MOVEMENT::ONLY_TRIGGER_CLOSEST
            event.start unless event.is_touching?(self)
            event.add_touch(self)
          else
            dist_x = event.distance_x_from(@x)
            dist_y = event.distance_y_from(@y)
            event_list[event] = Math.hypot(dist_x, dist_y) unless event.is_touching?(self)
          end
        end
      end
      if !event_list.empty?
        current_event = nil
        current_dist = -1
        event_list.each do |event, dist|
          if current_event == nil || current_dist > dist
            current_event = event
            current_dist = dist
          end
        end
        current_event.start
        current_event.add_touch(self)
      end
    else
      game_player_start_map_event_cxj_fm(x, y, triggers, normal)
    end
  end
  #--------------------------------------------------------------------------
  # * Alias: Determine if Front Event is Triggered
  #--------------------------------------------------------------------------
  alias game_player_check_event_trigger_there_cxj_fm check_event_trigger_there
  def check_event_trigger_there(triggers)
    if $game_map.free_movement_enabled?
      x2 = $game_map.round_x_with_direction(@x, @direction)
      y2 = $game_map.round_y_with_direction(@y, @direction)
      start_map_event(x2, y2, triggers, true, interaction_rect)
      return if $game_map.any_event_starting?
      return unless $game_map.counter?(x2, y2)
      x3 = $game_map.round_x_with_direction(x2, @direction)
      y3 = $game_map.round_y_with_direction(y2, @direction)
      start_map_event(x3, y3, triggers, true, interaction_rect)
    else
      game_player_check_event_trigger_there_cxj_fm(triggers)
    end
  end
  #--------------------------------------------------------------------------
  # * Override: Board Vehicle
  #    Assumes that the player is not currently in a vehicle.
  #--------------------------------------------------------------------------
  alias game_player_get_on_vehicle_cxj_fm get_on_vehicle
  def get_on_vehicle
    if $game_map.free_movement_enabled?
      front_x = $game_map.round_x_with_direction(@x, @direction)
      front_y = $game_map.round_y_with_direction(@y, @direction)
      @vehicle_type = :boat    if $game_map.boat.pos_rect?(front_x, front_y, interaction_rect)
      @vehicle_type = :ship    if $game_map.ship.pos_rect?(front_x, front_y, interaction_rect)
      @vehicle_type = :airship if $game_map.airship.pos_rect?(@x, @y, collision_rect)
      if vehicle
        @vehicle_getting_on = true
        horz = (@x > vehicle.x ? -1 : @x < vehicle.x ? 1 : 0)
        vert = (@y > vehicle.y ? -3 : @y < vehicle.y ? 3 : 0)
        d = 5 + horz - vert
        set_direction(d)
        @x = vehicle.x
        @y = vehicle.y
        @followers.gather
        @pos_list.clear
        @followers.clear_pos_list
      end
      @vehicle_getting_on
    else
      game_player_get_on_vehicle_cxj_fm
    end
  end
  #--------------------------------------------------------------------------
  # * Override: Get Off Vehicle
  #    Assumes that the player is currently riding in a vehicle.
  #--------------------------------------------------------------------------
  alias game_player_get_off_vehicle_cxj_fm get_off_vehicle
  def get_off_vehicle
    if $game_map.free_movement_enabled?
      if vehicle.land_ok?(@x, @y, @direction)
        set_direction(2) if in_airship?
        @followers.synchronize(@x, @y, @direction)
        vehicle.get_off
        unless in_airship?
          @x = $game_map.round_x_with_direction(@x, @direction)
          @y = $game_map.round_y_with_direction(@y, @direction)
          @transparent = false
        end
        @vehicle_getting_off = true
        @move_speed = 4
        @through = false
        make_encounter_count
        @followers.gather
        @pos_list.clear
        @followers.clear_pos_list
      end
      @vehicle_getting_off
    else
      game_player_get_off_vehicle_cxj_fm
    end
  end
  #--------------------------------------------------------------------------
  # * New: Determine if Map is Passable
  #     d:  Direction (2,4,6,8)
  #--------------------------------------------------------------------------
  def map_passable_rect?(x, y, d, rect)
    case @vehicle_type
    when :boat
      $game_map.boat_passable_rect?(x, y, vehicle.collision_rect)
    when :ship
      $game_map.ship_passable_rect?(x, y, vehicle.collision_rect)
    when :airship
      true
    else
      super
    end
  end
  #--------------------------------------------------------------------------
  # * Alias: Move Diagonally
  #--------------------------------------------------------------------------
  alias game_player_move_diagonal_cxj_fm move_diagonal
  def move_diagonal(horz, vert)
    if $game_map.free_movement_enabled?
      @followers.move if diagonal_passable?(@x, @y, horz, vert) || passable?(@x, @y, horz + 5) || passable?(@x, @y, 5 - vert * 3)
      super
    else
      game_player_move_diagonal_cxj_fm(horz, vert)
    end
  end
  #--------------------------------------------------------------------------
  # * Alias: Create Encounter Count
  #--------------------------------------------------------------------------
  alias game_player_make_encounter_count_cxj_fm make_encounter_count
  def make_encounter_count
    game_player_make_encounter_count_cxj_fm
    @encounter_count*= (32 / CXJ::FREE_MOVEMENT::PIXELS_PER_STEP) + (32 / 2 < CXJ::FREE_MOVEMENT::PIXELS_PER_STEP ? 1 : 0) if $game_map.free_movement_enabled?
  end
  #--------------------------------------------------------------------------
  # * Alias: Detect Collision with Vehicle
  #--------------------------------------------------------------------------
  alias game_player_collide_with_vehicles_cxj_fm? collide_with_vehicles?
  def collide_with_vehicles?(x, y)
    return (@vehicle_type != :boat && $game_map.boat.pos_rect_nt?(x, y, collision_rect)) || (@vehicle_type != :ship && $game_map.ship.pos_rect_nt?(x, y, collision_rect)) if $game_map.free_movement_enabled?
    return game_player_collide_with_vehicles_cxj_fm?(x, y)
  end
  #--------------------------------------------------------------------------
  # * Alias: Processing When Not Moving
  #     last_moving : Was it moving previously?
  #--------------------------------------------------------------------------
  alias game_player_update_nonmoving_cxj_fm update_nonmoving
  def update_nonmoving(last_moving)
    game_player_update_nonmoving_cxj_fm(last_moving || @old_x != @real_x || @old_y != @real_y)
    return if $game_map.free_movement_enabled?
    update_encounter if !last_moving && !@last_poll.empty?
    @last_poll.clear
  end
end
#==============================================================================
# ** Game_Followers
#------------------------------------------------------------------------------
#  This is a wrapper for a follower array. This class is used internally for
# the Game_Player class. 
#==============================================================================

class Game_Followers
  #--------------------------------------------------------------------------
  # * New: Detect Collision
  #--------------------------------------------------------------------------
  def collide_rect?(x, y, rect)
    visible_folloers.any? {|follower| follower.pos_rect?(x, y, rect) }
  end
  #--------------------------------------------------------------------------
  # * New: Clear Pos List
  #--------------------------------------------------------------------------
  def clear_pos_list
    reverse_each do |follower|
      follower.clear_pos_list
    end
  end
  #--------------------------------------------------------------------------
  # * Alias: Movement
  #--------------------------------------------------------------------------
  alias game_followers_move_cxj_fm move
  def move
    if $game_map.free_movement_enabled?
      reverse_each do |follower|
        if gathering?
          follower.board
        end
        follower.chase_preceding_character
      end
    else
      game_followers_move_cxj_fm
    end
  end
end
#==============================================================================
# ** Game_Vehicle
#------------------------------------------------------------------------------
#  This class handles vehicles. It's used within the Game_Map class. If there
# are no vehicles on the current map, the coordinates are set to (-1,-1).
#==============================================================================

class Game_Vehicle < Game_Character
  #--------------------------------------------------------------------------
  # * New: Collision Rectangle
  #     Gets the collision rectangle.
  #--------------------------------------------------------------------------
  def collision_rect
    collision = CXJ::FREE_MOVEMENT::COLLISION["DEFAULT"]
    key = @type.id2name.upcase
    collision = CXJ::FREE_MOVEMENT::COLLISION[key] if !CXJ::FREE_MOVEMENT::COLLISION[key].nil?
    return Rect.new(collision[0], collision[1], collision[2], collision[3])
  end
  #--------------------------------------------------------------------------
  # * New: Determine Coordinate Match
  #--------------------------------------------------------------------------
  def pos_rect?(x, y, rect)
    on_map? && super(x, y, rect)
  end
  #--------------------------------------------------------------------------
  # * New: Determine If On Map
  #--------------------------------------------------------------------------
  def on_map?
    @map_id == $game_map.map_id
  end
  #--------------------------------------------------------------------------
  # * Alias: Determine if Docking/Landing Is Possible
  #     d:  Direction (2,4,6,8)
  #--------------------------------------------------------------------------
  alias game_vehicle_land_ok_cxj_fm? land_ok?
  def land_ok?(x, y, d)
    return game_vehicle_land_ok_cxj_fm?(x, y, d) if !$game_map.free_movement_enabled?
    if @type == :airship
      return false unless $game_map.airship_land_ok_rect?(x, y, collision_rect)
      return false unless $game_map.events_xy_rect(x, y, collision_rect).empty?
    else
      x2 = $game_map.round_x_with_direction(x, d)
      y2 = $game_map.round_y_with_direction(y, d)
      return false unless $game_map.valid_rect?(x2, y2, collision_rect)
      return false unless $game_map.passable_rect?(x2, y2, reverse_dir(d), collision_rect)
      return false if collide_with_characters?(x2, y2)
    end
    return true
  end
end

#==============================================================================
# ** Game_Event
#------------------------------------------------------------------------------
#  This class handles events. Functions include event page switching via
# condition determinants and running parallel process events. Used within the
# Game_Map class.
#==============================================================================

class Game_Event < Game_Character
  #--------------------------------------------------------------------------
  # * Alias: Initialize Public Member Variables
  #--------------------------------------------------------------------------
  alias game_event_init_public_members_cxj_fm init_public_members
  def init_public_members
    game_event_init_public_members_cxj_fm
    @collisionbox = Rect.new(0, 0, 32, 32)
    @touch_chars = []
  end
  #--------------------------------------------------------------------------
  # * Alias: Frame Update
  #--------------------------------------------------------------------------
  alias game_event_update_cxj_fm update
  def update
    if $game_map.free_movement_enabled?
      temp_chars = []
      @touch_chars.each do |character|
        temp_chars.push(character) if character.pos_rect?(@x, @y, collision_rect)
      end
      @touch_chars = temp_chars
    end
    game_event_update_cxj_fm
  end
  #--------------------------------------------------------------------------
  # * Alias: Refresh
  #--------------------------------------------------------------------------
  alias game_event_refresh_cxj_fm refresh
  def refresh
    if !@event.pages.empty? && $game_map.free_movement_enabled?
      get_collision_from_comment(@event.pages[0].list)
    end
    game_event_refresh_cxj_fm
    set_current_collision if $game_map.free_movement_enabled?
  end
  #--------------------------------------------------------------------------
  # * New: Set Current Collision
  #--------------------------------------------------------------------------
  def set_current_collision
    @event.pages.each do |page|
      if conditions_met?(page)
        get_collision_from_comment(page.list)
      end
    end
  end
  #--------------------------------------------------------------------------
  # * New: Set Collision From Comment Tags
  #--------------------------------------------------------------------------
  def get_collision_from_comment(list)
    list.each do |command|
      if command.code == 108 || command.code == 408
        case command.parameters[0]
        when /<collisionbox:[ ]*(\d+),[ ]*(\d+),[ ]*(\d+),[ ]*(\d+)>/i
          @collisionbox = Rect.new($1, $2, $3, $4)
        when /<collisionbox:[ ]*(.+?)>/i
          collision = CXJ::FREE_MOVEMENT::COLLISION[$1] if !CXJ::FREE_MOVEMENT::COLLISION[$1].nil?
          @collisionbox = Rect.new(collision[0], collision[1], collision[2], collision[3])
        end
      end
    end
  end
  #--------------------------------------------------------------------------
  # * New: Initialize Public Member Variables
  #--------------------------------------------------------------------------
  def set_collision_rect(*args)
    return if args.empty?
    x = 0
    y = 0
    width = 32
    height = 32
    if args[0].instance_of?(String)
      collision = CXJ::FREE_MOVEMENT::COLLISION[args[0]]
      if !collision.nil? && !collision.empty?
        x = collision[0]
        y = collision[1]
        width = collision[2]
        height = collision[3]
      end
    else
      x = args[0]
      y = args[1] if args.size >=2
      width = args[2] if args.size >= 3
      height = args[3] if args.size >= 4
    end
    @collisionbox = Rect.new(x, y, width, height)
  end
  #--------------------------------------------------------------------------
  # * New: Collision Rectangle
  #     Gets the collision rectangle.
  #--------------------------------------------------------------------------
  def collision_rect
    return @collisionbox
  end
  #--------------------------------------------------------------------------
  # * Alias: Detect Collision with Player (Including Followers)
  #--------------------------------------------------------------------------
  alias game_event_collide_with_player_characters_cxj_fm? collide_with_player_characters?
  def collide_with_player_characters?(x, y)
    return game_event_collide_with_player_characters_cxj_fm?(x, y) if !$game_map.free_movement_enabled?
    normal_priority? && $game_player.collide_rect?(x, y, collision_rect)
  end
  #--------------------------------------------------------------------------
  # * Alias: Determine if Touch Event is Triggered
  #--------------------------------------------------------------------------
  alias game_event_check_event_trigger_touch_cxj_fm check_event_trigger_touch
  def check_event_trigger_touch(x, y)
    if $game_map.free_movement_enabled?
      return if $game_map.interpreter.running?
      if @trigger == 2 && $game_player.pos_rect?(x, y, $game_player.collision_rect)
        start if !jumping? && normal_priority?
      end
    else
      game_event_check_event_trigger_touch_cxj_fm(x, y)
    end
  end
  
  #--------------------------------------------------------------------------
  # * New: Add Character to Touch List
  #     Keeps track of characters already touching this event.
  #--------------------------------------------------------------------------
  def add_touch(character)
    @touch_chars.push(character) unless is_touching?(character)
  end
  
  #--------------------------------------------------------------------------
  # * New: Checks if the current event is touching.
  #--------------------------------------------------------------------------
  def is_touching?(character)
    @touch_chars.include?(character)
  end
  
  #--------------------------------------------------------------------------
  # * New: Event Name
  #--------------------------------------------------------------------------
  def name
    @event.name
  end
end
#==============================================================================
# ** Game_Follower
#------------------------------------------------------------------------------
#  This class handles followers. A follower is an allied character, other than
# the front character, displayed in the party. It is referenced within the
# Game_Followers class.
#==============================================================================

class Game_Follower < Game_Character
  #--------------------------------------------------------------------------
  # * Alias: Object Initialization
  #--------------------------------------------------------------------------
  alias game_follower_initialize_cxj_fm initialize
  def initialize(member_index, preceding_character)
    game_follower_initialize_cxj_fm(member_index, preceding_character)
    @force_chase = false
    @board = false
    @through = CXJ::FREE_MOVEMENT::FOLLOWER_THROUGH
    @custom_collision = nil
  end
  #--------------------------------------------------------------------------
  # * Alias: Refresh
  #--------------------------------------------------------------------------
  alias game_follower_refresh_cxj_fm refresh
  def refresh
    game_follower_refresh_cxj_fm
    return if actor.nil? || !$game_map.free_movement_enabled?
    @custom_collision = nil
    @interaction = CXJ::FREE_MOVEMENT::INTERACTION["DEFAULT"]
    actor.actor.note.split(/[\r\n]+/).each { |line|
      case line
      when /<collisionbox:[ ]*(\d+),[ ]*(\d+),[ ]*(\d+),[ ]*(\d+)>/i
        @custom_collision = Rect.new($1, $2, $3, $4)
      when /<collisionbox:[ ]*(.+?)>/i
        collision = CXJ::FREE_MOVEMENT::COLLISION[$1] if !CXJ::FREE_MOVEMENT::COLLISION[$1].nil?
        @custom_collision = Rect.new(collision[0], collision[1], collision[2], collision[3])
      end
    }
  end
  #--------------------------------------------------------------------------
  # * New: Collision Rectangle
  #     Gets the collision rectangle.
  #--------------------------------------------------------------------------
  def collision_rect
    return @custom_collision if !@custom_collision.nil?
    return super
  end
  #--------------------------------------------------------------------------
  # * Alias: Pursue Preceding Character
  #--------------------------------------------------------------------------
  alias game_follower_chase_preceding_character_cxj_fm chase_preceding_character
  def chase_preceding_character
    if $game_map.free_movement_enabled?
      unless moving?
        if @board
          @x = @preceding_character.x
          @y = @preceding_character.y
          @board = false
        elsif CXJ::FREE_MOVEMENT::FOLLOW_TYPE == :trace && !@force_chase
          max_list_size = CXJ::FREE_MOVEMENT::FOLLOWERS_DISTANCE / CXJ::FREE_MOVEMENT::PIXELS_PER_STEP
          if(@preceding_character.pos_list_size > max_list_size)
            while @preceding_character.pos_list_size > max_list_size
              pos = @preceding_character.get_coords_from_pos_list
              unless pos.nil?
                sx = distance_x_from(pos[:x])
                sy = distance_y_from(pos[:y])
                horz = (sx > 0 ? -1 : sx < 0 ? 1 : 0)
                vert = (sy > 0 ? -1 : sy < 0 ? 1 : 0)
                d = horz + (vert == 0 && horz == 0 ? 0 : 5 - vert * 3)
                set_direction(d)
                pixelstep = CXJ::FREE_MOVEMENT::PIXELS_PER_STEP / 32.0
                @x = @x + horz * pixelstep
                @y = @y + vert * pixelstep
                @pos_list.push({:x => @real_x, :y => @real_y})
                @pos_list.shift if @pos_list.size > CXJ::FREE_MOVEMENT::FOLLOWERS_DISTANCE * 2
                if(!jumping?)
                  @x = $game_map.round_x(@x)
                  @y = $game_map.round_y(@y)
                  @real_x = @x - horz * pixelstep
                  @real_y = @y - vert * pixelstep
                  increase_steps
                end
              end
            end
          end
        elsif @force_chase
          dist = CXJ::FREE_MOVEMENT::FOLLOWERS_DISTANCE / 32.0
          mrgn = CXJ::FREE_MOVEMENT::FOLLOWERS_DISTANCE_MARGIN / 32.0
          sx = distance_x_from(@preceding_character.x)
          sy = distance_y_from(@preceding_character.y)
          sd = Math.hypot(sx, sy)
          if(sd > dist && sx.abs > mrgn && sy.abs > mrgn)
            @move_poll+=[[(sx > 0 ? -1 : 1) + (sy > 0 ? 8 : 2), true]]
          elsif sx.abs > dist && sx.abs > sy.abs
            @move_poll+=[[sx > 0 ? 4 : 6, true]]
          elsif sy.abs > dist && sx.abs < sy.abs
            @move_poll+=[[sy > 0 ? 8 : 2, true]]
          end
        end
      end
    else
      game_follower_chase_preceding_character_cxj_fm
    end
  end

  #--------------------------------------------------------------------------
  # * New: The Distance To Preceding Character
  #--------------------------------------------------------------------------
  def distance_preceding_character
    sx = distance_x_from(@preceding_character.x)
    sy = distance_y_from(@preceding_character.y)
    return Math.hypot(sx, sy)
  end
  
  #--------------------------------------------------------------------------
  # * New: Processes Movement
  #--------------------------------------------------------------------------
  def process_move(horz, vert)
    super(horz, vert)
    dist = CXJ::FREE_MOVEMENT::FOLLOWERS_DISTANCE / 32.0
    if distance_preceding_character > dist && @move_poll.size == 0
      @force_chase = true
      chase_preceding_character
      @force_chase = false
    end
  end
  
  #--------------------------------------------------------------------------
  # * New: Sets the Character To Board
  #--------------------------------------------------------------------------
  def board
    @board = true
  end
end

#==============================================================================
# ** Game_Interpreter
#------------------------------------------------------------------------------
#  An interpreter for executing event commands. This class is used within the
# Game_Map, Game_Troop, and Game_Event classes.
#==============================================================================

class Game_Interpreter
  #--------------------------------------------------------------------------
  # * New: Set Collision Rectangle From Event Script
  #--------------------------------------------------------------------------
  def set_collision_rect(*args)
    $game_map.events[@event_id].set_collision_rect(*args)
  end
end

if(CXJ::FREE_MOVEMENT::SHOW_COLLISION_BOXES)
  #============================================================================
  # ** Sprite_CollisionBox
  #----------------------------------------------------------------------------
  #  This sprite is used to display collision boxes. It's mainly used for
  # debugging purposes.
  #============================================================================

  class Sprite_CollisionBox < Sprite
    
    #------------------------------------------------------------------------
    # * New: Initialization
    #------------------------------------------------------------------------
    def initialize(viewport, parent_sprite = nil)
      super(viewport)
      @color = Color.new(0, 255, 0, 128)
      @icolor = Color.new(255, 0, 0, 128)
      @parent_sprite = parent_sprite
      self.bitmap = Bitmap.new(96, 96)
      update
    end
    
    #------------------------------------------------------------------------
    # * New: Update Per Frame
    #------------------------------------------------------------------------
    def update
      self.x = @parent_sprite.x
      self.y = @parent_sprite.y
      draw_box
    end
    
    #------------------------------------------------------------------------
    # * New: Draw Collision Box
    #------------------------------------------------------------------------
    def draw_box
      self.ox = 48
      self.oy = 60
      self.bitmap.clear
      return if @parent_sprite.character.through && @parent_sprite.character.transparent
      return if @parent_sprite.character.instance_of?(Game_Vehicle) && !@parent_sprite.character.on_map?
      col_rect = @parent_sprite.character.collision_rect
      self.bitmap.fill_rect(col_rect.x + 32, col_rect.y + 32, col_rect.width, col_rect.height, @color)
      if(@parent_sprite.character == $game_player)
        int_rec = $game_player.interaction_rect
        d = $game_player.direction
        horz = (d - 1) % 3 - 1
        vert = 1 - ((d - 1) / 3)
        int_rect = Rect.new(int_rec.x + 32 + 32 * horz, int_rec.y + 32 + 32 * vert, int_rec.width, int_rec.height)
        self.bitmap.fill_rect(int_rect, @icolor)
      end
    end
  end

  #============================================================================
  # ** Spriteset_Map
  #----------------------------------------------------------------------------
  #  This class brings together map screen sprites, tilemaps, etc. It's used
  # within the Scene_Map class.
  #============================================================================

  class Spriteset_Map
    #--------------------------------------------------------------------------
    # * Alias: Create Character Sprite
    #--------------------------------------------------------------------------
    alias spriteset_map_create_characters_cxj_fm create_characters
    def create_characters
      spriteset_map_create_characters_cxj_fm
      @collision_sprites = []
      @character_sprites.each do |char|
        @collision_sprites.push(Sprite_CollisionBox.new(@viewport, char))
      end
    end
    #--------------------------------------------------------------------------
    # * Alias: Update Character Sprite
    #--------------------------------------------------------------------------
    alias spriteset_map_update_characters_cxj_fm update_characters
    def update_characters
      spriteset_map_update_characters_cxj_fm
      @collision_sprites.each {|sprite| sprite.update }
    end
  end
end