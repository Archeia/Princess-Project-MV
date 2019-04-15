/*=============================================================================
 * AEL - All Touch Trigger
 * Version 1.0.0
//=============================================================================
/*:
 * @plugindesc <AllTouch> Gives an event the property All Touch.
 * @author Archeia and TDS
 *
 * @help This plugin provides a 3rd option for trigger events. All Touch.
 * By default you can only have either Player Touch or Event Touch, you cannot
 * have both at once.
 *
 * How to Use: 
 * Place in the Event's Notetag field, <AllTouchTrigger>
 * Change the event's trigger action to Player Touch.
 *
*/
var Imported = Imported || {};
Imported.AEL_AllTouch = true;

//=============================================================================
// ** Parameter Check
//=============================================================================
var parameters = $plugins.filter(function(p) {
    return p.description.contains('<AEL_AllTouch>')
})[0].parameters;

//=============================================================================
// ** Game_Event
//-----------------------------------------------------------------------------
// The game object class for an event. It contains functionality for event page
// switching and running parallel process events.
//=============================================================================
// * Determine if Event is All Touch Trigger
//=============================================================================
Game_Event.prototype.isEventAllTouchTrigger = function() { return this.event().meta.AllTouchTrigger; };
//=============================================================================
// * Check Event Trigger Touch
//=============================================================================
var multiTriggercheckEventTriggerTouch = Game_Event.prototype.checkEventTriggerTouch
Game_Event.prototype.checkEventTriggerTouch = function(x, y) {
    // Run Original Function
    multiTriggercheckEventTriggerTouch.call(this, x, y);
    // If It's an all touch event and its not starting already
    if (this.isEventAllTouchTrigger() && !this.isStarting()) {
        if (!$gameMap.isEventRunning()) {
            if ($gamePlayer.pos(x, y)) {
                if (!this.isJumping() && this.isNormalPriority()) {
                    this.start();
                };
            };
        };
    };
};