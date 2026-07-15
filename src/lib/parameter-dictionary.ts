
export interface ParameterDefinition {
  name: string;
  label: string;
  value: string;
  command: (value: string) => string;
  groupName: string;
  step?: number;
  getOptionLabel?: (val: string) => string;
}

export const PARAMETER_DICTIONARY: ParameterDefinition[] = [
  { 
    name: "PHP", 
    label: "Home Page", 
    value: "", 
    command: (val) => "PHP" + val, 
    groupName: "other",
    step: 1, 
    getOptionLabel: (it) => ({
      "0": "Home",
      "1": "Solar",
      "2": "Ac",
      "3": "Battery",
      "4": "Internal",
      "5": "Load",
      "6": "Event"
    } as Record<string, string>)[it] || it
  },
  { name: "WFE", label: "Wi-Fi Enable", value: "", command: (val) => "WFE" + val, groupName: "other" },
  { name: "BZ", label: "Alarm Status", value: "", command: (val) => val === "0" ? "PDa" : "PEa", groupName: "buzzer" },
  { 
    name: "DLI", 
    label: "Data Log Stored Period", 
    value: "", 
    command: (val) => "DLI" + val, 
    groupName: "other",
    step: 1, 
    getOptionLabel: (it) => ({
      "0": "1 Week",
      "1": "2 Weeks",
      "2": "3 Weeks",
      "3": "4 Weeks",
      "4": "5 Weeks",
      "5": "6 Weeks",
      "6": "7 Weeks"
    } as Record<string, string>)[it] || it
  },
  { 
    name: "SCE", 
    label: "Screen Off", 
    value: "", 
    command: (val) => "SCE" + val, 
    groupName: "other",
    step: 1, 
    getOptionLabel: (it) => ({
      "0": "Disable",
      "1": "3 Min",
      "2": "5 Min"
    } as Record<string, string>)[it] || it
  },
  { 
    name: "LEDC1", 
    label: "LED Color 1",  
    value: "", 
    command: (val) => "PLEDC1" + val.split(",").map(it => it.toString().padStart(3, '0')).join(""), 
    groupName: "other",
    step: 1, 
    getOptionLabel: (it) => ({
      "148000255": "Purple",
      "255020147": "Pink",
      "255069000": "Orange",
      "255180000": "Yellow",
      "000255000": "Green",
      "000000255": "Blue",
      "000139139": "Sky Blue",
      "aaabbbccc": "Other"
    } as Record<string, string>)[it] || it
  },
  { name: "LDP", label: "LCD Display Escape To Default Page After 1Min Timeout", value: "", command: (val) => val === "0" ? "PDk" : "PEk", groupName: "other" },
  { name: "BLS", label: "Backlight Status", value: "", command: (val) => val === "0" ? "PDx" : "PEx", groupName: "other" },
  { name: "FCR", label: "Fault Code Record", value: "", command: (val) => val === "0" ? "PDz" : "PEz", groupName: "other" },
  { name: "APS", label: "Alarm On When Primary Source Interrupt", value: "", command: (val) => val === "0" ? "PDy" : "PEy", groupName: "other" },
  { name: "FGS", label: "Feed Grid Status", value: "", command: (val) => val === "0" ? "PDd" : "PEd", groupName: "pv" },
  { name: "VO", label: "Output Voltage(V)", value: "", command: (val) => "V" + val, groupName: "output", step: 10 },
  { name: "FO", label: "Output Frequency(Hz)", value: "", command: (val) => "F" + val, groupName: "output", step: 10 },
  { 
    name: "PO", 
    label: "Output Priority", 
    value: "", 
    command: (val) => "POP0" + val, 
    groupName: "output",
    step: 1, 
    getOptionLabel: (it) => ({
      "0": "USB",
      "1": "SUB",
      "2": "SBU"
    } as Record<string, string>)[it] || it
  },
  { 
    name: "PC", 
    label: "Charge Priority", 
    value: "", 
    command: (val) => "PCP0" + val, 
    groupName: "battery",
    step: 1, 
    getOptionLabel: (it) => ({
      "1": "Solar first",
      "2": "Utility + Solar",
      "3": "Solar only"
    } as Record<string, string>)[it] || it
  },
  { name: "BCRC", label: "Battery Capacity Re-Charge(%)", value: "", command: (val) => "PBCC" + val.toString().padStart(3, '0'), groupName: "battery", step: 5 },
  { name: "BCRD", label: "Battery Capacity Re-Discharge(%)", value: "", command: (val) => "PBDC" + val.toString().padStart(3, '0'), groupName: "battery", step: 5 },
  { name: "BCU", label: "Battery Capacity Under(%)", value: "", command: (val) => "PSDC" + val.toString().padStart(3, '0'), groupName: "battery", step: 1 },
  { name: "MCC", label: "Max Charge Current(A)", value: "", command: (val) => "MNCHGC" + val.toString().padStart(3, '0'), groupName: "battery", step: 10 },
  { name: "MCG", label: "Max AC Charge Current(A)", value: "", command: (val) => "MUCHGC" + val.toString().padStart(3, '0'), groupName: "battery", step: 10 },
  { name: "MDC", label: "Max Disharge Current", value: "", command: (val) => "PBATMAXDISC" + val.toString().padStart(3, '0'), groupName: "battery", step: 10 },
  { 
    name: "IVR", 
    label: "Input Voltage Range", 
    value: "", 
    command: (val) => "PGR0" + val, 
    groupName: "grid",
    step: 1, 
    getOptionLabel: (it) => ({
      "0": "Appliance",
      "1": "UPS"
    } as Record<string, string>)[it] || it
  },
  { name: "OLR", label: "Over Load Restart", value: "", command: (val) => val === "0" ? "PDu" : "PEu", groupName: "output" },
  { name: "OTR", label: "Over Temperature Restart", value: "", command: (val) => val === "0" ? "PDv" : "PEv", groupName: "other" },
  { name: "OLB", label: "Over Load Bypass", value: "", command: (val) => val === "0" ? "PDb" : "PEb", groupName: "output" },
  { name: "BFE", label: "Feed Grid Enable", value: "", command: (val) => val === "0" ? "PDd" : "PEd", groupName: "battery" },
  { name: "FMP", label: "Feed Grid Max Power(W)", value: "", command: (val) => "PGFMP" + (val.length === 3 ? "0" : "") + val, groupName: "grid" },
  { name: "BT", label: "Battery Type", value: "", command: (val) => "PBT0" + val, groupName: "battery", step: 1,  getOptionLabel: (it) => ({
        "0": "AGM",
        "1": "Flooded",
        "2": "User",
        "3": "PYLON",
        "4": "BYD",
        "5": "WECO",
        "6": "Soltaro",
        "7": "LIA",
        "8": "LIB",
        "9": "LIC",
        "10": "ISC",
        "11": "IPW"
    } as Record<string, string>)[it] || it,
  },
  { name: "BRC", label: "Battery Voltage Re-Charge When Grid Is Available(V)", value: "", command: (val) => "PBCV" + (+val / 10).toFixed(1), groupName: "battery", step: 5, getOptionLabel: (it) => (+it / 10).toString() },
  { name: "BRD", label: "Battery Voltage Re-Discharge When Grid Is Available(V)", value: "", command: (val) => "PBDV" + (+val / 10).toFixed(1), groupName: "battery", step: 5, getOptionLabel: (it) => (+it / 10).toString() },
  { name: "BVM", label: "Battery Voltage C.V(V)", value: "", command: (val) => "PCVV" + (+val / 10).toFixed(1), groupName: "battery", step: 1, getOptionLabel: (it) => (+it / 10).toString() },
  { name: "BVF", label: "Battery Voltage Float(V)", value: "", command: (val) => "PBFT" + (+val / 10).toFixed(1), groupName: "battery", step: 1, getOptionLabel: (it) => (+it / 10).toString() },
  { name: "BVU", label: "Battery Voltage Under When Grid Is Unavailable(V)", value: "", command: (val) => "PSDV" + (+val / 10).toFixed(1), groupName: "battery", step: 1, getOptionLabel: (it) => (+it / 10).toString() },
  { name: "EQV", label: "Equalization Voltage(V)", value: "", command: (val) => "PBEQV" + (+val / 10).toFixed(2), groupName: "battery", step: 1, getOptionLabel: (it) => (+it / 10).toString() },
  { name: "EQT", label: "Equalization Time(MIN)", value: "", command: (val) => "PBEQT" + val.toString().padStart(3, '0'), groupName: "battery", step: 5 },
  { name: "EQP", label: "Equalization Period(MIN)", value: "", command: (val) => "PBEQOT" + val.toString().padStart(3, '0'), groupName: "battery", step: 5 },
  { name: "EQI", label: "Equalization Interval(D)", value: "", command: (val) => "PBEQP" + val.toString().padStart(3, '0'), groupName: "battery", step: 1 },
  { name: "EQ", label: "Equalization", value: "", command: (val) => "PBEQE" + val, groupName: "battery" },
  { name: "EQA", label: "Active Or Inactive Battery Equalization Now", value: "", command: (val) => "PBEQA" + val, groupName: "battery" },
];

export type ParamValueType = {
  current: string;
  options?: string[];
  range?: { min: number; max: number };
};

export function parseParamValue(raw: string): ParamValueType {
  const parts = raw.split(' ');
  const current = parts[0];
  if (parts.length === 1) {
    return { current };
  }

  const secondPart = parts[1];
  if (secondPart.includes(',')) {
    // Check if it's a mix like "270 0,240~290"
    const options: string[] = [];
    let range: { min: number; max: number } | undefined;

    const subParts = secondPart.split(',');
    for (const p of subParts) {
      if (p.includes('~')) {
        const [rmin, rmax] = p.split('~').map(Number);
        range = { min: rmin, max: rmax };
      } else {
        options.push(p);
      }
    }
    return { current, options, range };
  } else if (secondPart.includes('~')) {
    const [min, max] = secondPart.split('~').map(Number);
    return { current, range: { min, max } };
  }

  return { current };
}
