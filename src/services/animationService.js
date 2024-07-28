import { SOUNDS} from "../constants/moduleData";
import {ANIMATION, ANIMATION_FREE, ANIMATION_MODULES, ANIMATION_NAME, ANIMATION_TYPE} from "../constants/animationData";
import {UtilityService, TokenService} from "@phoenix-modules/common-library";

export function animateWallOfForce(maxDistance, radians, rotation, duration) {
    const animation = getAnimation(ANIMATION_NAME.WallOfForce);
    if(!animation) return;
    
    const sequence = new Sequence();
    const stepDistance = canvas.grid.size;
    
    for (let i = 0; i <= maxDistance; i += stepDistance) {
        const x = initialX + Math.cos(standardRadians) * i;
        const y = initialY + Math.sin(standardRadians) * i;

        sequence.effect()
            .file(animation) 
            .atLocation({ x, y })
            .persist()
            .spriteRotation(rotation)
            .scale({ x: 0.125, y: 0.5 })
            .fadeIn(500)
            .fadeOut(500)
            .name(`wall-of-force-animation-${i / stepDistance}`); // Name the animation for later removal

        sequence.sound()
            .file(SOUNDS.WallOfForce)
            .radius(4)
            .duration(duration * 1000)
            .volume(0.1)
            .atLocation({ x: x, y: y })
    }

    sequence.play();
}

export function animateSkunkSmell(token, duration) {
    const animation = getAnimation(ANIMATION_NAME.SkunkSmell);
    if(!animation) return;
    
    new Sequence().effect()
        .file(animation)
        .attachTo(token, { bindVisibility: false })
        .duration(duration * 1000)
        .scale(0.5)
        .play()    
}

export function animateSnakeSpawn(casterToken, snakeToken) {
    if(!TokenService.IsTokenDocument(snakeToken)) return;
    
    const animationBeam = getAnimation(ANIMATION_NAME.SnakeBeam);
    const animationSpawn = getAnimation(ANIMATION_NAME.SnakeSpawn);
    if(!animationBeam) return;
    
    new Sequence().animation().on(snakeToken).fadeIn(500).delay(1000).play();
    
    new Sequence().effect().atLocation(casterToken).stretchTo(snakeToken).file(animationBeam).delay(100).play();
    
    new Sequence().effect().atLocation(snakeToken).file(animationSpawn).delay(1000).scale(0.25).play();
}

export function animateItchyClothes(token, duration) {
    const animation = getAnimation(ANIMATION_NAME.ItchyClothes);
    new Sequence().effect()
        .file(animation)
        .attachTo(token, { bindVisibility: false })
        .duration(duration)
        .scale(0.5)
        .play()
}

function getAnimationType() {
    if(UtilityService.isModuleInstalledAndActive(ANIMATION_MODULES.Jb2aPatreon)) return ANIMATION_TYPE.Patreon;
    if(UtilityService.isModuleInstalledAndActive(ANIMATION_MODULES.Jb2aFree)) return ANIMATION_TYPE.Free;
    return ANIMATION_TYPE.None;
}

function getAnimation(AnimationName) {
    const animationType = getAnimationType();
    if(animationType === ANIMATION_TYPE.None) return null;
    return animationType === ANIMATION_TYPE.Patreon ? ANIMATION[AnimationName] : ANIMATION_FREE[AnimationName];    
}

