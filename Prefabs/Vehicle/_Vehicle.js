var defaultVehicleViewRange = 1 / 4;

function generateNew(obs, src, posX, posY) {
    var types = require("../../ObjectTypes");
    var collisions = require("../../Collisions");
    var prefabs = require("../Prefabs");

    return {
        type: types.ObjectTypes.VEHICLE,
        x: posX,
        y: posY,
        velocityX: 0,
        velocityY: 0,
        facing: 0,
        currentEquipment: undefined,
        equipment: [ ],
        viewRange: defaultVehicleViewRange,
        rider: undefined,
        deathrattle: (obs, selfId) => {
            if (obs[selfId].rider) {
                delete obs[obs[selfId].interactableId];
                var rider = obs[selfId].rider;

                // Reset velocities and position
                rider.velocityX = 0;
                rider.velocityY = 0;
                rider.x = obs[selfId].x;
                rider.y = obs[selfId].y;

                delete obs[selfId];
                obs[selfId] = rider;
            } else {
                delete obs[obs[selfId].interactableId];
                delete obs[selfId];
            }
        },
        update: (obs, selfId, delta) => {
            // Calculate car movement
            obs[selfId].x += obs[selfId].velocityX * delta;
            obs[selfId].y += obs[selfId].velocityY * delta;

            if (obs[obs[selfId].interactableId]) {
                obs[obs[selfId].interactableId].x = obs[selfId].x;
                obs[obs[selfId].interactableId].y = obs[selfId].y;
            }

            // Check collisions with terrain and reposition accordingly
            collisions.checkCollisions(selfId, obs, prefabs.renderSize, (srcId, collisionId) => {
                if (obs[srcId] && collisionId != srcId){
                    switch (obs[collisionId].type) {
                        case types.ObjectTypes.TERRAIN:
                        case types.ObjectTypes.VEHICLE:
                            // Push object back out of collision terrain towards which ever side is the closest to the terrain object
                            var distRight = Math.abs((obs[collisionId].x - obs[collisionId].hitboxWidth * prefabs.renderSize / 2) - (obs[srcId].x + obs[srcId].hitboxWidth * prefabs.renderSize / 2));
                            var distLeft =  Math.abs((obs[collisionId].x + obs[collisionId].hitboxWidth * prefabs.renderSize / 2) - (obs[srcId].x - obs[srcId].hitboxWidth * prefabs.renderSize / 2));
                            var distUp =    Math.abs((obs[collisionId].y + obs[collisionId].hitboxHeight * prefabs.renderSize / 2) - (obs[srcId].y - obs[srcId].hitboxHeight * prefabs.renderSize / 2));
                            var distDown =  Math.abs((obs[collisionId].y - obs[collisionId].hitboxHeight * prefabs.renderSize / 2) - (obs[srcId].y + obs[srcId].hitboxHeight * prefabs.renderSize / 2));
                            
                            if (distRight < distLeft && distRight < distUp && distRight < distDown) {
                                obs[srcId].x = obs[srcId].x - distRight;
                            }
                            if (distLeft < distRight && distLeft < distUp && distLeft < distDown) {
                                obs[srcId].x = obs[srcId].x + distLeft;
                            }
                            if (distUp < distRight && distUp < distLeft && distUp < distDown) {
                                obs[srcId].y = obs[srcId].y + distUp;
                            }
                            if (distDown < distRight && distDown < distLeft && distDown < distUp) {
                                obs[srcId].y = obs[srcId].y - distDown;
                            }
                            break;
                    }
                }
            });
        },
        mouseDown: (obs, mouseEvent) => { },
        onPlayerInput: (obs, selfId, playerInput) => {
            player = obs[selfId];
            var xDir = 0;
            var yDir = 0;

            if (playerInput.left) {
                xDir -= 1;
            }
            if (playerInput.right) {
                xDir += 1;
            }
    
            if (playerInput.up) {
                yDir -= 1;
            }
            if (playerInput.down) {
                yDir += 1;
            }

            player.velocityX = xDir * player.speed;
            player.velocityY = yDir * player.speed;
            
            if (xDir != 0 || yDir != 0) {
                player.facing = (Math.atan(player.velocityY / player.velocityX) * 57.2958 + 90) +(xDir < 0 ? 180 : 0);
            }

            if (xDir != 0) {
                player.hitboxWidth = obs[selfId].height;
                player.hitboxHeight = obs[selfId].width;
            }
            if (yDir != 0) {
                player.hitboxWidth = obs[selfId].width;
                player.hitboxHeight = obs[selfId].height;
            }
            
            if (playerInput.pickup) {
                var newVechicleId = selfId + ":" + obs[selfId].type + ":" + obs[selfId].subtype + ":" + obs[selfId].x + ":" + obs[selfId].y;
                obs[obs[selfId].interactableId].vehicleId = newVechicleId;
                obs[newVechicleId] = obs[selfId];
                delete obs[selfId];
                obs[selfId] = obs[newVechicleId].rider;
                obs[newVechicleId].rider = undefined;

                // Reset velocities and position
                obs[selfId].velocityX = 0;
                obs[selfId].velocityY = 0;
                obs[newVechicleId].velocityX = 0;
                obs[newVechicleId].velocityY = 0;
                obs[selfId].x = obs[newVechicleId].x + obs[newVechicleId].width / 2 + obs[selfId].width / 2;
                obs[selfId].y = obs[newVechicleId].y;
            }
        },
        damage: (obs, selfId, amount) => {
            obs[selfId].health -= amount;

            if (obs[selfId].health <= 0){
                obs[selfId].deathrattle(obs, selfId);
            }
        },
    };
}

module.exports = {
    generateNew: generateNew,
}
