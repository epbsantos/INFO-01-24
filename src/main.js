import { dialogueData, scaleFactor } from "./constants";
import { displayDialogue, setCamScale } from "./utils";
import { k } from "./kaboomCtx";

k.loadSprite("char", "./char.png", {
  sliceX: 3,
  sliceY: 3,
  anims: {
    "idle-down": 3,
    "walk-down": { from: 3, to: 5, loop: true, speed: 8 },
    "idle-side": 0,
    "walk-side": { from: 0, to: 2, loop: true, speed: 8 },
    "idle-up": 6,
    "walk-up": { from: 6, to: 8, loop: true, speed: 8 },
  },
});

k.loadSprite("newChar", "./newChar.png", {
  sliceX: 3,
  sliceY: 3,
  anims: {
    "idle-down": 3,
    "walk-down": { from: 3, to: 5, loop: true, speed: 8 },
    "idle-side": 0,
    "walk-side": { from: 0, to: 2, loop: true, speed: 8 },
    "idle-up": 6,
    "walk-up": { from: 6, to: 8, loop: true, speed: 8 },
  },
});

k.loadSprite("map1", "./mapa-v1.png");
k.loadSprite("map2", "./mapa-v1-topo.png");
k.loadSprite("map3", "./mapa-v1-brilho.png", {
  sliceX: 2,
  sliceY: 1,
  anims: {
    "default": { from: 0, to: 1, loop: true, speed: 3 },
  },
});

k.setBackground(k.Color.fromHex("#59b6d8"));

k.scene("main", async () => {
  const mapData = await (await fetch("./mapa-3.json")).json();
  const layers = mapData.layers;

  const map1 = k.add([
    k.sprite("map1"), 
    k.pos(0), 
    k.z(0),
    k.scale(scaleFactor)
  ]);

  const details = k.add([
    k.sprite("map2"), 
    k.pos(0), 
    k.z(2),
    k.scale(scaleFactor)
  ]);

  const light = k.add([
    k.sprite("map3", { anim: "default" }), 
    k.pos(0), 
    k.z(3),
    k.scale(scaleFactor)
  ]);

  const player = k.add([
    k.sprite("char", { anim: "idle-down" }),
    k.area({
      shape: new k.Rect(k.vec2(0, 3), 16, 16),
    }),
    k.body(),
    k.anchor("center"),
    k.pos(),
    k.scale(scaleFactor),
    k.z(1),
    {
      speed: 200,
      direction: "down",
      isInDialogue: false,
    },
    "player",
  ]);
  
  // Supondo que `roadBounds` represente os limites da estrada
const roadBounds = {
  x: 100, // coordenada x do canto superior esquerdo
  y: 200, // coordenada y do canto superior esquerdo
  width: 300, // largura da estrada
  height: 100, // altura da estrada
};

const newPlayer = k.add([
  k.sprite("newChar", { anim: "idle-down" }),
  k.area({
    shape: new k.Rect(k.vec2(0, 3), 16, 16),
  }),
  k.body(),
  k.anchor("center"),
  k.pos(
    roadBounds.x + Math.random() * roadBounds.width, // coordenada x aleatória dentro dos limites da estrada
    roadBounds.y + Math.random() * roadBounds.height // coordenada y aleatória dentro dos limites da estrada
  ),
  k.scale(scaleFactor),
  k.z(1),
  {
    speed: 200,
    direction: "down",
    isInDialogue: false,
  },
  "newPlayer",
]);

  
  

  for (const layer of layers) {
    if (layer.name === "boundaries") {
      for (const boundary of layer.objects) {
        map1.add([
          k.area({
            shape: new k.Rect(k.vec2(0), boundary.width, boundary.height),
          }),
          k.body({ isStatic: true }),
          k.pos(boundary.x, boundary.y),
          boundary.name,
        ]);

        player.onCollide(boundary.name, () => {
          player.isInDialogue = true;
          displayDialogue(
            dialogueData[boundary.name],
            () => (player.isInDialogue = false)
          );
        });

        newPlayer.onCollide(boundary.name, () => {
          newPlayer.isInDialogue = true;
          displayDialogue(
            dialogueData[boundary.name],
            () => (newPlayer.isInDialogue = false)
          );
        });
      }
    }

    if (layer.name === "start") {
      for (const entity of layer.objects) {
        if (entity.name === "player") {
          player.pos = k.vec2(
            (map1.pos.x + entity.x) * scaleFactor,
            (map1.pos.y + entity.y) * scaleFactor
          );
        }
      }
    }
  }

  setCamScale(k);

  k.onResize(() => {
    setCamScale(k);
  });

  k.onUpdate(() => {
    k.camPos(player.worldPos().x, player.worldPos().y - 100);
  });

  function handleMovement(character, keyMap) {
    let nbOfKeyPressed = 0;
    for (const key of keyMap) {
      if (key) {
        nbOfKeyPressed++;
      }
    }
    if (nbOfKeyPressed > 1) return;

    if (character.isInDialogue) return;
    if (keyMap[0]) {
      character.flipX = true;
      if (character.curAnim() !== "walk-side") character.play("walk-side");
      character.direction = "right";
      character.move(character.speed, 0);
      return;
    }
    if (keyMap[1]) {
      character.flipX = false;
      if (character.curAnim() !== "walk-side") character.play("walk-side");
      character.direction = "left";
      character.move(-character.speed, 0);
      return;
    }
    if (keyMap[2]) {
      if (character.curAnim() !== "walk-up") character.play("walk-up");
      character.direction = "up";
      character.move(0, -character.speed);
      return;
    }
    if (keyMap[3]) {
      if (character.curAnim() !== "walk-down") character.play("walk-down");
      character.direction = "down";
      character.move(0, character.speed);
    }
  }

  k.onKeyDown((key) => {
    const playerKeyMap = [
      k.isKeyDown("right"),
      k.isKeyDown("left"),
      k.isKeyDown("up"),
      k.isKeyDown("down"),
    ];

    const newPlayerKeyMap = [
      k.isKeyDown("d"),
      k.isKeyDown("a"),
      k.isKeyDown("w"),
      k.isKeyDown("s"),
    ];

    handleMovement(player, playerKeyMap);
    handleMovement(newPlayer, newPlayerKeyMap);
  });

  function stopAnims(character) {
    if (character.direction === "down") {
      character.play("idle-down");
      return;
    }
    if (character.direction === "up") {
      character.play("idle-up");
      return;
    }
    character.play("idle-side");
  }

  k.onMouseRelease(() => {
    stopAnims(player);
    stopAnims(newPlayer);
  });

  k.onKeyRelease(() => {
    stopAnims(player);
    stopAnims(newPlayer);
  });


});


k.go("main");
