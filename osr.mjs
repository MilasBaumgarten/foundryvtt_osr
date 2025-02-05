import { HeroDataModel, NpcDataModel } from "./module/data-models.mjs";
import { SystemActor, SystemItem } from "./module/documents.mjs";
import { PlayerActorSheet } from "./module/sheets/actor-sheet.mjs";
// Import helper/utility classes and constants.
import { OSR } from './helpers/config.mjs';

Hooks.once("init", () => {
  // Add custom constants for configuration.
  CONFIG.OSR = OSR;

  // Configure custom Document implementations.
  CONFIG.Actor.documentClass = SystemActor;
  CONFIG.Item.documentClass = SystemItem;

  // Configure System Data Models.
  CONFIG.Actor.dataModels = {
    hero: HeroDataModel,
    npc: NpcDataModel
  };

  // Configure sheet classes.
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('osr', PlayerActorSheet, {
    makeDefault: true,
    label: 'OSR.SheetLabels.Actor',
  });

  // Configure trackable attributes.
  CONFIG.Actor.trackableAttributes = {
    hero: {
      bar: ["resources.health.value"],
      value: ["resources.armorClass.total"]
    }
  };
});