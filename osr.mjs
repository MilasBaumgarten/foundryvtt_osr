import { PcDataModel, NpcDataModel } from "./module/data-models.mjs";
import { SystemActor } from "./module/documents.mjs";
import { PlayerActorSheet } from "./module/sheets/actor-sheet.mjs";
import { NPCSheet } from "./module/sheets/npc-sheet.mjs";
// Import helper/utility classes and constants.
import { OSR } from './helpers/config.mjs';

Hooks.once("init", async () => {
  // Add custom constants for configuration.
  CONFIG.OSR = OSR;

  // Configure custom Document implementations.
  CONFIG.Actor.documentClass = SystemActor;

  // Configure System Data Models.
  CONFIG.Actor.dataModels = {
    pc: PcDataModel,
    npc: NpcDataModel
  };

  // Configure sheet classes.
  Actors.unregisterSheet('core', ActorSheet);

  // Players
  Actors.registerSheet('osr', PlayerActorSheet, {
    types: ["pc"], // Restrict to PC-type actors
    makeDefault: true,
    label: 'OSR.SheetLabels.PC',
  });

  // NPCs
  Actors.registerSheet("osr", NPCSheet, {
    types: ["npc"], // Restrict to NPC-type actors
    makeDefault: true, // Make this the default for NPC actors
    label: 'OSR.SheetLabels.NPC',
  });

  // Configure trackable attributes.
  CONFIG.Actor.trackableAttributes = {
    pc: {
      bar: ["resources.health.value"],
      value: ["resources.health.total"]
    }
  };
});

