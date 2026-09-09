/**
 * Garment Industry Machinery Taxonomy & Standards
 * Aligned with global apparel IE standards (Coats GSD, FastReact, Lectra).
 */

export interface MachineCategory {
  category: string;
  types: string[];
}

export const GARMENT_MACHINE_CATEGORIES: MachineCategory[] = [
  {
    category: "Lockstitch (301)",
    types: [
      "Single Needle Lockstitch (SNLS)",
      "Single Needle Lockstitch with UBT",
      "Double Needle Lockstitch (DNLS)",
      "Heavy Duty Lockstitch",
    ],
  },
  {
    category: "Overlock / Serger (500)",
    types: [
      "3-Thread Overlock (3T-OL)",
      "4-Thread Overlock (4T-OL)",
      "5-Thread Overlock / Safety Stitch (5T-OL)",
      "6-Thread Overlock",
    ],
  },
  {
    category: "Coverstitch / Interlock (400 / 600)",
    types: [
      "Flatlock / Interlock (Cylinder Bed)",
      "Flatlock / Interlock (Flat Bed)",
      "Feed-off-the-Arm Chainstitch (FOA)",
      "Multi-Needle Chainstitch",
      "Kansai Special Elastic Machine",
    ],
  },
  {
    category: "Specialized & Automated Workstations",
    types: [
      "Buttonhole Machine (BH)",
      "Eyelet Buttonhole Machine",
      "Button Attach Machine (BA)",
      "Bar Tack Machine (BT)",
      "Blind Stitch / Hemmer",
      "Zig-Zag Stitch Machine",
      "Elastic Attaching Machine with Metering",
      "Programmable Pattern Sewer / Auto-Jig",
      "Pocket Welting Machine",
    ],
  },
  {
    category: "Pressing & Fusing (Finishing)",
    types: [
      "Steam Iron / Pressing Table",
      "Vacuum Ironing Station",
      "Continuous Fusing Machine",
      "Collar & Cuff Pressing Machine",
      "Thread Sucking / Blower Station",
    ],
  },
  {
    category: "Manual, Inspection & Packing Stations",
    types: [
      "Manual / Helper Work",
      "Thread Trimming Station",
      "Initial / Inline Inspection Table",
      "Measurement Table",
      "Final Inspection Table",
      "Manual / Folding Table",
      "Manual / Packing Table",
      "Manual / Carton Station",
    ],
  },
];

/** Flat list of all preset machine types */
export const ALL_GARMENT_MACHINE_PRESETS = GARMENT_MACHINE_CATEGORIES.flatMap((c) => c.types);

/**
 * Normalizes and merges active machinery from the factory database with standard industry presets.
 */
export function getUnifiedMachineTypes(inventoryMachineTypes: string[] = []): string[] {
  const merged = new Set<string>();

  // Add standard presets
  ALL_GARMENT_MACHINE_PRESETS.forEach((m) => merged.add(m));

  // Add any custom machine types found in inventory
  inventoryMachineTypes.forEach((m) => {
    if (m && m.trim()) {
      merged.add(m.trim());
    }
  });

  return Array.from(merged);
}
