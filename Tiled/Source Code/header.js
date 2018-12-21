/*:
 * @plugindesc v1.20 Plugin supports Tiled Map Editor maps with some additional
 * features.
 * @author Dr.Yami
 *
 * @param Z - Player
 * @desc Z Index for Same as Characters events and Players.
 * Default: 3
 * @default 3
 *
 * @param Z - Below Player
 * @desc Z Index for Below Characters events.
 * Default: 1
 * @default 1
 *
 * @param Z - Above Player
 * @desc Z Index for Above Characters events.
 * Default: 5
 * @default 5
 *
 * @param Half-tile movement
 * @desc Moving and collision checking by half a tile.
 * Can be true or false
 * @default true
 *
 * @param Priority Tiles Limit
 * @desc Limit for priority tile sprites.
 * Should not be too large.
 * @default 256
 *
 * @param Map Level Variable
 * @desc Get and set map level by variable
 * @default 0
 *
 * @help
 * Use these properties in Tiled Map's layer:
 *   zIndex
 *   The layer will have z-index == property's value
 *
 *   collision
 *   The layer will be collision mask layer. Use one of these value:
 *     full - Normal collision (1 full-tile)
 *     arrow - Arrow collision
 *     up-left - Half-tile collision up-left quarter
 *     up-right - Half-tile collision up-right quarter
 *     down-left - Half-tile collision down-left quarter
 *     down-right - Half-tile collision down-right quarter
 *
 *   arrowImpassable
 *   If the layer is an arraw collision mask layer, it will make one direction be impassable
 *   Value can be up, down, left, right
 *
 *   regionId
 *   Mark the layer as region layer, the layer ID will be the value of property
 *
 *   priority
 *   Mark the layer as priority layer, allows it goes above player when player is behind,
 *   below player when player is in front of. Value should be > 0, zIndex should be
 *   the same as player z-index.
 *
 *   level
 *   Mark the layer on different level, use for multiple levels map (for example a bridge).
 *   Default level is 0. Use this for collision and regionId.
 *
 *   hideOnLevel
 *   Hide the layer when on a certain level.
 *
 *   toLevel
 *   The tiles on this layer will transfer player to another level.
 */
