const fs = require('fs');
let text = fs.readFileSync('src/simulation/mission.ts', 'utf8');

text = text.replace(/kind: 'bus' \| 'component' \| 'instrument'/g, "kind: 'bus' | 'component' | 'instrument' | 'launch_vehicle'");
text = text.replace(/communications: number/g, "communications: number\n  fuelUse: number\n  fuelSupply: number");

text = text.replace(/science: 0, communications: 0, description:/g, 'science: 0, communications: 0, fuelUse: 0, fuelSupply: 0, description:');
text = text.replace(/science: 20, communications: 0, description:/g, 'science: 20, communications: 0, fuelUse: 0, fuelSupply: 0, description:');
text = text.replace(/science: 35, communications: 0, description:/g, 'science: 35, communications: 0, fuelUse: 0, fuelSupply: 0, description:');
text = text.replace(/science: 28, communications: 0, description:/g, 'science: 28, communications: 0, fuelUse: 0, fuelSupply: 0, description:');
text = text.replace(/communications: 50, description:/g, 'communications: 50, fuelUse: 0, fuelSupply: 0, description:');

text = text.replace(
  /export const MISSION_LIMITS = { budget: 780, mass: 301 } as const/,
  'export const MISSION_LIMITS = { budget: 1000, mass: 450 } as const'
);

const lv_items = `
  { id: 'lv_light', name: 'Light Booster', kind: 'launch_vehicle', cost: 100, mass: 0, powerUse: 0, powerSupply: 0, science: 0, communications: 0, fuelUse: 0, fuelSupply: 150, description: 'Affordable, provides basic launch fuel capacity.' },
  { id: 'lv_heavy', name: 'Heavy Booster', kind: 'launch_vehicle', cost: 300, mass: 0, powerUse: 0, powerSupply: 0, science: 0, communications: 0, fuelUse: 0, fuelSupply: 350, description: 'Allows larger scientific payloads but costs more.' },`;

text = text.replace(/export const MISSION_ITEMS: SimulatedItem\[\] = \[/, "export const MISSION_ITEMS: SimulatedItem[] = [" + lv_items);

text = text.replace(/id: 'bus',([^}]+)fuelUse: 0, fuelSupply: 0/, "id: 'bus',$1fuelUse: 50, fuelSupply: 0");
text = text.replace(/id: 'solar',([^}]+)fuelUse: 0, fuelSupply: 0/, "id: 'solar',$1fuelUse: 20, fuelSupply: 0");
text = text.replace(/id: 'rtg',([^}]+)fuelUse: 0, fuelSupply: 0/, "id: 'rtg',$1fuelUse: 50, fuelSupply: 0");
text = text.replace(/id: 'camera',([^}]+)fuelUse: 0, fuelSupply: 0/, "id: 'camera',$1fuelUse: 10, fuelSupply: 0");
text = text.replace(/id: 'spectrometer',([^}]+)fuelUse: 0, fuelSupply: 0/, "id: 'spectrometer',$1fuelUse: 15, fuelSupply: 0");
text = text.replace(/id: 'drill',([^}]+)fuelUse: 0, fuelSupply: 0/, "id: 'drill',$1fuelUse: 25, fuelSupply: 0");

text = text.replace(/communications: total.communications \+ item.communications,/g, 
  "communications: total.communications + item.communications,\n    fuelUse: total.fuelUse + item.fuelUse,\n    fuelSupply: total.fuelSupply + item.fuelSupply,");
text = text.replace(/communications: 0 }\)/g, "communications: 0, fuelUse: 0, fuelSupply: 0 })");

text = text.replace(/\+ Number\(sum.powerUse > sum.powerSupply\)/, "+ Number(sum.powerUse > sum.powerSupply)\n    + Number(sum.fuelUse > sum.fuelSupply)");

// change mission phases and events
text = text.replace(/=> number {/, "=> number {\n// mission events randomly fail instruments or cut comms");

fs.writeFileSync('src/simulation/mission.ts', text);
