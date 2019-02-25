#==============================================================================
# 
# GaryCXJk - Title Rearranger v1.00
# * Last Updated: 2012.12.28
# * Level: Easy
# * Requires: N/A
#
#==============================================================================

$imported = {} if $imported.nil?
$imported["CXJ-TitleRearranger"] = true

#==============================================================================
#
# Changelog:
#
#------------------------------------------------------------------------------
# 2012.12.30 - v1.00
#
# * Initial release
#
#==============================================================================
#
# I have the tendency to write test code, and sometimes I want to see the
# results without having to go through the main game. At other times, I just
# want to add new functionality to the title screen, for example, to have a
# settings menu, or to show a credits screen.
#
# Which is why I made this script. Because I'm a programmer, ergo, because I'm
# lazy.
#
#==============================================================================
#
# Installation:
#
# Make sure to put this below Materials, but above Main Process.
#
# This script adds aliases for several methods. If you are sure no method that
# is used by other scripts get overridden, you can place it anywhere,
# otherwise, make sure this script is loaded after any other script overriding
# these methods, otherwise this script stops working.
#
#------------------------------------------------------------------------------
# Aliased methods:
#
# * class Window_TitleCommand
#   - make_command_list
# * class Scene_Title
#   - create_command_window
#
#==============================================================================
#
# Usage:
#
# This script generally is plug-and-play, and therefore requires nothing much.
# All you have to do is follow the instructions of the part that can be
# modified safely, which I hope is clear enough to understand. After that it's
# just running the script.
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
#==============================================================================
#
# The code below defines the settings of this script, and are there to be
# modified.
#
#==============================================================================

module CXJ
  module TITLE_REARRANGER
    
    #------------------------------------------------------------------------
    # Add the commands in the order you want it to be displayed. 
    #------------------------------------------------------------------------
    COMMANDS = [
    :new_game,
    :continue,
    :gameover,
    :shutdown,
    ]
    
    #------------------------------------------------------------------------
    # Add handlers for your methods here. This assumes you know scripting.
    # Both the activation state flag and the extra arbitrary data are called
    # using methods, as the data is most likely dynamic and therefore cannot
    # be initialized here. You can leave these two out if you're not going
    # to use them, or set them as nil.
    #------------------------------------------------------------------------
    NEW_COMMANDS = {
    # :command  => [ "Display Name",  Handler Method, Enabled Method, Ext Data Method],
      :gameover => [ "Game Over",   :cxj_tr_gameover, nil,            nil],
    }
    
    #------------------------------------------------------------------------
    # Add methods below, or in the class Scene_Title.
    # It is preferable to add them to the Scene_Title class for better
    # compatibility, which is why there is a special block below. However,
    # in most instances you could put the methods here if you want to, for
    # example to keep the code as clean as possible.
    #------------------------------------------------------------------------
  end
end

#==============================================================================
# ** Scene_Title
#------------------------------------------------------------------------------
#  This class performs the title screen processing.
#------------------------------------------------------------------------------
#  Add methods below.
#==============================================================================
class Scene_Title < Scene_Base
  #--------------------------------------------------------------------------
  # * Show Game Over Screen
  #--------------------------------------------------------------------------
  def cxj_tr_gameover
    close_command_window
    SceneManager.call(Scene_Gameover)
  end
end

#==============================================================================
#
# The code below should not be altered unless you know what you're doing.
#
#==============================================================================

#==============================================================================
# ** Window_TitleCommand
#------------------------------------------------------------------------------
#  This window is for selecting New Game/Continue on the title screen.
#==============================================================================

class Window_TitleCommand < Window_Command
  #--------------------------------------------------------------------------
  # * Alias: Create Command List
  #--------------------------------------------------------------------------
  alias window_titlecommand_make_command_list_cxj_tr make_command_list
  def make_command_list
    window_titlecommand_make_command_list_cxj_tr
    CXJ::TITLE_REARRANGER::NEW_COMMANDS.each do |key, value|
      is_enabled = true
      if value.size > 2 && !value[2].nil?
        enabled_method = method(value[2]) if respond_to?(value[2])
        enabled_method = CXJ::TITLE_REARRANGER.method(value[2]) if enabled_method.nil? && CXJ::TITLE_REARRANGER.respond_to?(value[2])
        is_enabled = enabled_method.call if(!enabled_method.nil?)
      end
      ext = nil
      if value.size > 3 && !value[3].nil?
        ext_method = method(value[3]) if respond_to?(value[3])
        ext_method = CXJ::TITLE_REARRANGER.method(value[3]) if ext_method.nil? && CXJ::TITLE_REARRANGER.respond_to?(value[3])
        ext = ext_method.call if !ext_method.nil?
      end
      add_command(value[0], key, is_enabled, ext)
    end
    command_list = CXJ::TITLE_REARRANGER::COMMANDS
    new_list = Array.new(command_list.size)
    @list.each do |value|
      next if !command_list.include?(value[:symbol])
      new_list[command_list.index(value[:symbol])] = value
    end
    @list = new_list
  end
end

#==============================================================================
# ** Scene_Title
#------------------------------------------------------------------------------
#  This class performs the title screen processing.
#==============================================================================
class Scene_Title < Scene_Base
  #--------------------------------------------------------------------------
  # * Alias: Create Command Window
  #--------------------------------------------------------------------------
  alias scene_title_create_command_window_cxj_tr create_command_window
  def create_command_window
    scene_title_create_command_window_cxj_tr
    CXJ::TITLE_REARRANGER::NEW_COMMANDS.each do |key, value|
      handler_method = method(value[1]) if respond_to?(value[1])
      handler_method = CXJ::TITLE_REARRANGER.method(value[1]) if handler_method.nil? && CXJ::TITLE_REARRANGER.respond_to?(value[1])
      @command_window.set_handler(key, handler_method) if !handler_method.nil?
    end
  end
end