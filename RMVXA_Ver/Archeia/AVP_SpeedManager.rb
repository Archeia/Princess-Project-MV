#==============================================================================
# 
# ▼ Archeia Visual Plugins: Speed Manager
# -- Script: Speed Manager
# -- Last Updated: December 31, 2018
# -- Level: Normal
# -- Requires: n/a
# 
#==============================================================================

$imported = {} if $imported.nil?
$imported["AVP-SpeedManager"] = true

#==============================================================================
# ▼ Updates
# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
#
# 12/31/2018 - Initial Release!
# 
#==============================================================================
# ▼ Introduction
# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
# This is a port of Karberus's Speed Manager plugin for RPG Maker MV.
# This Plugin allows you to set default speeds for player, dashing, boat,
# ship and airship.
#
# This also includes a new script call functionality where you can manipulate
# the player's move speed by using the script call: 
#
# $game_player.move_speed = x
#
#==============================================================================
# ▼ Agility Based (Experimental)
# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
# I'm not completely sure how this will work, but basically the higher the
# party leader's agility, the faster you will be able to move. Currently, this
# should affect any movement, such as dashing or vehicles. I might change it
# so that vehicles are unaffected (that makes more sense, right?).
# 
# The way it works, the party leader's agility is divided by 2048 and then
# added to the Distance Per Frame formula.
#
#==============================================================================
# ▼ Instructions
# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
# To install this script, open up your script editor and copy/paste this script
# to an open slot below ▼ Materials/素材 but above ▼ Main. Remember to save.
# 
#==============================================================================
# ▼ Compatibility
# =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
# This script is made strictly for RPG Maker VX Ace. It is highly unlikely that
# it will run with RPG Maker VX without adjusting.
# 
#==============================================================================

module AVP
  MOVESPEED = 4
  DASHSPEED = 1
  BOATSPEED = 4
  SHIPSPEED = 5
  AIRSPEED = 6
  AGISPEED = false
end

#==============================================================================
# ** Game_CharacterBase
#------------------------------------------------------------------------------
#  This base class handles characters. It retains basic information, such as 
# coordinates and graphics, shared by all characters.
#==============================================================================
class Game_CharacterBase
  #--------------------------------------------------------------------------
  # * Enable Script Call: $game_player.move_speed = x
  #--------------------------------------------------------------------------
  attr_accessor :move_speed
  #--------------------------------------------------------------------------
  # * Initialize Public Member Variables
  #--------------------------------------------------------------------------
  alias avp_init_public_members init_public_members
  def init_public_members
    avp_init_public_members
    @move_speed = AVP::MOVESPEED
  end
  #--------------------------------------------------------------------------
  # * Get Move Speed (Account for Dash)
  #--------------------------------------------------------------------------
  def real_move_speed
    @move_speed + (dash? ? AVP::DASHSPEED : 0)
  end
  #--------------------------------------------------------------------------
  # * Calculate Move Distance per Frame
  #--------------------------------------------------------------------------
  def distance_per_frame
    if AVP::AGISPEED == false
      (2 ** real_move_speed) / 256.0
    else
      (2 ** real_move_speed) / 256.0 + $game_party.members[0].agi / 2048
    end
  end
end # Game_CharacterBase

#==============================================================================
# ** Game_Vehicle
#------------------------------------------------------------------------------
#  This class handles vehicles. It's used within the Game_Map class. If there
# are no vehicles on the current map, the coordinates are set to (-1,-1).
#==============================================================================
class Game_Vehicle < Game_Character
  #--------------------------------------------------------------------------
  # * Initialize Move Speed
  #--------------------------------------------------------------------------
  def init_move_speed
    @move_speed = AVP::BOATSPEED if @type == :boat
    @move_speed = AVP::SHIPSPEED if @type == :ship
    @move_speed = AVP::AIRSPEED  if @type == :airship
  end
end # Game_Vehicle
